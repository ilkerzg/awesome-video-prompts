export interface VideoPrompt {
  id: string
  title: string
  description: string
  prompt: string
  category: 'cinematic' | 'documentary' | 'animation' | 'commercial' | 'experimental' | 'artistic'
  style?: string
  modelName: string
  creator: string
  source: {
    type: string
    name?: string
    url?: string
    username?: string
    postId?: string
    description?: string
  } | string
  aspectRatio?: '16:9' | '9:16' | '1:1' | '4:3'
  status: 'featured' | 'active' | 'draft' | 'archived'
  thumbnail?: string
  previewVideo?: string
  createdAt: string
  updatedAt?: string
  tags?: string[]
  isPublic?: boolean
  generationType?: 'text_to_video' | 'image_to_video'
  imageUrl?: string // For image-to-video prompts
  imageDescription?: string // Description of the input image
  parameters?: {
    num_frames: number
    fps: number
    resolution: string
    creativity: number
    enable_prompt_expansion: boolean
  }
  notes?: string
  example_output_url?: string
  promptType?: 'single' | 'multi-shot'
  multiPrompt?: {
    shots: Array<{
      shot_number: number
      prompt: string
      duration: string
      references?: string[]
    }>
    total_duration: string
    base_image_prompt?: string
    reference_image_prompts?: string[]
  }
}
