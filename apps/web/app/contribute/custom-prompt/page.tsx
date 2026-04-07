'use client'

import { useState, useEffect } from 'react'
import { createGitHubIssueUrl, buildPromptContribution } from '@workspace/ui/lib/github-issue'
import { HugeiconsIcon } from "@hugeicons/react"
import { 
  GitBranchIcon, 
  FavouriteIcon, 
  FileEditIcon, 
  AddCircleIcon, 
  CopyIcon,
  VideoReplayIcon,
  PaintBrushIcon,
  Settings02Icon,
  Image02Icon,
  ClipboardIcon,
  Leaf01Icon,
  SpiralsIcon,
  User02Icon,
  Share01Icon,
  Briefcase01Icon
} from "@hugeicons/core-free-icons"
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/ui/card"
import { Button } from "@workspace/ui/components/ui/button"
import { Input } from "@workspace/ui/components/ui/input"
import { Textarea } from "@workspace/ui/components/ui/textarea"
import { Label } from "@workspace/ui/components/ui/label"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@workspace/ui/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@workspace/ui/components/ui/tooltip"
import { ArrowDown01Icon, Globe02Icon, NewTwitterIcon, RedditIcon, FacebookIcon, RobotIcon, ApiIcon, Github01Icon, YoutubeIcon, InstagramIcon, TiktokIcon, DiscordIcon, UserGroupIcon, StarIcon, LinkIcon, Download01Icon, CodeIcon } from "@hugeicons/core-free-icons"
import { toast } from "sonner"

// Interface for custom prompt data
interface CustomPromptData {
  id: string
  title: string
  description: string
  category: string
  tags: string[]
  sourceName: string
  sourceType: string
  sourceUrl: string
  modelName: string
  generationType: 'text_to_video' | 'image_to_video'
  prompt: string
  imageUrl: string
  thumbnailUrl: string
  videoUrl: string
}

// Interface for model data
interface Model {
  model_id: string
  display_name: string
  description: string
  category: string
  provider: string
  status: string
  tags: string[]
  searchTerms: string[]
}

// Interface for category data
interface Category {
  id: string
  name: string
  description: string
  icon: string
  color: string
  examples: string[]
  tags: string[]
}

// Source type definition
type SourceType = 'community' | 'x' | 'reddit' | 'huggingface' | 'fal_ai' | 'github' | 'youtube' | 'original'

// Source configurations
const SOURCE_CONFIGS: Record<SourceType, { name: string; baseUrl: string; displayName: string; icon: string; color: string; description: string }> = {
  community: {
    name: 'community',
    baseUrl: 'https://github.com/ilkerzg/awesome-video-prompts',
    displayName: 'Community',
    icon: 'Globe02Icon',
    color: '#3B82F6',
    description: 'Community Library'
  },
  x: {
    name: 'x',
    baseUrl: 'https://x.com',
    displayName: 'X (Twitter)',
    icon: 'NewTwitterIcon',
    color: '#000000',
    description: 'X (formerly Twitter) posts'
  },
  reddit: {
    name: 'reddit',
    baseUrl: 'https://reddit.com',
    displayName: 'Reddit',
    icon: 'RedditIcon',
    color: '#FF4500',
    description: 'Reddit community posts'
  },

  huggingface: {
    name: 'huggingface',
    baseUrl: 'https://huggingface.co',
    displayName: 'Hugging Face',
    icon: 'RobotIcon',
    color: '#FFD21E',
    description: 'Hugging Face community'
  },
  fal_ai: {
    name: 'fal_ai',
    baseUrl: 'https://fal.ai',
    displayName: 'FAL AI',
    icon: 'ApiIcon',
    color: '#8B5CF6',
    description: 'FAL AI platform'
  },
  github: {
    name: 'github',
    baseUrl: 'https://github.com',
    displayName: 'GitHub',
    icon: 'Github01Icon',
    color: '#6B7280',
    description: 'GitHub repositories'
  },
  youtube: {
    name: 'youtube',
    baseUrl: 'https://youtube.com',
    displayName: 'YouTube',
    icon: 'YoutubeIcon',
    color: '#FF0000',
    description: 'YouTube videos and channels'
  },




  original: {
    name: 'original',
    baseUrl: '',
    displayName: 'Original',
    icon: 'StarIcon',
    color: '#F59E0B',
    description: 'Original content'
  },

}

