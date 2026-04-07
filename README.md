# Awesome Video Prompts

> **Open-Source AI Video Prompt Engineering Platform**

Generate, enhance, and share professional video generation prompts. Build multi-shot cinematic sequences with AI. Contribute your own prompts to the community.

---

## Features

- **Prompt Generator** — Category-based prompt construction with 22 cinematic element types, AI enhancement via LLM
- **Multi-Shot Generator** — Design 3-shot cinematic sequences with Seedance 2.0 and Kling v3 Pro, including reference image generation
- **JSON Prompt Generator** — Convert ideas into structured JSON format for video generation
- **Prompt Gallery** — Community-curated video prompts with filtering, search, and video previews
- **GitHub Issue Contributions** — One-click prompt sharing via pre-filled GitHub Issues with automated PR creation

## Tech Stack

- **Next.js 16** + App Router, Turbopack
- **TypeScript** strict mode
- **shadcn/ui** (new-york style) + Tailwind CSS v4 + unified `radix-ui` package
- **Monorepo** — pnpm workspaces + Turborepo
- **AI** — FAL API (image/video generation), OpenRouter via FAL (LLM)
- **Zero backend** — All API calls client-side, static export, no database

## Supported AI Models

### Video Generation
- **Seedance 2.0** — reference-to-video, image-to-video, text-to-video
- **Kling v3 Pro** — multi_prompt shots + @Element references

### Image Generation
- **Nano Banana Pro** / **Nano Banana 2** — text-to-image & image editing
- **Seedream v5 Lite** — text-to-image & image editing

### LLM (Prompt Engineering)
- Sonnet 4.6, Gemini 3 Flash, Gemini 3.1 Pro, GPT-5.4 Mini

---

## Getting Started

### Prerequisites
- **Node.js** >= 20
- **pnpm** >= 10

### Development
```bash
pnpm install
pnpm dev          # http://localhost:3000
```

### Build
```bash
pnpm build
```

### Environment
Copy `.env.example` to `.env.local`:
- `NEXT_PUBLIC_SITE_URL` — Your site URL
- `NEXT_PUBLIC_GA_MEASUREMENT_ID` — Google Analytics (optional)

---

## Contributing

### Submit Prompts (One-Click)
1. Use the in-app contribution forms at `/contribute`
2. Click "Submit to Gallery" — opens a pre-filled GitHub Issue
3. Maintainer adds `approved` label — GitHub Action creates a PR automatically

### Types of Contributions
- **Video Prompts** — Full prompts with video examples
- **Multi-Shot Prompts** — Multi-shot sequences generated via the pipeline
- **Prompt Elements** — Building blocks for the prompt generator (lighting, camera, mood, etc.)
- **Categories** — New ways to organize prompts and elements

### Code Contributions
- Follow TypeScript strict mode and existing patterns
- Test changes with `pnpm build`
- Submit a PR with clear description

---

## Changelog

### 2026-04-07
- Multi-Shot Generator with full pipeline: LLM prompt planning, reference image generation, video generation
- Seedance 2.0 + Kling v3 Pro video model support with smart endpoint selection
- Agentic prompt system via OpenRouter (FAL-proxied) with retry, validation, and content policy handling
- Reference image system: @Image/@Element hover preview tooltips + click-to-modal
- GitHub Issue-based contribution system with automated PR via GitHub Actions
- Prompt Gallery: Multi-Shot badge, updated skeleton components matching real card layout
- Prompt Generator: LLM model selection (Sonnet 4.6, Gemini 3 Flash, Gemini 3.1 Pro, GPT-5.4 Mini)
- Migrated to unified `radix-ui` package (shadcn/ui latest)
- Upgraded Next.js 15 to 16.2.2
- Removed Video Models page
- Removed DengeAI branding, renamed to Awesome Video Prompts
- Image `sizes` prop fixes for Next.js Image optimization

---

## License

MIT License — Free to use, modify, and distribute.

**Built by [@ailker](https://x.com/ailker)**

---

*Contributions from the community help push the boundaries of AI video generation.*
