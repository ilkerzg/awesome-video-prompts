# Awesome Video Prompts

> **Breaking Changes Notice** — This release replaces the previous Turborepo monorepo (`apps/web`, `packages/*`) and legacy pages (`/prompts`, `/prompt-generator`, `/contribute/*`, `/privacy`) with a flat Next.js 15 application. Old URLs will 404 until redirects ship in a follow-up.

A complete AI video generation platform built on [fal.ai](https://fal.ai). Go from an idea to a finished shot (or a whole multi-shot sequence) in minutes, with a curated library of prompts, models, and editorial guides to guide you along the way.

## Features

Four purpose-built studios, plus a full content and utility surface:

### Studios
- **Shorts** (`/shorts`) — Script to 9:16 captioned vertical video
- **Podcast** (`/podcast`) — Two-host script-to-video pipeline
- **Scene Builder** (`/scenario`) — Story → scene breakdown → keyframes → render
- **Multi-Shot** (`/multi-shot`) — Enhanced multi-shot sequence generator

### Content
- **Blog** (`/blog`, `/blog/[slug]`) — 77 technical posts with inline editorial illustrations, specs and pricing validated against the fal.ai API
- **Gallery** (`/explore`, `/explore/[id]`) — 159+ videos across 15 categories

### Utilities
- **Shot Composer** (`/shot-composer`) — Visual shot composition primitive
- **JSON Prompt Builder** (`/json-prompt`) — Structured JSON prompt authoring
- **Prompt Generator** (`/prompt-gen`) — Category-based prompt construction
- **Generate** (`/generate`) — Simple text-to-video with model picker
- **Editor** (`/editor`) — Lightweight video editor
- **History** (`/history`) — localStorage-backed generation history
- **Settings** (`/settings`) — FAL key + defaults + data export

## Tech Stack

- **Next.js 15** (App Router, Turbopack)
- **React 19** + TypeScript (strict mode)
- **Tailwind CSS v4** with custom design tokens (`--accent`, `--surface`, `--separator`)
- **[@fal-ai/client](https://fal.ai)** — image and video generation
- **Supabase** *(optional)* — likes, views, and copy counts; gracefully falls back to `localStorage` when env vars are absent
- **Framer Motion** + **Hugeicons** + **Lucide**

## Quick Start

```bash
pnpm install
pnpm dev          # http://localhost:3000
```

Build for production:

```bash
pnpm build
pnpm start
```

## Environment Variables

Create a `.env.local` in the repo root:

```bash
# Required to enable FAL generation (or paste into Settings at runtime)
NEXT_PUBLIC_FAL_KEY=your_fal_api_key

# Optional — enables Supabase-backed likes / views / copies
# Leave unset to fall back to localStorage
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_publishable_key
```

All configuration is read via `process.env.*`. No API keys are ever hardcoded.

## Project Structure

```
src/
  app/            Next.js App Router pages (studios, blog, explore, utilities)
  components/     Shared UI (site-header, studios, video-editor, ...)
  content/        Blog posts (.mdx) and curated blog-posts.json
  lib/            FAL client helpers, Supabase client, shared utils
public/           Static assets
supabase/         Optional Supabase schema for likes/views
scripts/          Example generation tooling
```

Built by [@ailker](https://x.com/ailker).

## License

MIT License — Free to use, modify, and distribute.
