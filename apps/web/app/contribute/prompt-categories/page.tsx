'use client'

import { useState } from 'react'
import { createGitHubIssueUrl } from '@workspace/ui/lib/github-issue'
import { HugeiconsIcon } from "@hugeicons/react"
import { 
  PaintBrushIcon,
  Settings02Icon,
  VideoReplayIcon,
  Image02Icon,
  FileEditIcon,
  AddCircleIcon,
  SpiralsIcon,
  Leaf01Icon,
  User02Icon,
  Briefcase01Icon,
  CopyIcon,
  ClipboardIcon,
  Github01Icon,
  Download01Icon,
  CodeIcon,
  Camera01Icon,
  CameraVideoIcon,
  PlayIcon,
  RecordIcon,
  BrushIcon,
  FlashIcon,
  FlowerIcon,
  FireIcon,
  UserIcon,
  RainbowIcon,
  CloudIcon,
  StarIcon,
  MountainIcon,
  MoonIcon,
  SunIcon,
  ZapIcon,
  SparklesIcon,
  RainIcon,
  SnowIcon,
  SunsetIcon,
  SunriseIcon,
  StarsIcon,
  PaintBrush01Icon,
  PaintBrush02Icon,
  PaintBrush03Icon,
  PaintBrush04Icon,
  Rocket01Icon,
  Rocket02Icon,
  GlobeIcon,
  Megaphone01Icon,
  Megaphone02Icon,
  // AI & Technology
  AiGenerativeIcon,
  AiImageIcon,
  AiVideoIcon,
  AiMagicIcon,
  AiBrain01Icon,
  AiEditingIcon,
  ArtificialIntelligence03Icon,
  HologramIcon,
  // Animation & Motion
  Motion01Icon,
  Motion02Icon,
  KeyframeIcon,
  // 3D & Rendering
  ThreeDMoveIcon,
  ThreeDRotateIcon,
  ThreeDScaleIcon,
  // Film & Cinema
  Film01Icon,
  Film02Icon,
  FilmRoll01Icon,
  // Effects & Filters
  BlurIcon,
  FilterIcon,
  LayerIcon,
  PerspectiveIcon,
  BackgroundIcon,
  // Geometric & Abstract
  GeometricShapes01Icon,
  GeometricShapes02Icon,
  // Energy & Power
  EnergyIcon,
  EnergyEllipseIcon,
  // Flow & Movement
  FlowIcon,
  FlowCircleIcon,
  // Brain & Intelligence
  BrainIcon,
  // Mirror & Reflection
  MirrorIcon,
  // Wave & Ripple
  WaveIcon,
  RippleIcon,

  // Border & Frame
  BorderAll01Icon,
  // Digital & Cyber
  DigitalClockIcon,
  // VR & Virtual Reality
  VirtualRealityVr01Icon
} from "@hugeicons/core-free-icons"
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/ui/card"
import { Button } from "@workspace/ui/components/ui/button"
import { Input } from "@workspace/ui/components/ui/input"
import { Textarea } from "@workspace/ui/components/ui/textarea"
import { Label } from "@workspace/ui/components/ui/label"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@workspace/ui/components/ui/dropdown-menu"
import { toast } from "sonner"

interface PromptCategoryData {
  id: string
  name: string
  description: string
  icon: string
  color: string
  examples: string[]
  tags: string[]
}