// Source icon mapping function
const getSourceIconComponent = (iconName: string) => {
  const iconMap: { [key: string]: any } = {
    'Globe02Icon': Globe02Icon,
    'NewTwitterIcon': NewTwitterIcon,
    'RedditIcon': RedditIcon,
    'FacebookIcon': FacebookIcon,
    'RobotIcon': RobotIcon,
    'ApiIcon': ApiIcon,
    'Github01Icon': Github01Icon,
    'YoutubeIcon': YoutubeIcon,
    'InstagramIcon': InstagramIcon,
    'TiktokIcon': TiktokIcon,
    'DiscordIcon': DiscordIcon,
    'UserGroupIcon': UserGroupIcon,
    'StarIcon': StarIcon,
    'LinkIcon': LinkIcon
  }
  return iconMap[iconName] || Globe02Icon // Default fallback
}

// Icon mapping function
const getIconComponent = (iconName: string) => {
  const iconMap: { [key: string]: any } = {
    'VideoReplayIcon': VideoReplayIcon,
    'PaintBrushIcon': PaintBrushIcon,
    'Settings02Icon': Settings02Icon,
    'Image02Icon': Image02Icon,
    'ClipboardIcon': ClipboardIcon,
    'Leaf01Icon': Leaf01Icon,
    'SpiralsIcon': SpiralsIcon,
    'User02Icon': User02Icon,
    'Share01Icon': Share01Icon,
    'Briefcase01Icon': Briefcase01Icon
  }
  return iconMap[iconName] || VideoReplayIcon // Default fallback
}

