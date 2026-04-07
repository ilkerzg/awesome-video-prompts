"use client"

import { useState } from "react"
import { Button } from "@workspace/ui/components/ui/button"
import { Textarea } from "@workspace/ui/components/ui/textarea"
import { Label } from "@workspace/ui/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@workspace/ui/components/ui/card"
import { usePromptEnhancer } from "@workspace/ui/hooks/use-prompt-enhancer"
import { HugeiconsIcon } from "@hugeicons/react"
import { SparklesIcon, Copy01Icon } from "@hugeicons/core-free-icons"
import { Alert, AlertDescription } from "@workspace/ui/components/ui/alert"

/**
 * Example showing different ways to integrate prompt enhancement
 */
export function PromptEnhancementIntegration() {
  const [prompt1, setPrompt1] = useState("")
  const [prompt2, setPrompt2] = useState("")
  const [enhancedPrompt, setEnhancedPrompt] = useState("")

  // Using the hook for custom integration
  const {
    enhancePrompt,
    isLoading,
    error,
    clearError
  } = usePromptEnhancer({
    onSuccess: (enhanced) => {
      setEnhancedPrompt(enhanced)
    },
    onError: (err) => {
      console.error("Enhancement failed:", err)
    }
  })

  const handleEnhance = async () => {
    if (prompt2.trim()) {
      await enhancePrompt(prompt2)
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
    } catch (err) {
      console.error("Failed to copy:", err)
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold">Prompt Enhancement Integration Examples</h1>
        <p className="text-muted-foreground">
          Different ways to integrate AI prompt enhancement into your forms
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Method 1: Using the PromptEnhancer Component */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Method 1: Component Integration</CardTitle>
            <CardDescription>
              Using the PromptEnhancer component with dialog
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Video Prompt</Label>
                {/* Import and use PromptEnhancer component */}
                <Button variant="outline" size="sm" className="gap-2">
                  <HugeiconsIcon icon={SparklesIcon} className="h-4 w-4" />
                  Enhance
                </Button>
              </div>
              <Textarea
                placeholder="Enter your prompt..."
                value={prompt1}
                onChange={(e) => setPrompt1(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
            <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded">
              <strong>Code:</strong>
              <pre className="mt-1 text-xs">
{`import { PromptEnhancer } from "@workspace/ui/components/prompt-enhancer"

<PromptEnhancer
  initialPrompt={prompt}
  onPromptEnhanced={(enhanced) => setPrompt(enhanced)}
>
  <Button variant="outline" size="sm">
    <SparklesIcon /> Enhance
  </Button>
</PromptEnhancer>`}
              </pre>
            </div>
          </CardContent>
        </Card>

        {/* Method 2: Using the Hook */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Method 2: Hook Integration</CardTitle>
            <CardDescription>
              Using the usePromptEnhancer hook for custom UI
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Video Prompt</Label>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleEnhance}
                  disabled={isLoading || !prompt2.trim()}
                  className="gap-2"
                >
                  {isLoading ? (
                    <div className="h-3 w-3 animate-spin rounded-full border border-current border-t-transparent" />
                  ) : (
                    <HugeiconsIcon icon={SparklesIcon} className="h-4 w-4" />
                  )}
                  {isLoading ? "Enhancing..." : "Enhance"}
                </Button>
              </div>
              <Textarea
                placeholder="Enter your prompt..."
                value={prompt2}
                onChange={(e) => {
                  setPrompt2(e.target.value)
                  clearError()
                }}
                className="min-h-[100px]"
              />
            </div>


            {/* Enhanced Result */}
            {enhancedPrompt && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Enhanced Version</Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(enhancedPrompt)}
                    className="h-6 px-2 gap-1"
                  >
                    <HugeiconsIcon icon={Copy01Icon} className="h-3 w-3" />
                    Copy
                  </Button>
                </div>
                <div className="bg-green-50 dark:bg-green-950/20 p-3 rounded border border-green-200 dark:border-green-800">
                  <p className="text-sm">{enhancedPrompt}</p>
                </div>
                <Button 
                  size="sm" 
                  onClick={() => setPrompt2(enhancedPrompt)}
                  className="w-full"
                >
                  Use Enhanced Prompt
                </Button>
              </div>
            )}

            {/* Error Display */}
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded">
              <strong>Code:</strong>
              <pre className="mt-1 text-xs">
{`import { usePromptEnhancer } from "@workspace/ui/hooks/use-prompt-enhancer"

const { enhancePrompt, isLoading, error } = usePromptEnhancer({
  onSuccess: (enhanced) => setPrompt(enhanced)
})

const handleEnhance = () => enhancePrompt(currentPrompt)`}
              </pre>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Integration Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Integration Instructions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h4 className="font-medium mb-2">Prerequisites</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Install @fal-ai/client dependency</li>
                <li>• Set up FAL API key using the key icon</li>
                <li>• Import the component or hook</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Features</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• AI-powered prompt enhancement</li>
                <li>• Real-time processing logs</li>
                <li>• Error handling and validation</li>
                <li>• Copy to clipboard functionality</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