// Available icons for selection with their components and display names
const AVAILABLE_ICONS = [
  // Creative & Art
  { name: 'PaintBrushIcon', displayName: 'Brush', component: PaintBrushIcon },
  { name: 'SpiralsIcon', displayName: 'Spirals', component: SpiralsIcon },
  
  // Video & Camera
  { name: 'VideoReplayIcon', displayName: 'Video', component: VideoReplayIcon },
  { name: 'Camera01Icon', displayName: 'Camera', component: Camera01Icon },
  { name: 'PlayIcon', displayName: 'Play', component: PlayIcon },
  { name: 'RecordIcon', displayName: 'Record', component: RecordIcon },
  { name: 'Image02Icon', displayName: 'Image', component: Image02Icon },
  
  // Technical & Settings
  { name: 'Settings02Icon', displayName: 'Settings', component: Settings02Icon },
  { name: 'FileEditIcon', displayName: 'Edit', component: FileEditIcon },
  { name: 'ClipboardIcon', displayName: 'Clipboard', component: ClipboardIcon },
  { name: 'CopyIcon', displayName: 'Copy', component: CopyIcon },
  
  // Nature & Weather
  { name: 'FlowerIcon', displayName: 'Flower', component: FlowerIcon },
  { name: 'Leaf01Icon', displayName: 'Leaf', component: Leaf01Icon },
  { name: 'MountainIcon', displayName: 'Mountain', component: MountainIcon },
  { name: 'CloudIcon', displayName: 'Cloud', component: CloudIcon },
  { name: 'RainIcon', displayName: 'Rain', component: RainIcon },
  { name: 'SnowIcon', displayName: 'Snow', component: SnowIcon },
  { name: 'RainbowIcon', displayName: 'Rainbow', component: RainbowIcon },
  
  // Lighting & Effects
  { name: 'SunIcon', displayName: 'Sun', component: SunIcon },
  { name: 'MoonIcon', displayName: 'Moon', component: MoonIcon },
  { name: 'SunsetIcon', displayName: 'Sunset', component: SunsetIcon },
  { name: 'FlashIcon', displayName: 'Flash', component: FlashIcon },
  { name: 'ZapIcon', displayName: 'Lightning', component: ZapIcon },
  { name: 'SparklesIcon', displayName: 'Sparkles', component: SparklesIcon },
  { name: 'StarIcon', displayName: 'Star', component: StarIcon },
  { name: 'FireIcon', displayName: 'Fire', component: FireIcon },
  
  // People & Characters
  { name: 'UserIcon', displayName: 'User', component: UserIcon },
  
  // Space & Sci-Fi
  { name: 'Rocket01Icon', displayName: 'Rocket', component: Rocket01Icon },
  
  // Communication & Business
  { name: 'Megaphone01Icon', displayName: 'Megaphone', component: Megaphone01Icon },
  { name: 'Briefcase01Icon', displayName: 'Business', component: Briefcase01Icon },
  { name: 'GlobeIcon', displayName: 'Globe', component: GlobeIcon },
  
  // General
  { name: 'AddCircleIcon', displayName: 'Add', component: AddCircleIcon },
  
  // AI & Machine Learning
  { name: 'AiGenerativeIcon', displayName: 'AI Generative', component: AiGenerativeIcon },
  { name: 'AiImageIcon', displayName: 'AI Image', component: AiImageIcon },
  { name: 'AiVideoIcon', displayName: 'AI Video', component: AiVideoIcon },
  { name: 'AiMagicIcon', displayName: 'AI Magic', component: AiMagicIcon },
  { name: 'AiBrain01Icon', displayName: 'AI Brain', component: AiBrain01Icon },
  { name: 'AiEditingIcon', displayName: 'AI Editing', component: AiEditingIcon },
  { name: 'ArtificialIntelligence03Icon', displayName: 'AI Intelligence', component: ArtificialIntelligence03Icon },
  { name: 'BrainIcon', displayName: 'Brain', component: BrainIcon },
  { name: 'HologramIcon', displayName: 'Hologram', component: HologramIcon },
  
  // Animation & Motion
  { name: 'Motion01Icon', displayName: 'Motion', component: Motion01Icon },
  { name: 'Motion02Icon', displayName: 'Motion Effects', component: Motion02Icon },
  { name: 'KeyframeIcon', displayName: 'Keyframe', component: KeyframeIcon },
  
  // 3D & Rendering
  { name: 'ThreeDMoveIcon', displayName: '3D Move', component: ThreeDMoveIcon },
  { name: 'ThreeDRotateIcon', displayName: '3D Rotate', component: ThreeDRotateIcon },
  { name: 'ThreeDScaleIcon', displayName: '3D Scale', component: ThreeDScaleIcon },
  
  // Film & Cinema
  { name: 'Film01Icon', displayName: 'Film', component: Film01Icon },
  { name: 'Film02Icon', displayName: 'Cinema', component: Film02Icon },
  { name: 'FilmRoll01Icon', displayName: 'Film Roll', component: FilmRoll01Icon },
  
  // Effects & Filters
  { name: 'BlurIcon', displayName: 'Blur', component: BlurIcon },
  { name: 'FilterIcon', displayName: 'Filter', component: FilterIcon },
  { name: 'LayerIcon', displayName: 'Layer', component: LayerIcon },
  { name: 'PerspectiveIcon', displayName: 'Perspective', component: PerspectiveIcon },
  { name: 'BackgroundIcon', displayName: 'Background', component: BackgroundIcon },
  
  // Geometric & Abstract
  { name: 'GeometricShapes01Icon', displayName: 'Geometric', component: GeometricShapes01Icon },
  { name: 'GeometricShapes02Icon', displayName: 'Abstract', component: GeometricShapes02Icon },
  
  // Energy & Power
  { name: 'EnergyIcon', displayName: 'Energy', component: EnergyIcon },
  { name: 'EnergyEllipseIcon', displayName: 'Energy Field', component: EnergyEllipseIcon },
  
  // Flow & Movement
  { name: 'FlowIcon', displayName: 'Flow', component: FlowIcon },
  { name: 'FlowCircleIcon', displayName: 'Flow Circle', component: FlowCircleIcon },
  
  // Mirror & Reflection
  { name: 'MirrorIcon', displayName: 'Mirror', component: MirrorIcon },
  
  // Wave & Ripple
  { name: 'WaveIcon', displayName: 'Wave', component: WaveIcon },
  { name: 'RippleIcon', displayName: 'Ripple', component: RippleIcon },
  
  // Border & Frame
  { name: 'BorderAll01Icon', displayName: 'Frame', component: BorderAll01Icon },
  
  // Digital & Cyber
  { name: 'DigitalClockIcon', displayName: 'Digital', component: DigitalClockIcon },
  
  // VR & Virtual Reality
  { name: 'VirtualRealityVr01Icon', displayName: 'Virtual Reality', component: VirtualRealityVr01Icon }
]

