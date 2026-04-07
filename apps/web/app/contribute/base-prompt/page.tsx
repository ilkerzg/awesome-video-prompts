'use client'

import { useState } from 'react'
import { createGitHubIssueUrl } from '@workspace/ui/lib/github-issue'
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/ui/card"
import { Button } from "@workspace/ui/components/ui/button"
import { Input } from "@workspace/ui/components/ui/input"
import { Textarea } from "@workspace/ui/components/ui/textarea"
import { Label } from "@workspace/ui/components/ui/label"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@workspace/ui/components/ui/dropdown-menu"
import { toast } from "sonner"
import { HugeiconsIcon } from "@hugeicons/react"
import { Github01Icon, CopyIcon, Download01Icon, CodeIcon } from "@hugeicons/core-free-icons"

interface BasePromptExample {
  type: "video" | "image"
  url: string
}

interface BasePromptThumbnail {
  type: "image"
  url: string
}

interface BasePromptValue {
  value: string
  prompt: string
  example: BasePromptExample
  thumbnail: BasePromptThumbnail
  category: string
}

interface BasePromptData {
  values: BasePromptValue[]
}

const CATEGORIES = [
  'historical_period',
  'lighting',
  'camera_shot',
  'camera_movement',
  'mood',
  'style',
  'subject',
  'environment',
  'time_of_day',
  'weather',
  'color_grade',
  'composition',
  'lens',
  'frame_rate_motion',
  'sound_direction',
  'vfx',
  'action_blocking',
  'transitions_editing',
  'style_family',
  'motion_logic',
  'focus_control',
  'culture_context'
]

// Display names for categories
const CATEGORY_DISPLAY_NAMES: Record<string, string> = {
  'historical_period': 'Historical Period',
  'lighting': 'Lighting',
  'camera_shot': 'Camera Shot',
  'camera_movement': 'Camera Movement',
  'mood': 'Mood',
  'style': 'Style',
  'subject': 'Subject',
  'environment': 'Environment',
  'time_of_day': 'Time of Day',
  'weather': 'Weather',
  'color_grade': 'Color Grade',
  'composition': 'Composition',
  'lens': 'Lens',
  'frame_rate_motion': 'Frame Rate & Motion',
  'sound_direction': 'Sound Direction',
  'vfx': 'VFX',
  'action_blocking': 'Action & Blocking',
  'transitions_editing': 'Transitions & Editing',
  'style_family': 'Style Family',
  'motion_logic': 'Motion Logic',
  'focus_control': 'Focus Control',
  'culture_context': 'Culture & Context'
}

