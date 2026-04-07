'use client'

import { useState } from 'react'
import { HugeiconsIcon } from "@hugeicons/react"
import { Copy01Icon, PlayIcon, ArrowDown01Icon, VideoReplayIcon, UserIcon, VideoIcon } from "@hugeicons/core-free-icons"
import { Badge } from "@workspace/ui/components/ui/badge"
import { Button } from "@workspace/ui/components/ui/button"
import { Card, CardContent } from "@workspace/ui/components/ui/card"
import { Separator } from "@workspace/ui/components/ui/separator"
import { toast } from "sonner"
import { StatusBadge } from "@workspace/ui/components/ui/status-badge"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@workspace/ui/components/ui/tooltip"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/ui/dropdown-menu"
import { cn } from "@workspace/ui/lib/utils"
import type { VideoPrompt } from "@workspace/ui/types/prompt.js"

// Cache for models data to avoid repeated fetches
let modelsCache: { models: Array<{ model_id: string; display_name: string }> } | null = null;

// Function to load models data
async function loadModelsData() {
  if (modelsCache) {
    return modelsCache;
  }
  
  try {
    // Try to fetch from the public data directory
    const response = await fetch('/data/models.json');
    if (response.ok) {
      modelsCache = await response.json();
      return modelsCache;
    }
  } catch (error) {
    console.warn('Failed to load models data:', error);
  }
  
  // Fallback to empty models array
  return { models: [] };
}

// Function to convert full model names to short display names
function getModelDisplayName(modelName: string): string {
  // If we have cached data, use it
  if (modelsCache?.models) {
    const model = modelsCache.models.find(m => m.model_id === modelName);
    if (model) {
      return model.display_name;
    }
  }
  
  // Short display name mapping for common models
  const shortNameMap: Record<string, string> = {
    'fal-ai/wan/v2.2-5b/text-to-video': 'WAN v2.2',
    'fal-ai/wan/turbo/text-to-video': 'WAN Turbo',
    'fal-ai/wan/turbo/image-to-video': 'WAN Turbo',
    'fal-ai/ltx-video/13b-098': 'LTX 13B',
    'fal-ai/veo/3/fast': 'Veo 3',
    'fal-ai/vidu/q1': 'Vidu Q1',
    'fal-ai/pixverse/v4.5/text-to-video': 'Pixverse v4.5',
    'fal-ai/kling-video/v1.6/pro/text-to-video': 'Kling Pro',
    'fal-ai/minimax/hailuo-02/pro/text-to-video': 'Hailuo Pro',
    'fal-ai/minimax/hailuo-02/standard/text-to-video': 'Hailuo Std',
    'fal-ai/minimax/hailuo-02/standard/image-to-video': 'Hailuo Std',
    'fal-ai/minimax/hailuo-02/pro/image-to-video': 'Hailuo Pro',
    'fal-ai/bytedance/seedance-v1/pro': 'Seedance Pro'
  }
  
  // Check if we have a short name mapping
  if (shortNameMap[modelName]) {
    return shortNameMap[modelName];
  }
  
  // Fallback: create a short display name from the model ID
  if (modelName.includes('/')) {
    const parts = modelName.split('/');
    
    // Extract the main model name (usually the second part)
    const modelPart = parts[1] || parts[0];
    
    // Handle version numbers
    const versionMatch = modelName.match(/v\d+\.\d+/);
    const version = versionMatch ? ` ${versionMatch[0]}` : '';
    
    // Handle special cases
    if (modelPart && modelPart.toLowerCase().includes('wan')) {
      return `WAN${version}`;
    }
    if (modelPart && modelPart.toLowerCase().includes('hailuo')) {
      return `Hailuo${version}`;
    }
    if (modelPart && modelPart.toLowerCase().includes('kling')) {
      return `Kling${version}`;
    }
    if (modelPart && modelPart.toLowerCase().includes('pixverse')) {
      return `Pixverse${version}`;
    }
    if (modelPart && modelPart.toLowerCase().includes('veo')) {
      return `Veo${version}`;
    }
    if (modelPart && modelPart.toLowerCase().includes('vidu')) {
      return `Vidu${version}`;
    }
    if (modelPart && modelPart.toLowerCase().includes('ltx')) {
      return `LTX${version}`;
    }
    if (modelPart && modelPart.toLowerCase().includes('seedance')) {
      return `Seedance${version}`;
    }
    
    // Generic fallback
    return modelPart ? modelPart.charAt(0).toUpperCase() + modelPart.slice(1).replace(/-/g, '') + version : 'Unknown';
  }
  
  // Handle direct model names without slashes
  return modelName.charAt(0).toUpperCase() + modelName.slice(1).replace(/-/g, '');
}

// Initialize models data loading (fire and forget)
if (typeof window !== 'undefined') {
  loadModelsData().catch(() => {
    // Silently handle errors - fallback logic will be used
  });
}

interface VideoPromptCardProps {
  prompt: VideoPrompt
  onNavigate?: (url: string) => void
  onOpenDrawer?: (prompt: VideoPrompt) => void
}

