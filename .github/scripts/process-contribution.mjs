/**
 * Process contribution issues and create PRs.
 *
 * Triggered when a maintainer adds the "approved" label to a contribution issue.
 * 1. Extracts JSON from the issue body (fenced ```json block)
 * 2. Determines contribution type from labels
 * 3. Validates required fields
 * 4. Adds data to the appropriate JSON file
 * 5. Creates a branch and PR
 * 6. Comments on the issue with the PR link
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const {
  GITHUB_TOKEN,
  ISSUE_NUMBER,
  ISSUE_BODY,
  ISSUE_TITLE,
  ISSUE_LABELS,
} = process.env;

const REPO_OWNER = 'ilkerzg';
const REPO_NAME = 'awesome-video-prompts';
const CUSTOM_PROMPTS_PATH = 'apps/web/public/data/custom-prompts.json';

// ── GitHub API helpers ────────────────────────────────

async function ghApi(endpoint, options = {}) {
  const url = endpoint.startsWith('https')
    ? endpoint
    : `https://api.github.com${endpoint}`;

  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: `token ${GITHUB_TOKEN}`,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`GitHub API ${res.status}: ${body}`);
  }

  return res.json();
}

async function commentOnIssue(body) {
  await ghApi(`/repos/${REPO_OWNER}/${REPO_NAME}/issues/${ISSUE_NUMBER}/comments`, {
    method: 'POST',
    body: JSON.stringify({ body }),
  });
}

async function addLabel(label) {
  await ghApi(`/repos/${REPO_OWNER}/${REPO_NAME}/issues/${ISSUE_NUMBER}/labels`, {
    method: 'POST',
    body: JSON.stringify({ labels: [label] }),
  });
}

// ── Parse issue ───────────────────────────────────────

function extractJson(body) {
  const match = body.match(/```json\s*\n([\s\S]*?)\n```/);
  if (!match) return null;
  try {
    return JSON.parse(match[1]);
  } catch {
    return null;
  }
}

function getContributionType(labelsJson) {
  const labels = JSON.parse(labelsJson || '[]').map(l => l.name);
  if (labels.includes('multi-shot')) return 'multi-shot-prompt';
  if (labels.includes('prompt')) return 'custom-prompt';
  if (labels.includes('element')) return 'prompt-element';
  if (labels.includes('category')) return 'prompt-category';
  return 'custom-prompt'; // default
}

// ── Validation ────────────────────────────────────────

function validatePrompt(data) {
  const errors = [];
  if (!data.id || typeof data.id !== 'string') errors.push('Missing or invalid "id"');
  if (!data.title || typeof data.title !== 'string') errors.push('Missing or invalid "title"');
  if (!data.prompt || typeof data.prompt !== 'string') errors.push('Missing or invalid "prompt"');
  if (!data.category || typeof data.category !== 'string') errors.push('Missing or invalid "category"');
  return errors;
}

// ── Build searchTerms ─────────────────────────────────

function buildSearchTerms(data) {
  const terms = new Set();
  if (data.title) terms.add(data.title.toLowerCase());
  if (data.description) terms.add(data.description.toLowerCase());
  if (data.prompt) terms.add(data.prompt.toLowerCase().slice(0, 200));
  if (data.category) terms.add(data.category.toLowerCase());
  if (Array.isArray(data.tags)) {
    data.tags.forEach(t => terms.add(String(t).toLowerCase()));
  }
  if (data.promptType) terms.add(data.promptType);
  return [...terms];
}

// ── Regenerate metadata ───────────────────────────────

function regenerateMetadata(prompts) {
  const categories = [...new Set(prompts.map(p => p.category).filter(Boolean))];
  const sources = [...new Set(prompts.map(p => {
    const src = typeof p.source === 'object' ? p.source?.type : p.source;
    return src;
  }).filter(Boolean))];
  const models = [...new Set(prompts.map(p => p.modelName).filter(Boolean))];

  const promptsByCategory = {};
  const promptsBySource = {};
  const promptsByModel = {};

  for (const p of prompts) {
    if (p.category) {
      promptsByCategory[p.category] = (promptsByCategory[p.category] || 0) + 1;
    }
    const srcType = typeof p.source === 'object' ? p.source?.type : p.source;
    if (srcType) {
      promptsBySource[srcType] = (promptsBySource[srcType] || 0) + 1;
    }
    if (p.modelName) {
      promptsByModel[p.modelName] = (promptsByModel[p.modelName] || 0) + 1;
    }
  }

  const searchIndex = prompts.flatMap(p => p.searchTerms || []);

  return {
    buildTime: new Date().toISOString(),
    totalPrompts: prompts.length,
    categories,
    sources,
    supportedModels: models,
    promptsByCategory,
    promptsBySource,
    promptsByModel,
    searchIndex: [...new Set(searchIndex)],
  };
}

// ── Main ──────────────────────────────────────────────

async function main() {
  console.log(`Processing issue #${ISSUE_NUMBER}: ${ISSUE_TITLE}`);

  // 1. Extract JSON
  const data = extractJson(ISSUE_BODY);
  if (!data) {
    await commentOnIssue(
      '❌ Could not extract valid JSON from this issue. Please ensure the contribution data is inside a ```json code block.',
    );
    await addLabel('needs-fix');
    process.exit(1);
  }

  // 2. Determine type
  const type = getContributionType(ISSUE_LABELS);
  console.log(`Contribution type: ${type}`);

  // 3. Validate
  if (type === 'custom-prompt' || type === 'multi-shot-prompt') {
    const errors = validatePrompt(data);
    if (errors.length > 0) {
      await commentOnIssue(
        `❌ Validation failed:\n${errors.map(e => `- ${e}`).join('\n')}\n\nPlease fix and resubmit.`,
      );
      await addLabel('needs-fix');
      process.exit(1);
    }
  }

  // 4. Read existing data
  const filePath = resolve(CUSTOM_PROMPTS_PATH);
  const existing = JSON.parse(readFileSync(filePath, 'utf8'));

  // Check duplicate ID
  if (existing.prompts.some(p => p.id === data.id)) {
    // Append a suffix to make unique
    data.id = `${data.id}-${Date.now().toString(36)}`;
    console.log(`Duplicate ID detected, using: ${data.id}`);
  }

  // Add searchTerms and timestamp
  data.searchTerms = buildSearchTerms(data);
  data.createdAt = new Date().toISOString();

  // 5. Append and regenerate metadata
  existing.prompts.push(data);
  existing.metadata = regenerateMetadata(existing.prompts);

  const updatedJson = JSON.stringify(existing, null, 2) + '\n';

  // 6. Create branch, commit, PR via GitHub API
  const branchName = `contribution/issue-${ISSUE_NUMBER}-${data.id}`.slice(0, 80);

  // Get main branch SHA
  const mainRef = await ghApi(`/repos/${REPO_OWNER}/${REPO_NAME}/git/ref/heads/main`);
  const mainSha = mainRef.object.sha;

  // Create branch
  await ghApi(`/repos/${REPO_OWNER}/${REPO_NAME}/git/refs`, {
    method: 'POST',
    body: JSON.stringify({
      ref: `refs/heads/${branchName}`,
      sha: mainSha,
    }),
  });

  // Get current file SHA for update
  const fileInfo = await ghApi(
    `/repos/${REPO_OWNER}/${REPO_NAME}/contents/${CUSTOM_PROMPTS_PATH}?ref=${branchName}`,
  );

  // Update file on branch
  await ghApi(`/repos/${REPO_OWNER}/${REPO_NAME}/contents/${CUSTOM_PROMPTS_PATH}`, {
    method: 'PUT',
    body: JSON.stringify({
      message: `Add ${type}: ${data.title} (closes #${ISSUE_NUMBER})`,
      content: Buffer.from(updatedJson).toString('base64'),
      branch: branchName,
      sha: fileInfo.sha,
    }),
  });

  // Create PR
  const pr = await ghApi(`/repos/${REPO_OWNER}/${REPO_NAME}/pulls`, {
    method: 'POST',
    body: JSON.stringify({
      title: `[Contribution] ${data.title}`,
      body: `## Community Contribution\n\nAdds **${data.title}** to the prompt gallery.\n\n- Type: ${type}\n- Author: ${data.source?.name || 'anonymous'}\n- Category: ${data.category}\n${data.promptType === 'multi-shot' ? `- Shots: ${data.multiPrompt?.shots?.length || '?'}\n` : ''}\nCloses #${ISSUE_NUMBER}`,
      head: branchName,
      base: 'main',
    }),
  });

  // Comment on issue
  await commentOnIssue(
    `✅ Contribution processed! PR created: ${pr.html_url}\n\nOnce the PR is merged, your prompt will appear in the gallery.`,
  );

  console.log(`PR created: ${pr.html_url}`);
}

main().catch(async (err) => {
  console.error('Failed:', err);
  try {
    await commentOnIssue(`❌ Processing failed: ${err.message}`);
    await addLabel('needs-fix');
  } catch {}
  process.exit(1);
});
