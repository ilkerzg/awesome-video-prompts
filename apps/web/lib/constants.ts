import type { AIModel, PromptCategory } from '../types';

export const MODELS: AIModel[] = [
  {
    id: 'seedance',
    name: 'Seedance 2.0',
    provider: 'ByteDance',
    description: 'Top-ranked model with native audio, multi-shot support, and cinematic motion fidelity.',
    maxDuration: 15,
    supportedRatios: ['21:9', '16:9', '4:3', '1:1', '3:4', '9:16'],
    falUrl: 'https://fal.ai/models/bytedance/seedance-2.0/text-to-video',
  },
  {
    id: 'veo',
    name: 'Veo 3.1',
    provider: 'Google',
    description: '4K video with native audio and cinematic realism.',
    maxDuration: 8,
    supportedRatios: ['16:9', '9:16'],
    falUrl: 'https://fal.ai/models/fal-ai/veo3.1',
  },
  {
    id: 'veo-lite',
    name: 'Veo 3.1 Lite',
    provider: 'Google',
    description: 'Fast, affordable Veo variant at $0.05/sec.',
    maxDuration: 8,
    supportedRatios: ['16:9', '9:16'],
    falUrl: 'https://fal.ai/models/fal-ai/veo3.1/lite',
  },
  {
    id: 'kling',
    name: 'Kling v3 Pro',
    provider: 'Kuaishou',
    description: 'Multi-prompt shot scripting, character elements, and native audio.',
    maxDuration: 15,
    supportedRatios: ['16:9', '9:16', '1:1'],
    falUrl: 'https://fal.ai/models/fal-ai/kling-video/v3/pro/text-to-video',
  },
  {
    id: 'wan',
    name: 'Wan 2.7',
    provider: 'Alibaba',
    description: 'Open-weight model with prompt expansion, end-image control, and 1080p output.',
    maxDuration: 15,
    supportedRatios: ['16:9', '9:16', '1:1', '4:3', '3:4'],
    falUrl: 'https://fal.ai/models/fal-ai/wan/v2.7/text-to-video',
  },
  {
    id: 'ltx',
    name: 'LTX 2.3',
    provider: 'Lightricks',
    description: 'Native 4K, variable FPS (24/25/48/50), synchronized audio.',
    maxDuration: 10,
    supportedRatios: ['16:9', '9:16'],
    falUrl: 'https://fal.ai/models/fal-ai/ltx-2.3/text-to-video',
  },
  {
    id: 'pixverse-v6',
    name: 'Pixverse v6',
    provider: 'Pixverse',
    description: 'Style presets (anime, clay, cyberpunk) with thinking mode.',
    maxDuration: 8,
    supportedRatios: ['16:9', '4:3', '1:1', '3:4', '9:16', '21:9'],
    falUrl: 'https://fal.ai/models/fal-ai/pixverse/v6/text-to-video',
  },
  {
    id: 'pixverse-c1',
    name: 'Pixverse C1',
    provider: 'Pixverse',
    description: 'Film-grade action engine at $0.005/sec.',
    maxDuration: 15,
    supportedRatios: ['16:9', '4:3', '1:1', '3:4', '9:16'],
    falUrl: 'https://fal.ai/models/fal-ai/pixverse/c1/text-to-video',
  },
  {
    id: 'grok',
    name: 'Grok Imagine Video',
    provider: 'xAI',
    description: 'Strong prompt adherence with 7 aspect ratios.',
    maxDuration: 8,
    supportedRatios: ['16:9', '4:3', '3:2', '1:1', '2:3', '3:4', '9:16'],
    falUrl: 'https://fal.ai/models/xai/grok-imagine-video/text-to-video',
  },
];

export const CATEGORIES: { id: PromptCategory; label: string }[] = [
  { id: 'cinematic', label: 'Cinematic' },
  { id: 'nature', label: 'Nature' },
  { id: 'abstract', label: 'Abstract' },
  { id: 'character', label: 'Character' },
  { id: 'product', label: 'Product' },
  { id: 'architecture', label: 'Architecture' },
  { id: 'sci-fi', label: 'Sci-Fi' },
  { id: 'fantasy', label: 'Fantasy' },
  { id: 'documentary', label: 'Documentary' },
  { id: 'music-video', label: 'Music Video' },
  { id: 'commercial', label: 'Commercial' },
  { id: 'creative', label: 'Creative' },
  { id: 'transformation', label: 'Transformation' },
  { id: 'artistic', label: 'Artistic' },
  { id: 'action', label: 'Action' },
];

export const SORT_OPTIONS: { id: string; label: string }[] = [
  { id: 'newest', label: 'Newest' },
  { id: 'popular', label: 'Most Popular' },
  { id: 'trending', label: 'Trending' },
];

export const ASPECT_RATIOS = ['16:9', '9:16', '1:1', '4:3'] as const;

export const DURATIONS = ['4s', '6s', '8s', '10s'] as const;

export const CATEGORY_GRADIENTS: Record<PromptCategory, string> = {
  cinematic: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
  nature: 'linear-gradient(135deg, #1b4332 0%, #2d6a4f 50%, #52b788 100%)',
  abstract: 'linear-gradient(135deg, #7b2cbf 0%, #c77dff 50%, #e0aaff 100%)',
  character: 'linear-gradient(135deg, #6a040f 0%, #d00000 50%, #e85d04 100%)',
  product: 'linear-gradient(135deg, #023e8a 0%, #0077b6 50%, #00b4d8 100%)',
  architecture:
    'linear-gradient(135deg, #3d405b 0%, #81b29a 50%, #f2cc8f 100%)',
  'sci-fi': 'linear-gradient(135deg, #0d1b2a 0%, #1b263b 50%, #415a77 100%)',
  fantasy: 'linear-gradient(135deg, #590d22 0%, #800f2f 50%, #a4133c 100%)',
  documentary:
    'linear-gradient(135deg, #432818 0%, #6f1d1b 50%, #bb9457 100%)',
  'music-video':
    'linear-gradient(135deg, #240046 0%, #7b2cbf 50%, #c77dff 100%)',
  commercial: 'linear-gradient(135deg, #023e8a 0%, #0077b6 50%, #00b4d8 100%)',
  creative: 'linear-gradient(135deg, #f12711 0%, #f5af19 50%, #f12711 100%)',
  transformation: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  artistic: 'linear-gradient(135deg, #4a1942 0%, #6a1b4d 50%, #c94b4b 100%)',
  action: 'linear-gradient(135deg, #0c0c1d 0%, #1a237e 50%, #4a148c 100%)',
};