export function VideoPromptCard({ 
  prompt, 
  onNavigate, 
  onOpenDrawer
}: VideoPromptCardProps) {
  
  const handleCategoryClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onNavigate?.(`/prompts?category=${encodeURIComponent(prompt.category)}`)
  }

  const handleSourceClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    // Handle both object and string source formats
    const sourceUrl = typeof prompt.source === 'object' ? prompt.source.url : prompt.source
    const sourceName = typeof prompt.source === 'object' ? prompt.source.name : prompt.source
    
    // If source URL is a URL, open it in new tab
    if (sourceUrl && sourceUrl.startsWith('http')) {
      window.open(sourceUrl, '_blank', 'noopener,noreferrer')
    } else if (sourceName) {
      onNavigate?.(`/prompts?source=${encodeURIComponent(sourceName)}`)
    }
  }

  const handleTagClick = (e: React.MouseEvent, tag: string) => {
    e.preventDefault()
    e.stopPropagation()
    onNavigate?.(`/prompts?tags=${encodeURIComponent(tag)}`)
  }


  const handleCreatorClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    // Get creator name from source object or use creator field
    let creatorName = ''
    if (typeof prompt.source === 'object' && prompt.source.name) {
      creatorName = prompt.source.name
    } else if (prompt.creator) {
      creatorName = prompt.creator
    }
    
    // Navigate to prompts page filtered by creator
    if (creatorName) {
      onNavigate?.(`/prompts?creator=${encodeURIComponent(creatorName)}`)
    }
  }

  const getCategoryColor = (category: string) => {
    const colors = {
      cinematic: 'purple',
      animation: 'orange',
      documentary: 'blue',
      commercial: 'green',
      artistic: 'cyan',
      experimental: 'red'
    }
    return colors[category as keyof typeof colors] || 'default'
  }

  return (
    <div className={cn(
      "group relative overflow-hidden transition-all duration-200",
      "bg-background border border-border hover:border-primary/40",
      "hover:shadow-sm rounded-xl",
      "h-full flex flex-col w-full"
    )}>
      {/* Video Thumbnail/Preview */}
      <div 
        onClick={() => onOpenDrawer?.(prompt)} 
        className="block w-full text-left cursor-pointer"
      >
        <div 
          className="relative aspect-video overflow-hidden bg-muted border-b border-border group/thumbnail"
          onMouseEnter={(e) => {
            const video = e.currentTarget.querySelector('video');
            if (video) {
              video.currentTime = 0;
              video.play().catch(() => {});
            }
          }}
          onMouseLeave={(e) => {
            const video = e.currentTarget.querySelector('video');
            if (video) {
              video.pause();
              video.currentTime = 0;
            }
          }}
        >
          {/* Thumbnail Image */}
          <img
            src={prompt.thumbnail || "/video-placeholder.png"}
            alt={prompt.title}
            className="w-full h-full object-cover"
          />
          
          {/* Video Preview (shows on hover) */}
          {prompt.previewVideo && (
            <video
              src={prompt.previewVideo}
              className="absolute inset-0 w-full h-full object-cover opacity-0 group-hover/thumbnail:opacity-100 transition-opacity duration-300"
              muted
              loop
              playsInline
            />
          )}
        
          


            <div className="absolute group-hover:!opacity-0 transition-opacity duration-300 w-full bottom-0 left-0 mx-auto h-[50%] -mt-2 bg-gradient-to-t from-background to-transparent right-0"/>
         
            <StatusBadge 
              variant={getCategoryColor(prompt.category) as any}
              className="text-xs absolute  group-hover:!opacity-0 z-10 m-2 bottom-0 left-0 font-medium "
            >
              {prompt.category}
            </StatusBadge>
          
          {/* Multi-Shot Badge */}
          {prompt.promptType === 'multi-shot' && (
            <div className="absolute top-2 left-2 z-10">
              <div className="px-1.5 py-0.5 bg-purple-500/90 backdrop-blur-sm text-[10px] text-white font-semibold rounded-md">
                Multi-Shot
              </div>
            </div>
          )}

          {/* Aspect Ratio Indicator */}
          {prompt.aspectRatio && (
            <div className="absolute top-2 right-12">
              <div className="px-2 py-0.5 bg-background/90 backdrop-blur-sm text-xs text-foreground font-medium border border-border rounded-lg">
                {prompt.aspectRatio}
              </div>
            </div>
          )}
        </div>
      </div>
    
      <div className="p-0 flex flex-col flex-grow">
        {/* Header */}
        <div 
          onClick={() => onOpenDrawer?.(prompt)} 
          className="block w-full text-left cursor-pointer"
        >
          <div className="px-4 pt-3 pb-4 hover:bg-muted/50 transition-colors">
            <h3 className="text-base font-semibold text-foreground truncate mb-1">
              {prompt.title}
            </h3>
            <p className="text-xs text-muted-foreground truncate">
              {prompt.description}
            </p>
          </div>
        </div>
      
        {/* Info Bar */}
        <div className="mt-auto">
          <div className="border-t border-border px-4 py-3 bg-muted/30">
            <div className="flex items-center justify-between gap-6">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex flex-col items-center gap-1.5 min-w-0 flex-1">
                      <HugeiconsIcon icon={VideoReplayIcon} className="w-5 h-5 text-foreground" />
                      <span className="text-xs font-medium text-foreground truncate text-center leading-tight">
                        {getModelDisplayName(prompt.modelName)}
                      </span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{getModelDisplayName(prompt.modelName)}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <Separator orientation="vertical" className="h-10" />
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex flex-col items-center gap-1.5 min-w-0 flex-1 cursor-pointer" onClick={handleCreatorClick}>
                      <HugeiconsIcon icon={UserIcon} className="w-5 h-5 text-foreground" />
                      <button
                        className="text-xs font-medium text-foreground hover:text-primary transition-colors cursor-pointer truncate text-center leading-tight"
                      >
                        {typeof prompt.source === 'object' ? prompt.source.name : prompt.creator}
                      </button>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>View {typeof prompt.source === 'object' ? prompt.source.name : prompt.creator} prompts</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
       
          </div>
        </div>
      </div>
    </div>
  )
}