export default function BasePromptPage() {
  const [selectedCategory, setSelectedCategory] = useState('')
  const [formData, setFormData] = useState<BasePromptData>({
    values: []
  })

  const [currentValue, setCurrentValue] = useState<BasePromptValue>({
    value: '',
    prompt: '',
    example: { type: 'video', url: '' },
    thumbnail: { type: 'image', url: '' },
    category: ''
  })

  const [generatedJson, setGeneratedJson] = useState('')

  const addValue = () => {
    if (!currentValue.value || !currentValue.prompt) {
      toast.error('Please fill in all required fields for the value')
      return
    }

    setFormData(prev => ({
      ...prev,
      values: [...prev.values, { ...currentValue, category: selectedCategory }]
    }))

    setCurrentValue({
      value: '',
      prompt: '',
      example: { type: 'video', url: '' },
      thumbnail: { type: 'image', url: '' },
      category: ''
    })

    toast.success('Value added successfully!')
  }

  const removeValue = (index: number) => {
    setFormData(prev => ({
      ...prev,
      values: prev.values.filter((_, i) => i !== index)
    }))
  }

  const generateJson = () => {
    if (!selectedCategory || formData.values.length === 0) {
      toast.error('Please select a category and add at least one value')
      return
    }

    // Generate individual JSON files for each value
    const jsonFiles = formData.values.map(value => {
      const jsonData = {
        value: value.value,
        prompt: value.prompt,
        example: value.example,
        thumbnail: value.thumbnail,
        category: selectedCategory
      }
      return {
        filename: `${value.value.toLowerCase().replace(/[^a-z0-9]/g, '-')}.json`,
        content: JSON.stringify(jsonData, null, 2)
      }
    })

    // For display purposes, show all generated files
    const allJsonContent = jsonFiles.map(file => 
      `// ${file.filename}\n${file.content}`
    ).join('\n\n')

    setGeneratedJson(allJsonContent)
    toast.success(`Generated ${jsonFiles.length} JSON file(s) successfully!`)
  }

  const copyToClipboard = async () => {
    if (generatedJson) {
      await navigator.clipboard.writeText(generatedJson)
      toast.success('JSON copied to clipboard!')
    }
  }

  const downloadJson = () => {
    if (generatedJson && formData.values.length > 0) {
      if (formData.values.length === 1) {
        // Single file download
        const value = formData.values[0]
        if (!value) return
        const jsonData = {
          value: value.value,
          prompt: value.prompt,
          example: value.example,
          thumbnail: value.thumbnail,
          category: selectedCategory
        }
        const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${value.value.toLowerCase().replace(/[^a-z0-9]/g, '-')}.json`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
        toast.success('JSON file downloaded!')
      } else {
        // Multiple files - download as text file with instructions
        const blob = new Blob([generatedJson], { type: 'text/plain' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${selectedCategory}-base-prompts.txt`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
        toast.success('All JSON files downloaded as text!')
      }
    }
  }

  const createGitHubPR = async () => {
    if (generatedJson && formData.values.length > 0) {
      const elements = formData.values.map(v => ({
        value: v.value,
        prompt: v.prompt,
        example: v.example,
        thumbnail: v.thumbnail,
        category: selectedCategory,
      }))

      const url = createGitHubIssueUrl({
        type: 'prompt-element',
        title: elements.length === 1
          ? `${selectedCategory}: ${elements[0]?.value}`
          : `${selectedCategory}: ${elements.length} elements`,
        jsonData: elements.length === 1 ? elements[0] as any : { elements } as any,
      })

      toast.success('Opening GitHub to submit your element...')
      window.open(url, '_blank')
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Add New Base Prompt</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="category">Category *</Label>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full justify-between">
                  {selectedCategory ? CATEGORY_DISPLAY_NAMES[selectedCategory] : "Select category..."}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-full">
                {CATEGORIES.map((category) => (
                  <DropdownMenuItem
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                  >
                    {CATEGORY_DISPLAY_NAMES[category]}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          
          <div className="border-t pt-4">
            <h3 className="text-lg font-semibold mb-4">Add Values</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="value">Value *</Label>
                <Input
                  id="value"
                  value={currentValue.value}
                  onChange={(e) => setCurrentValue(prev => ({ ...prev, value: e.target.value }))}
                  placeholder="e.g., ancient"
                />
              </div>

              <div>
                <Label htmlFor="prompt">Prompt *</Label>
                <Textarea
                  id="prompt"
                  value={currentValue.prompt}
                  onChange={(e) => setCurrentValue(prev => ({ ...prev, prompt: e.target.value }))}
                  placeholder="stone and metal artifacts, hand-crafted surface irregularities..."
                />
              </div>

              <div>
                <Label htmlFor="example-url">Example Video URL</Label>
                <Input
                  id="example-url"
                  value={currentValue.example.url}
                  onChange={(e) => setCurrentValue(prev => ({ 
                    ...prev, 
                    example: { ...prev.example, url: e.target.value }
                  }))}
                  placeholder="https://v3.fal.media/files/..."
                />
              </div>

              <div>
                <Label htmlFor="thumbnail-url">Thumbnail URL</Label>
                <Input
                  id="thumbnail-url"
                  value={currentValue.thumbnail.url}
                  onChange={(e) => setCurrentValue(prev => ({ 
                    ...prev, 
                    thumbnail: { ...prev.thumbnail, url: e.target.value }
                  }))}
                  placeholder="/thumbnails/ancient.jpg"
                />
              </div>
            </div>

            <Button onClick={addValue} className="mt-4">Add Value</Button>
          </div>

          {formData.values.length > 0 && (
            <div className="border-t pt-4">
              <h3 className="text-lg font-semibold mb-4">Added Values ({formData.values.length})</h3>
              <div className="space-y-2">
                {formData.values.map((value, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-md">
                    <div>
                      <span className="font-medium">{value.value}</span>
                      <p className="text-sm text-muted-foreground">{value.prompt.substring(0, 100)}...</p>
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => removeValue(index)}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

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
            <CardTitle>Generated JSON</CardTitle>
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