// Color options
const COLOR_OPTIONS = [
  '#8B5CF6', // Purple
  '#059669', // Green
  '#DC2626', // Red
  '#2563EB', // Blue
  '#EA580C', // Orange
  '#7C2D12', // Brown
  '#BE185D', // Pink
  '#0891B2', // Cyan
  '#65A30D', // Lime
  '#7C3AED'  // Violet
]

export default function PromptCategoriesPage() {
  const [formData, setFormData] = useState<PromptCategoryData>({
    id: '',
    name: '',
    description: '',
    icon: '',
    color: COLOR_OPTIONS[0] || '#8B5CF6',
    examples: [],
    tags: []
  })

  const [exampleInput, setExampleInput] = useState('')
  const [tagInput, setTagInput] = useState('')
  const [generatedJson, setGeneratedJson] = useState('')

  const handleInputChange = (field: keyof PromptCategoryData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
      ...(field === 'name' && { id: value.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '') })
    }))
  }

  const addExample = () => {
    if (exampleInput.trim()) {
      setFormData(prev => ({
        ...prev,
        examples: [...prev.examples, exampleInput.trim()]
      }))
      setExampleInput('')
      toast.success('Example added!')
    }
  }

  const removeExample = (index: number) => {
    setFormData(prev => ({
      ...prev,
      examples: prev.examples.filter((_, i) => i !== index)
    }))
  }

  const addTag = () => {
    if (tagInput.trim()) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }))
      setTagInput('')
      toast.success('Tag added!')
    }
  }

  const removeTag = (index: number) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter((_, i) => i !== index)
    }))
  }

  const generateJson = () => {
    if (!formData.name || !formData.description || !formData.icon) {
      toast.error('Please fill in required fields (Name, Description, Icon)')
      return
    }

    if (formData.examples.length === 0) {
      toast.error('Please add at least one example')
      return
    }

    if (formData.tags.length === 0) {
      toast.error('Please add at least one tag')
      return
    }

    const jsonData = {
      ...formData
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
      a.download = `${formData.id || 'category'}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast.success('JSON file downloaded!')
    }
  }

  const createGitHubPR = async () => {
    if (generatedJson) {
      const jsonData = JSON.parse(generatedJson)
      const url = createGitHubIssueUrl({
        type: 'prompt-category',
        title: `Prompt Category: ${formData.name || formData.id}`,
        jsonData,
      })
      toast.success('Opening GitHub to submit your category...')
      window.open(url, '_blank')
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Add New Prompt Category</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Category Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="e.g., Creative"
              />
            </div>

            <div>
              <Label htmlFor="id">Category ID</Label>
              <Input
                id="id"
                value={formData.id}
                onChange={(e) => handleInputChange('id', e.target.value)}
                placeholder="Auto-generated from name"
                disabled
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Artistic and imaginative prompts for creative video content"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="icon">Icon *</Label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-full justify-start">
                    <div className="flex items-center gap-2">
                      {formData.icon ? (
                        <HugeiconsIcon 
                          icon={AVAILABLE_ICONS.find(icon => icon.name === formData.icon)?.component || PaintBrushIcon}
                          size={16}
                        />
                      ) : (
                        <div className="w-4 h-4" />
                      )}
                      {formData.icon ? AVAILABLE_ICONS.find(icon => icon.name === formData.icon)?.displayName : "Select icon..."}
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-[var(--radix-dropdown-menu-trigger-width)] max-h-60 overflow-y-auto">
                  {AVAILABLE_ICONS.map((iconData) => (
                    <DropdownMenuItem
                      key={iconData.name}
                      onClick={() => handleInputChange('icon', iconData.name)}
                      className="flex items-center gap-2"
                    >
                      <HugeiconsIcon 
                        icon={iconData.component}
                        size={16}
                      />
                      {iconData.displayName}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div>
              <Label htmlFor="color">Color *</Label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-full justify-between">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-4 h-4 rounded-md border"
                        style={{ backgroundColor: formData.color }}
                      />
                      {formData.color}
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-[var(--radix-dropdown-menu-trigger-width)]">
                  {COLOR_OPTIONS.map((color) => (
                    <DropdownMenuItem
                      key={color}
                      onClick={() => handleInputChange('color', color)}
                      className="flex items-center gap-2"
                    >
                      <div 
                        className="w-4 h-4 rounded-md border"
                        style={{ backgroundColor: color }}
                      />
                      {color}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <div>
            <Label htmlFor="example">Examples *</Label>
            <div className="flex gap-2">
              <Input
                id="example"
                value={exampleInput}
                onChange={(e) => setExampleInput(e.target.value)}
                placeholder="e.g., Art videos"
                onKeyPress={(e) => e.key === 'Enter' && addExample()}
              />
              <Button onClick={addExample}>Add</Button>
            </div>
            {formData.examples.length > 0 && (
              <div className="mt-2 space-y-1">
                {formData.examples.map((example, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-muted rounded-md">
                    <span className="text-sm">{example}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeExample(index)}
                    >
                      ×
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <Label htmlFor="tag">Tags *</Label>
            <div className="flex gap-2">
              <Input
                id="tag"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                placeholder="e.g., art"
                onKeyPress={(e) => e.key === 'Enter' && addTag()}
              />
              <Button onClick={addTag}>Add</Button>
            </div>
            {formData.tags.length > 0 && (
              <div className="mt-2 space-y-1">
                {formData.tags.map((tag, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-muted rounded-md">
                    <span className="text-sm">{tag}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeTag(index)}
                    >
                      ×
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

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
                 Copy & Create Pull Request
                </Button>
                
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {generatedJson && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Generated JSON</CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={copyToClipboard}>
                  Copy
                </Button>
                <Button variant="outline" size="sm" onClick={downloadJson}>
                  Download
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <pre className="bg-muted p-4 rounded-md text-sm overflow-auto max-h-96">
              {generatedJson}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
