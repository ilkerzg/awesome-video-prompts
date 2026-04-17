import type {
  Prompt,
  HistoryItem,
  GalleryItem,
  PromptCategory,
} from '../types';
import { MODELS, CATEGORIES } from './constants';
import { EXAMPLE_VIDEOS } from './example-videos';

// ---------------------------------------------------------------------------
// Build prompts from EXAMPLE_VIDEOS (real generated videos only)
// ---------------------------------------------------------------------------

// Auto-generate tags from category and prompt keywords
function autoTags(category: string, prompt: string): string[] {
  const tags: string[] = ['trending'];
  const lower = prompt.toLowerCase();
  if (lower.includes('macro') || lower.includes('close-up')) tags.push('macro');
  if (lower.includes('drone') || lower.includes('aerial')) tags.push('aerial');
  if (lower.includes('slow motion') || lower.includes('slow-motion')) tags.push('slow-motion');
  if (lower.includes('cinematic')) tags.push('cinematic');
  if (lower.includes('neon') || lower.includes('cyberpunk')) tags.push('cyberpunk');
  if (category === 'nature') tags.push('nature');
  if (category === 'commercial') tags.push('commercial');
  if (category === 'documentary') tags.push('documentary');
  return tags.slice(0, 4);
}

export const MOCK_PROMPTS: Prompt[] = EXAMPLE_VIDEOS.map((video, i) => ({
  id: video.id,
  text: video.prompt,
  category: video.category as PromptCategory,
  modelId: 'seedance',
  likes: 600 - i * 20 + Math.floor(Math.abs(Math.sin(i * 7)) * 200),
  createdAt: new Date(Date.now() - i * 3600000).toISOString(),
  tags: autoTags(video.category, video.prompt),
  videoUrl: video.videoUrl,
}));

// ---------------------------------------------------------------------------
// Mock History (12)
// ---------------------------------------------------------------------------

export const MOCK_HISTORY: HistoryItem[] = [
  {
    id: 'history-1',
    prompt:
      'A slow aerial dolly shot gliding over a misty mountain range at sunrise.',
    modelId: 'kling',
    status: 'completed',
    createdAt: '2026-04-14T08:30:00.000Z',
    duration: 8,
    aspectRatio: '16:9',
  },
  {
    id: 'history-2',
    prompt:
      'Close-up macro footage of morning dew forming on a spider web in a forest.',
    modelId: 'runway-gen3',
    status: 'completed',
    createdAt: '2026-04-14T07:15:00.000Z',
    duration: 6,
    aspectRatio: '16:9',
  },
  {
    id: 'history-3',
    prompt:
      'Liquid chrome morphing into impossible geometric shapes against a pure black background.',
    modelId: 'pika',
    status: 'failed',
    createdAt: '2026-04-14T06:50:00.000Z',
    duration: 4,
    aspectRatio: '1:1',
  },
  {
    id: 'history-4',
    prompt:
      'A weathered samurai standing on a cliff edge during a thunderstorm.',
    modelId: 'kling',
    status: 'completed',
    createdAt: '2026-04-13T22:00:00.000Z',
    duration: 10,
    aspectRatio: '16:9',
  },
  {
    id: 'history-5',
    prompt:
      'A neon-lit cyberpunk city street in the rain with holographic advertisements.',
    modelId: 'runway-gen3',
    status: 'processing',
    createdAt: '2026-04-14T09:00:00.000Z',
    duration: 8,
    aspectRatio: '16:9',
  },
  {
    id: 'history-6',
    prompt:
      'An enchanted forest where bioluminescent mushrooms light a winding path.',
    modelId: 'hailuo',
    status: 'completed',
    createdAt: '2026-04-13T19:30:00.000Z',
    duration: 6,
    aspectRatio: '9:16',
  },
  {
    id: 'history-7',
    prompt:
      'Underwater footage of a coral reef teeming with tropical fish.',
    modelId: 'runway-gen3',
    status: 'completed',
    createdAt: '2026-04-13T16:45:00.000Z',
    duration: 10,
    aspectRatio: '16:9',
  },
  {
    id: 'history-8',
    prompt:
      'A colossal dragon emerging from a volcanic crater, wings spread wide.',
    modelId: 'wan',
    status: 'failed',
    createdAt: '2026-04-13T14:20:00.000Z',
    duration: 8,
    aspectRatio: '16:9',
  },
  {
    id: 'history-9',
    prompt:
      'A luxury watch resting on a dark marble surface with water droplets.',
    modelId: 'runway-gen3',
    status: 'completed',
    createdAt: '2026-04-13T11:00:00.000Z',
    duration: 6,
    aspectRatio: '1:1',
  },
  {
    id: 'history-10',
    prompt:
      'A dancer performing fluid contemporary choreography in colored smoke.',
    modelId: 'hailuo',
    status: 'processing',
    createdAt: '2026-04-14T09:10:00.000Z',
    duration: 6,
    aspectRatio: '9:16',
  },
  {
    id: 'history-11',
    prompt:
      'A noir detective walking through a foggy 1940s alleyway at night.',
    modelId: 'minimax-video',
    status: 'completed',
    createdAt: '2026-04-12T23:30:00.000Z',
    duration: 6,
    aspectRatio: '16:9',
  },
  {
    id: 'history-12',
    prompt:
      'Aerial drone shot following a pack of wolves through a snow-covered boreal forest.',
    modelId: 'hailuo',
    status: 'completed',
    createdAt: '2026-04-12T20:00:00.000Z',
    duration: 6,
    aspectRatio: '16:9',
  },
];