export default function ContributePage() {
  const [formData, setFormData] = useState<CustomPromptData>({
    id: '',
    title: '',
    description: '',
    category: 'general',
    tags: [],
    sourceName: '',
    sourceType: 'community',
    sourceUrl: '',
    modelName: '',
    generationType: 'text_to_video',
    prompt: '',
    imageUrl: '',
    thumbnailUrl: '',
    videoUrl: ''
  })
  const [tagsInput, setTagsInput] = useState('')
  const [generatedJson, setGeneratedJson] = useState('')
  const [showJsonGenerator, setShowJsonGenerator] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoadingCategories, setIsLoadingCategories] = useState(true)
  const [models, setModels] = useState<Model[]>([])
  const [isLoadingModels, setIsLoadingModels] = useState(true)

  // Fetch categories from public URL
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/data/categories.json')
        const data = await response.json()
        setCategories(data.categories || [])
      } catch (error) {
        console.error('Error fetching categories:', error)
        toast.error('Failed to load categories')
      } finally {
        setIsLoadingCategories(false)
      }
    }

    fetchCategories()
  }, [])

  // Fetch models from public URL
  useEffect(() => {
    const fetchModels = async () => {
      try {
        const response = await fetch('/data/models.json')
        const data = await response.json()
        setModels(data.models || [])
      } catch (error) {
        console.error('Error fetching models:', error)
        toast.error('Failed to load models')
      } finally {
        setIsLoadingModels(false)
      }
    }

    fetchModels()
  }, [])

  const handleInputChange = (field: keyof CustomPromptData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleTagsChange = (value: string) => {
    setTagsInput(value)
  }

  const handleTagKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && tagsInput.trim()) {
      e.preventDefault()
      const newTag = tagsInput.trim()
      if (!formData.tags.includes(newTag)) {
        setFormData(prev => ({ ...prev, tags: [...prev.tags, newTag] }))
      }
      setTagsInput('')
    }
  }

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({ ...prev, tags: prev.tags.filter(tag => tag !== tagToRemove) }))
  }

  const validateAndSanitizePrompt = (prompt: string): string => {
    // Check if prompt looks like JSON
    if (prompt.trim().startsWith('{') && prompt.trim().endsWith('}')) {
      try {
        // Try to parse as JSON to validate
        JSON.parse(prompt)
        // If it's valid JSON, escape quotes and newlines for safe embedding
        return prompt.replace(/"/g, '\\"').replace(/\n/g, '\\n')
      } catch {
        // If invalid JSON, treat as regular text
        return prompt
      }
    }
    return prompt
  }

  const generateId = (title: string) => {
    return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
  }

  const generateJson = () => {
    // Validation
    if (!formData.title || !formData.prompt) {
      toast.error('Please fill in at least the title and prompt fields')
      return
    }
    
    if (!formData.modelName) {
      toast.error('Please select a model')
      return
    }
    
    if (!formData.videoUrl && !formData.thumbnailUrl) {
      toast.error('Please provide either a video URL or thumbnail URL (at least one is required)')
      return
    }
    
    if (formData.generationType === 'image_to_video' && !formData.imageUrl) {
      toast.error('Please provide an image URL for image-to-video generation')
      return
    }

    const id = formData.id || generateId(formData.title)
    const searchTerms = [
      formData.title.toLowerCase(),
      formData.description.toLowerCase(),
      ...formData.tags
    ].filter(term => term.length > 0)

    const jsonData = {
      id,
      title: formData.title,
      description: formData.description,
      category: formData.category,
      tags: formData.tags,
      source: {
        type: formData.sourceType,
        name: formData.sourceName || "contributor",
        url: formData.sourceUrl || "https://github.com/ilkerzg/awesome-video-prompts"
      },
      modelName: "fal-ai/wan/v2.2-5b/text-to-video",
      status: "active",
      featured: false,
      thumbnailUrl: formData.thumbnailUrl || `/thumbnails/${id}.jpg`,
      video: formData.videoUrl || `https://example.com/${id}.mp4`,
      generationType: "text_to_video",
      searchTerms,
      prompt: validateAndSanitizePrompt(formData.prompt)
    }

    setGeneratedJson(JSON.stringify(jsonData, null, 2))
    toast.success('JSON generated successfully!')
  }

  const copyToClipboard = async () => {
    if (generatedJson) {
      await navigator.clipboard.writeText(generatedJson)
      toast.success('JSON copied to clipboard!')
    }
  }

  const downloadJson = () => {
    if (generatedJson) {
      const blob = new Blob([generatedJson], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${formData.id || 'custom-prompt'}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast.success('JSON file downloaded!')
    }
  }

  const createGitHubPR = async () => {
    if (generatedJson) {
      const contribution = buildPromptContribution({
        title: formData.title,
        description: formData.description,
        prompt: formData.prompt,
        category: formData.category,
        tags: formData.tags,
        modelName: formData.modelName,
        author: formData.sourceName,
        sourceUrl: formData.sourceUrl,
        videoUrl: formData.videoUrl,
        thumbnailUrl: formData.thumbnailUrl,
        generationType: formData.generationType,
      })

      const url = createGitHubIssueUrl({
        type: 'custom-prompt',
        title: formData.title,
        description: formData.description,
        jsonData: contribution,
        author: formData.sourceName,
      })

      toast.success('Opening GitHub to submit your prompt...')
      window.open(url, '_blank')
    }
  }

  const renderJsonTemplate = () => {
    const defaultValues = {
      id: 'your-prompt-id',
      title: 'Your Prompt Title',
      description: 'Brief description of your prompt',
      category: 'selected-category',
      tags: ['tag1', 'tag2', 'tag3'],
      sourceName: 'your-username',
      sourceType: 'source-type',
      sourceUrl: 'https://your-source.com',
      modelName: 'selected-model',
      generationType: 'text_to_video',
      prompt: 'Your detailed video generation prompt here...',
      imageUrl: 'https://example.com/image.jpg',
      thumbnailUrl: '/thumbnails/your-prompt.jpg',
      videoUrl: 'https://example.com/your-video.mp4'
    }

    const currentValues = {
      id: formData.id || generateId(formData.title) || defaultValues.id,
      title: formData.title || defaultValues.title,
      description: formData.description || defaultValues.description,
      category: formData.category || defaultValues.category,
      tags: formData.tags.length > 0 ? formData.tags : defaultValues.tags,
      sourceName: formData.sourceName || defaultValues.sourceName,
      sourceType: formData.sourceType || defaultValues.sourceType,
      sourceUrl: formData.sourceUrl || defaultValues.sourceUrl,
      modelName: formData.modelName || defaultValues.modelName,
      generationType: formData.generationType || defaultValues.generationType,
      prompt: formData.prompt || defaultValues.prompt,
      imageUrl: formData.imageUrl || defaultValues.imageUrl,
      thumbnailUrl: formData.thumbnailUrl || defaultValues.thumbnailUrl,
      videoUrl: formData.videoUrl || defaultValues.videoUrl
    }

    const isChanged = (key: string) => {
      const defaultVal = defaultValues[key as keyof typeof defaultValues]
      const currentVal = currentValues[key as keyof typeof currentValues]
      
      if (Array.isArray(defaultVal) && Array.isArray(currentVal)) {
        return JSON.stringify(defaultVal) !== JSON.stringify(currentVal)
      }
      return defaultVal !== currentVal
    }

    const renderLine = (content: string, key?: string) => {
      const changed = key ? isChanged(key) : false
      const lineClass = changed 
        ? 'border-l-2 border-green bg-green/20 pl-2 -ml-2'
        : ''
      
      return (
        <span key={key || content} className={lineClass}>
          {content}
        </span>
      )
    }

    const searchTerms = [...(currentValues.title ? [currentValues.title.toLowerCase()] : []), ...currentValues.tags]

    return (
      <>
        {renderLine('{')}
        {'\n'}
        {renderLine(`  "id": "${currentValues.id}",`, 'id')}
        {'\n'}
        {renderLine(`  "title": "${currentValues.title}",`, 'title')}
        {'\n'}
        {renderLine(`  "description": "${currentValues.description}",`, 'description')}
        {'\n'}
        {renderLine(`  "category": "${currentValues.category}",`, 'category')}
        {'\n'}
        {renderLine(`  "tags": [${currentValues.tags.map(tag => `"${tag}"`).join(', ')}],`, 'tags')}
        {'\n'}
        {renderLine('  "source": {')}
        {'\n'}
        {renderLine(`    "type": "${currentValues.sourceType}",`, 'sourceType')}
        {'\n'}
        {renderLine(`    "name": "${currentValues.sourceName}",`, 'sourceName')}
        {'\n'}
        {renderLine(`    "url": "${currentValues.sourceUrl}"`, 'sourceUrl')}
        {'\n'}
        {renderLine('  },')}
        {'\n'}
        {renderLine(`  "modelName": "${currentValues.modelName}",`, 'modelName')}
        {'\n'}
        {renderLine(`  "generationType": "${currentValues.generationType}",`, 'generationType')}
        {'\n'}
        {renderLine(`  "prompt": "${currentValues.prompt}",`, 'prompt')}
        {'\n'}
        {currentValues.generationType === 'image_to_video' && (
          <>
            {renderLine(`  "imageUrl": "${currentValues.imageUrl}",`, 'imageUrl')}
            {'\n'}
          </>
        )}
        {renderLine(`  "thumbnailUrl": "${currentValues.thumbnailUrl}",`, 'thumbnailUrl')}
        {'\n'}
        {renderLine(`  "videoUrl": "${currentValues.videoUrl}",`, 'videoUrl')}
        {'\n'}
        {renderLine(`  "searchTerms": [${searchTerms.map(term => `"${term}"`).join(', ')}]`)}
        {'\n'}
        {renderLine('}')}
      </>
    )
  }

  return (
    <div className="w-full mx-auto  p-0 space-y-8">
     
      {/* Custom Prompt JSON Template */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HugeiconsIcon icon={CodeIcon} className="h-5 w-5" />
            Custom Prompt JSON Template
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            This template updates in real-time as you fill out the form. Changed lines are highlighted.
          </p>
        </CardHeader>
        <CardContent>
          <div className="bg-muted p-4 rounded-md overflow-x-auto">
            <pre className="text-sm whitespace-pre-wrap font-mono">
              {renderJsonTemplate()}
            </pre>
          </div>
        </CardContent>
      </Card>

      {/* JSON Generator */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HugeiconsIcon icon={AddCircleIcon} className="h-5 w-5" />
            Generate Custom Prompt JSON
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-sm text-muted-foreground mb-4">
            Fill out the form below to automatically generate a properly formatted JSON file for your custom prompt.
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                placeholder="e.g., Cinematic Close-Up"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
              />
            </div>

            {/* ID */}
            <div className="space-y-2">
              <Label htmlFor="id">ID (auto-generated from title)</Label>
              <Input
                id="id"
                placeholder="e.g., cinematic-close-up"
                value={formData.id || generateId(formData.title)}
                onChange={(e) => handleInputChange('id', e.target.value)}
              />
            </div>

            {/* Description */}
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Brief description of your prompt"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={2}
              />
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-full justify-between">
                    <div className="flex items-center gap-2">
                      {categories.find(cat => cat.id === formData.category) && (
                        <div 
                          className="flex items-center justify-center h-6 w-6 rounded bg-background"
                          style={{ backgroundColor: `${categories.find(cat => cat.id === formData.category)!.color}20` }}
                        >
                          <HugeiconsIcon 
                            icon={getIconComponent(categories.find(cat => cat.id === formData.category)!.icon)} 
                            className="h-4 w-4" 
                            style={{ color: categories.find(cat => cat.id === formData.category)!.color }}
                          />
                        </div>
                      )}
                      {categories.find(cat => cat.id === formData.category)?.name || 'Select Category'}
                    </div>
                    <HugeiconsIcon icon={ArrowDown01Icon} className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-[var(--radix-dropdown-menu-trigger-width)] min-w-[var(--radix-dropdown-menu-trigger-width)]">
                  {isLoadingCategories ? (
                    <DropdownMenuItem disabled>
                      Loading categories...
                    </DropdownMenuItem>
                  ) : (
                    categories.map((cat) => (
                      <DropdownMenuItem
                        key={cat.id}
                        onClick={() => handleInputChange('category', cat.id)}
                        className="flex flex-col items-start space-y-1 cursor-pointer"
                      >
                        <div className="flex items-center gap-2 w-full">
                          <div 
                            className="flex items-center justify-center h-6 w-6 rounded bg-background"
                            style={{ backgroundColor: `${cat.color}20` }}
                          >
                            <HugeiconsIcon 
                              icon={getIconComponent(cat.icon)} 
                              className="h-4 w-4" 
                              style={{ color: cat.color }}
                            />
                          </div>
                          <span className="font-medium">{cat.name}</span>
                        </div>
                        <span className="text-xs text-muted-foreground ml-6">{cat.description}</span>
                      </DropdownMenuItem>
                    ))
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Source Name */}
            <div className="space-y-2">
              <Label htmlFor="sourceName">Your Name/Username</Label>
              <Input
                id="sourceName"
                placeholder="e.g., your-username"
                value={formData.sourceName}
                onChange={(e) => handleInputChange('sourceName', e.target.value)}
              />
            </div>

            {/* Source Type */}
            <div className="space-y-2">
              <Label htmlFor="sourceType">Source Type</Label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-full justify-between">
                    <div className="flex items-center gap-2">
                      {SOURCE_CONFIGS[formData.sourceType as SourceType] && (
                        <div 
                          className="flex items-center justify-center h-6 w-6 rounded bg-background"
                          style={{ backgroundColor: `${SOURCE_CONFIGS[formData.sourceType as SourceType].color}20` }}
                        >
                          <HugeiconsIcon 
                            icon={getSourceIconComponent(SOURCE_CONFIGS[formData.sourceType as SourceType].icon)} 
                            className="h-4 w-4" 
                            style={{ color: SOURCE_CONFIGS[formData.sourceType as SourceType].color }}
                          />
                        </div>
                      )}
                      {SOURCE_CONFIGS[formData.sourceType as SourceType]?.displayName || 'Select Source'}
                    </div>
                    <HugeiconsIcon icon={ArrowDown01Icon} className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-[var(--radix-dropdown-menu-trigger-width)] min-w-[var(--radix-dropdown-menu-trigger-width)] max-h-60 overflow-y-auto">
                  {Object.entries(SOURCE_CONFIGS).map(([key, source]) => {
                    const menuItem = (
                      <DropdownMenuItem
                        key={key}
                        onClick={() => handleInputChange('sourceType', key)}
                        className="flex flex-col items-start space-y-1 cursor-pointer"
                      >
                        <div className="flex items-center gap-2 w-full">
                          <div 
                            className="flex items-center justify-center h-6 w-6 rounded bg-background"
                            style={{ backgroundColor: `${source.color}20` }}
                          >
                            <HugeiconsIcon 
                              icon={getSourceIconComponent(source.icon)} 
                              className="h-4 w-4" 
                              style={{ color: source.color }}
                            />
                          </div>
                          <span className="font-medium">{source.displayName}</span>
                        </div>
                        <span className="text-xs text-muted-foreground ml-8">{source.description}</span>
                      </DropdownMenuItem>
                    );

                    // Add tooltip warning for "Other" source
                    if (key === 'other') {
                      return (
                        <TooltipProvider key={key}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              {menuItem}
                            </TooltipTrigger>
                            <TooltipContent side="right" className="max-w-xs">
                              <p className="text-sm font-medium text-yellow-600">⚠️ Warning</p>
                              <p className="text-xs mt-1">
                                Only use "Other" for legitimate sources. 
                                Spam links, advertisements, or unrelated content are not allowed.
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      );
                    }

                    return menuItem;
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Source URL */}
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="sourceUrl">Source URL (optional)</Label>
              <Input
                id="sourceUrl"
                placeholder="e.g., https://github.com/your-repo or https://your-website.com"
                value={formData.sourceUrl}
                onChange={(e) => handleInputChange('sourceUrl', e.target.value)}
              />
            </div>

            {/* Model Selection */}
            <div className="space-y-2">
              <Label htmlFor="model">AI Model</Label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-full justify-between">
                    <span>
                      {models.find(model => model.model_id === formData.modelName)?.display_name || 'Select Model'}
                    </span>
                    <HugeiconsIcon icon={ArrowDown01Icon} className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-[var(--radix-dropdown-menu-trigger-width)] min-w-[var(--radix-dropdown-menu-trigger-width)] max-h-60 overflow-y-auto">
                  {isLoadingModels ? (
                    <DropdownMenuItem disabled>
                      Loading models...
                    </DropdownMenuItem>
                  ) : (
                    models.map((model) => (
                      <DropdownMenuItem
                        key={model.model_id}
                        onClick={() => handleInputChange('modelName', model.model_id)}
                        className="flex flex-col items-start space-y-1 cursor-pointer"
                      >
                        <span className="font-medium">{model.display_name}</span>
                        <span className="text-xs text-muted-foreground">{model.description}</span>
                      </DropdownMenuItem>
                    ))
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Generation Type */}
            <div className="space-y-2">
              <Label htmlFor="generationType">Generation Type</Label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-full justify-between">
                    <span>
                      {formData.generationType === 'text_to_video' ? 'Text to Video' : 
                       formData.generationType === 'image_to_video' ? 'Image to Video' : 
                       'Select Type'}
                    </span>
                    <HugeiconsIcon icon={ArrowDown01Icon} className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-[var(--radix-dropdown-menu-trigger-width)] min-w-[var(--radix-dropdown-menu-trigger-width)]">
                  <DropdownMenuItem
                    onClick={() => handleInputChange('generationType', 'text_to_video')}
                    className="cursor-pointer"
                  >
                    <div className="flex flex-col items-start">
                      <span className="font-medium">Text to Video</span>
                      <span className="text-xs text-muted-foreground">Generate video from text prompt</span>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleInputChange('generationType', 'image_to_video')}
                    className="cursor-pointer"
                  >
                    <div className="flex flex-col items-start">
                      <span className="font-medium">Image to Video</span>
                      <span className="text-xs text-muted-foreground">Generate video from image + text prompt</span>
                    </div>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Image URL - only show if image_to_video is selected */}
            {formData.generationType === 'image_to_video' && (
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="imageUrl">Image URL (required for image-to-video)</Label>
                <Input
                  id="imageUrl"
                  placeholder="https://example.com/your-image.jpg"
                  value={formData.imageUrl}
                  onChange={(e) => handleInputChange('imageUrl', e.target.value)}
                />
              </div>
            )}

            {/* Tags */}
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="tags">Tags (press Enter to add)</Label>
              <Input
                id="tags"
                placeholder="Type a tag and press Enter"
                value={tagsInput}
                onChange={(e) => handleTagsChange(e.target.value)}
                onKeyPress={handleTagKeyPress}
              />
              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.tags.map((tag, index) => (
                    <div key={index} className="bg-primary/10 text-primary px-2 py-1 rounded text-xs flex items-center gap-1">
                      <span>{tag}</span>
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="hover:bg-primary/20 rounded-md w-4 h-4 flex items-center justify-center text-xs"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Thumbnail URL */}
            <div className="space-y-2">
              <Label htmlFor="thumbnailUrl">Thumbnail URL (at least one of thumbnail or video required)</Label>
              <Input
                id="thumbnailUrl"
                placeholder="/thumbnails/your-prompt.jpg"
                value={formData.thumbnailUrl}
                onChange={(e) => handleInputChange('thumbnailUrl', e.target.value)}
              />
            </div>

            {/* Video URL */}
            <div className="space-y-2">
              <Label htmlFor="videoUrl">Video URL (at least one of thumbnail or video required)</Label>
              <Input
                id="videoUrl"
                placeholder="https://example.com/your-video.mp4"
                value={formData.videoUrl}
                onChange={(e) => handleInputChange('videoUrl', e.target.value)}
              />
            </div>

            {/* Prompt */}
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="prompt">Video Generation Prompt *</Label>
              <Textarea
                id="prompt"
                placeholder="Your detailed video generation prompt here..."
                value={formData.prompt}
                onChange={(e) => handleInputChange('prompt', e.target.value)}
                rows={4}
              />
            </div>
          </div>

          {/* Generate Button */}
          <div className="flex gap-3">
          {!generatedJson && (
           <Button onClick={generateJson} className="flex items-center gap-2">
           <HugeiconsIcon icon={CodeIcon} className="h-4 w-4" />
           Generate JSON
         </Button>
            )}
           
            {generatedJson && (
              <>
                <Button onClick={createGitHubPR} className="flex items-center gap-2 ">
                  <HugeiconsIcon icon={Github01Icon} className="h-4 w-4" />
                 Submit to Gallery
                </Button>
                
              </>
            )}
          </div>

          {/* Generated JSON Display */}
          {generatedJson && (
            <div className="space-y-2">
              <Label>Generated JSON:</Label>
              <div className="bg-muted p-4 rounded-md overflow-x-auto">
                <pre className="text-sm whitespace-pre-wrap">{generatedJson}</pre>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  )
}
