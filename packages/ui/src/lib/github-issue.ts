const REPO = 'ilkerzg/awesome-video-prompts'

export type ContributionType =
  | 'custom-prompt'
  | 'multi-shot-prompt'
  | 'prompt-element'
  | 'element-category'
  | 'prompt-category'

const LABELS: Record<ContributionType, string[]> = {
  'custom-prompt': ['contribution', 'prompt'],
  'multi-shot-prompt': ['contribution', 'multi-shot'],
  'prompt-element': ['contribution', 'element'],
  'element-category': ['contribution', 'category'],
  'prompt-category': ['contribution', 'category'],
}

const TYPE_TITLES: Record<ContributionType, string> = {
  'custom-prompt': 'Prompt',
  'multi-shot-prompt': 'Multi-Shot Prompt',
  'prompt-element': 'Prompt Element',
  'element-category': 'Element Category',
  'prompt-category': 'Prompt Category',
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60)
}

export function createGitHubIssueUrl(options: {
  type: ContributionType
  title: string
  description?: string
  jsonData: Record<string, unknown>
  author?: string
  repo?: string
}): string {
  const { type, title, description, jsonData, author, repo = REPO } = options
  const labels = LABELS[type].join(',')
  const typeTitle = TYPE_TITLES[type]

  const issueTitle = `[${typeTitle}] ${title}`

  // Build markdown body
  let body = `## ${typeTitle} Contribution\n\n`

  if (description) {
    body += `${description}\n\n`
  }

  if (author) {
    body += `**Author:** ${author}\n\n`
  }

  body += `---\n\n`
  body += `### Data\n\n`
  body += '```json\n'
  body += JSON.stringify(jsonData, null, 2)
  body += '\n```\n\n'
  body += `---\n*Submitted via Awesome Video Prompts contribution form*`

  // Build URL — check length
  const baseUrl = `https://github.com/${repo}/issues/new`
  let params = new URLSearchParams({
    title: issueTitle,
    body,
    labels,
  })

  let url = `${baseUrl}?${params.toString()}`

  // If URL exceeds ~7500 chars, strip non-essential fields
  if (url.length > 7500) {
    const trimmed = { ...jsonData }
    delete trimmed.searchTerms
    delete trimmed.reference_image_prompts
    delete trimmed.reference_image_roles

    let trimmedBody = `## ${typeTitle} Contribution\n\n`
    if (author) trimmedBody += `**Author:** ${author}\n\n`
    trimmedBody += `---\n\n### Data\n\n\`\`\`json\n`
    trimmedBody += JSON.stringify(trimmed, null, 2)
    trimmedBody += '\n```\n'

    params = new URLSearchParams({ title: issueTitle, body: trimmedBody, labels })
    url = `${baseUrl}?${params.toString()}`
  }

  return url
}

export function buildPromptContribution(data: {
  title: string
  description: string
  prompt: string
  category: string
  tags: string[]
  modelName: string
  author: string
  sourceUrl?: string
  videoUrl?: string
  thumbnailUrl?: string
  generationType?: string
}) {
  const id = slugify(data.title)
  return {
    id,
    title: data.title,
    description: data.description,
    prompt: data.prompt,
    category: data.category,
    tags: data.tags,
    source: {
      type: 'community',
      name: data.author,
      url: data.sourceUrl || '',
    },
    modelName: data.modelName,
    status: 'active',
    featured: false,
    promptType: 'single',
    generationType: data.generationType || 'text_to_video',
    video: data.videoUrl || '',
    thumbnailUrl: data.thumbnailUrl || '',
  }
}

export function buildMultiShotContribution(data: {
  title: string
  description: string
  shots: Array<{ shot_number: number; prompt: string; duration: string }>
  totalDuration: string
  baseImagePrompt: string
  videoModelId: string
  videoUrl?: string
  thumbnailUrl?: string
  generatedImageUrls?: string[]
  author: string
  tags?: string[]
}) {
  const id = slugify(data.title)
  const combinedPrompt = data.shots.map(s => s.prompt).join(' ')

  return {
    id,
    title: data.title,
    description: data.description,
    prompt: combinedPrompt,
    category: 'cinematic',
    tags: data.tags || ['multi-shot'],
    source: {
      type: 'community',
      name: data.author,
    },
    modelName: data.videoModelId === 'kling-v3'
      ? 'fal-ai/kling-video/v3/pro/image-to-video'
      : 'bytedance/seedance-2.0/reference-to-video',
    status: 'active',
    featured: false,
    promptType: 'multi-shot',
    generationType: 'text_to_video',
    video: data.videoUrl || '',
    thumbnailUrl: data.thumbnailUrl || '',
    multiPrompt: {
      shots: data.shots,
      total_duration: data.totalDuration,
      base_image_prompt: data.baseImagePrompt,
    },
    generatedImages: data.generatedImageUrls || [],
  }
}