// ---------------------------------------------------------------------------
// Mock Gallery (16)
// ---------------------------------------------------------------------------

export const MOCK_GALLERY: GalleryItem[] = [
  {
    id: 'gallery-1',
    prompt:
      'A slow aerial dolly shot gliding over a misty mountain range at sunrise.',
    modelId: 'kling',
    likes: 487,
    author: 'Elena Vasquez',
    createdAt: '2026-03-28T09:14:00.000Z',
  },
  {
    id: 'gallery-2',
    prompt:
      'A neon-lit cyberpunk city street in the rain with holographic advertisements.',
    modelId: 'runway-gen3',
    likes: 402,
    author: 'Marcus Chen',
    createdAt: '2026-04-08T19:30:00.000Z',
  },
  {
    id: 'gallery-3',
    prompt:
      'A colossal dragon emerging from a volcanic crater, wings spread wide.',
    modelId: 'wan',
    likes: 378,
    author: 'Aisha Patel',
    createdAt: '2026-04-03T14:55:00.000Z',
  },
  {
    id: 'gallery-4',
    prompt:
      'A weathered samurai standing on a cliff edge during a thunderstorm.',
    modelId: 'kling',
    likes: 445,
    author: 'Takeshi Yamamoto',
    createdAt: '2026-04-05T08:20:00.000Z',
  },
  {
    id: 'gallery-5',
    prompt:
      'Aerial drone shot following a pack of wolves through a snow-covered forest.',
    modelId: 'hailuo',
    likes: 421,
    author: 'Lars Eriksson',
    createdAt: '2026-04-06T08:00:00.000Z',
  },
  {
    id: 'gallery-6',
    prompt:
      'A noir detective walking through a foggy 1940s alleyway at night.',
    modelId: 'minimax-video',
    likes: 410,
    author: 'Sofia Romano',
    createdAt: '2026-04-12T23:00:00.000Z',
  },
  {
    id: 'gallery-7',
    prompt:
      'A lone astronaut standing on the surface of Mars, looking up at Earth.',
    modelId: 'stable-video',
    likes: 367,
    author: 'James Okoye',
    createdAt: '2026-04-08T07:30:00.000Z',
  },
  {
    id: 'gallery-8',
    prompt:
      'Tracking shot following a vintage red convertible along a coastal highway.',
    modelId: 'luma-dream-machine',
    likes: 356,
    author: 'Camille Dubois',
    createdAt: '2026-04-10T17:00:00.000Z',
  },
  {
    id: 'gallery-9',
    prompt:
      'An enchanted forest where bioluminescent mushrooms light a winding path.',
    modelId: 'hailuo',
    likes: 334,
    author: 'Mia Zhang',
    createdAt: '2026-04-04T21:00:00.000Z',
  },
  {
    id: 'gallery-10',
    prompt:
      'Close-up macro footage of morning dew forming on a spider web.',
    modelId: 'runway-gen3',
    likes: 312,
    author: 'Henrik Larsen',
    createdAt: '2026-04-01T11:30:00.000Z',
  },
  {
    id: 'gallery-11',
    prompt:
      'A high-end perfume bottle shattering in ultra slow motion, releasing golden liquid.',
    modelId: 'luma-dream-machine',
    likes: 298,
    author: 'Priya Sharma',
    createdAt: '2026-04-13T10:15:00.000Z',
  },
  {
    id: 'gallery-12',
    prompt:
      'Interior of a derelict space station with overgrown plants breaking through walls.',
    modelId: 'wan',
    likes: 289,
    author: 'Oscar Mendez',
    createdAt: '2026-04-09T11:10:00.000Z',
  },
  {
    id: 'gallery-13',
    prompt:
      'A dancer performing fluid contemporary choreography in colored smoke.',
    modelId: 'hailuo',
    likes: 267,
    author: 'Nina Kowalski',
    createdAt: '2026-04-06T22:15:00.000Z',
  },
  {
    id: 'gallery-14',
    prompt:
      'Underwater footage of a coral reef teeming with tropical fish.',
    modelId: 'runway-gen3',
    likes: 256,
    author: 'David Tanaka',
    createdAt: '2026-03-31T09:50:00.000Z',
  },
  {
    id: 'gallery-15',
    prompt:
      'Time-lapse of a lotus flower blooming in a still pond at dawn.',
    modelId: 'wan',
    likes: 223,
    author: 'Fatima Al-Rashid',
    createdAt: '2026-03-18T06:30:00.000Z',
  },
  {
    id: 'gallery-16',
    prompt:
      'Split-screen montage of a singer performing in four contrasting environments.',
    modelId: 'kling',
    likes: 189,
    author: 'Andre Williams',
    createdAt: '2026-04-11T16:40:00.000Z',
  },
];

