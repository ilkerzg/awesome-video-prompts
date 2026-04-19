export type PromptCategory =
  | 'cinematic'
  | 'nature'
  | 'abstract'
  | 'character'
  | 'product'
  | 'commercial'
  | 'architecture'
  | 'sci-fi'
  | 'fantasy'
  | 'documentary'
  | 'music-video'
  | 'creative'
  | 'transformation'
  | 'artistic'
  | 'action';

export type SortOption = 'newest' | 'popular' | 'trending';

export interface AIModel {
  id: string;
  name: string;
  provider: string;
  description: string;
  maxDuration: number;
  supportedRatios: string[];
  falUrl?: string;
}

export interface Prompt {
  id: string;
  text: string;
  category: PromptCategory;
  modelId: string;
  likes: number;
  createdAt: string;
  tags: string[];
  videoUrl?: string;
}

export interface HistoryItem {
  id: string;
  prompt: string;
  modelId: string;
  status: 'completed' | 'processing' | 'failed';
  createdAt: string;
  duration: number;
  aspectRatio: string;
}

export interface GalleryItem {
  id: string;
  prompt: string;
  modelId: string;
  likes: number;
  author: string;
  createdAt: string;
}
