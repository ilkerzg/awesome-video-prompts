'use client'

import { useState } from 'react'
import { createGitHubIssueUrl } from '@workspace/ui/lib/github-issue'
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/ui/card"
import { Button } from "@workspace/ui/components/ui/button"
import { Input } from "@workspace/ui/components/ui/input"
import { Textarea } from "@workspace/ui/components/ui/textarea"
import { Label } from "@workspace/ui/components/ui/label"
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

interface BasePromptExampleValue {
  value: string
  prompt: string
  example: BasePromptExample
  thumbnail: BasePromptThumbnail
  category: string
}

interface BasePromptCategoryData {
  category: string
  name: string
  description: string
  example: BasePromptExampleValue
}

export default function BasePromptCategoryPage() {
  const [categoryId, setCategoryId] = useState('')
  const [categoryName, setCategoryName] = useState('')
  
  // Auto-generate category ID from category name
  const generateCategoryId = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '') // Remove special characters
      .replace(/\s+/g, '_') // Replace spaces with underscores
      .replace(/_+/g, '_') // Replace multiple underscores with single
      .replace(/^_|_$/g, '') // Remove leading/trailing underscores
  }
  
  // Update category ID when category name changes
  const handleCategoryNameChange = (value: string) => {
    setCategoryName(value)
    const autoId = generateCategoryId(value)
    setCategoryId(autoId)
  }
  const [description, setDescription] = useState('')
  const [currentValue, setCurrentValue] = useState<BasePromptExampleValue>({
    value: '',
    prompt: '',
    example: { type: 'video', url: '' },
    thumbnail: { type: 'image', url: '' },
    category: ''
  })

  const [generatedJson, setGeneratedJson] = useState('')

  const generateJson = () => {
    if (!categoryId || !categoryName || !description) {
      toast.error('Please fill in all required fields (Category ID, Name, and Description)')
      return
    }

    if (!currentValue.value || !currentValue.prompt) {
      toast.error('Please fill in the example value and prompt')
      return
    }

    if (!currentValue.example.url) {
      toast.error('Example URL is required')
      return
    }

    const exampleValue = {
      ...currentValue,
      category: categoryId
    }

    const jsonData: BasePromptCategoryData = {
      category: categoryId,
      name: categoryName,
      description: description,
      example: exampleValue
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
    if (generatedJson && categoryId) {
      const blob = new Blob([generatedJson], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${categoryId}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast.success('JSON file downloaded!')
    }
  }

  const createGitHubPR = async () => {
    if (generatedJson && categoryId) {
      const jsonData = JSON.parse(generatedJson)
      const url = createGitHubIssueUrl({
        type: 'element-category',
        title: `Element Category: ${categoryId}`,
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
          <CardTitle>Add New Base Prompt Category</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="categoryName">Category Name *</Label>
            <Input
              id="categoryName"
              value={categoryName}
              onChange={(e) => handleCategoryNameChange(e.target.value)}
              placeholder="e.g., Action & Blocking"
            />
          </div>

          <div>
            <Label htmlFor="categoryId">Category ID (Auto-generated)</Label>
            <Input
              id="categoryId"
              value={categoryId}
              readOnly
              className="bg-muted cursor-not-allowed"
              placeholder="Will be generated from category name"
            />
          </div>
          
          <div>
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Subject actions and timing (subject-agnostic phrasing only)"
            />
          </div>

          <div className="border-t pt-4">
            <h3 className="text-lg font-semibold mb-4">Example *</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="value">Value *</Label>
                <Input
                  id="value"
                  value={currentValue.value}
                  onChange={(e) => setCurrentValue(prev => ({ ...prev, value: e.target.value }))}
                  placeholder="e.g., idle atmospheric"
                />
              </div>

              <div>
                <Label htmlFor="prompt">Prompt *</Label>
                <Textarea
                  id="prompt"
                  value={currentValue.prompt}
                  onChange={(e) => setCurrentValue(prev => ({ ...prev, prompt: e.target.value }))}
                  placeholder="minimal pose variance, micro-movements only, extended temporal holds..."
                />
              </div>

              <div>
                <Label htmlFor="example-url">Example Video URL *</Label>
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
                  placeholder="/thumbnails/idle-atmospheric.jpg"
                />
              </div>
            </div>
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
                <Button onClick={createGitHubPR} size="sm" className="bg-green-600 hover:bg-green-700 flex items-center gap-2">
                  <HugeiconsIcon icon={Github01Icon} className="h-3 w-3" />
                  Create PR
                </Button>
                <Button variant="outline" size="sm" onClick={copyToClipboard} className="flex items-center gap-2">
                  <HugeiconsIcon icon={CopyIcon} className="h-3 w-3" />
                  Copy
                </Button>
                <Button variant="outline" size="sm" onClick={downloadJson} className="flex items-center gap-2">
                  <HugeiconsIcon icon={Download01Icon} className="h-3 w-3" />
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