// ---------------------------------------------------------------------------
// Helper functions
// ---------------------------------------------------------------------------

export function getPromptById(id: string): Prompt | undefined {
  return MOCK_PROMPTS.find((p) => p.id === id);
}

export function getPromptsByCategory(category: PromptCategory): Prompt[] {
  return MOCK_PROMPTS.filter((p) => p.category === category);
}

export function getPromptsByModel(modelId: string): Prompt[] {
  return MOCK_PROMPTS.filter((p) => p.modelId === modelId);
}

export function getRelatedPrompts(id: string, limit = 4): Prompt[] {
  const source = MOCK_PROMPTS.find((p) => p.id === id);
  if (!source) return [];

  // Prefer same category, then same model, then fall back to most popular
  const sameCategoryAndModel = MOCK_PROMPTS.filter(
    (p) =>
      p.id !== id &&
      p.category === source.category &&
      p.modelId === source.modelId,
  );
  const sameCategory = MOCK_PROMPTS.filter(
    (p) =>
      p.id !== id &&
      p.category === source.category &&
      p.modelId !== source.modelId,
  );
  const sameModel = MOCK_PROMPTS.filter(
    (p) =>
      p.id !== id &&
      p.category !== source.category &&
      p.modelId === source.modelId,
  );
  const rest = MOCK_PROMPTS.filter(
    (p) =>
      p.id !== id &&
      p.category !== source.category &&
      p.modelId !== source.modelId,
  ).sort((a, b) => b.likes - a.likes);

  const pool = [
    ...sameCategoryAndModel,
    ...sameCategory,
    ...sameModel,
    ...rest,
  ];

  return pool.slice(0, limit);
}

export function getModelById(modelId: string) {
  return MODELS.find((m) => m.id === modelId);
}
