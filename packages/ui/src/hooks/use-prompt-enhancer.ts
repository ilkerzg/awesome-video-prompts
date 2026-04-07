import { useState, useCallback } from "react"
import { callLlmRouter } from "@workspace/ui/lib/openrouter-utils"

interface UsePromptEnhancerOptions {
  model?: string
  onSuccess?: (enhancedPrompt: string) => void
  onError?: (error: string) => void
}

const SYSTEM_PROMPT = `You are an expert video-prompt composer specializing in AI video generation models (Seedance, Kling, Veo, Wan, Pixverse, etc.).

Your job: take the user's rough notes, selected category fragments, and optional image description, then produce ONE polished, production-ready video generation prompt.

## Rules

1. Output exactly one English paragraph, 80-150 words, comma-separated phrases. No line breaks, bullets, lists, labels, markdown, or commentary.
2. Prioritize the user's explicit notes first, then selected category fragments, then image context.
3. Every phrase must describe something visually concrete: subject, action, environment, lighting, camera work, motion, atmosphere, color, texture, or sound design.
4. Use professional cinematography language: shot types (wide, medium, close-up, extreme close-up), camera movement (dolly, pan, crane, tracking, handheld, static), lens characteristics (shallow DOF, anamorphic, telephoto compression), lighting quality (rim, key, fill, backlight, ambient, practical).
5. Include motion and temporal information: what happens, how it changes, what moves.
6. End with a forward beat or transition hint when possible.
7. Prefer strong specific nouns and active verbs over vague adjectives.
8. Do not name AI models, categories, or quote fragment phrases verbatim — translate them into vivid visual cues.
9. Match the implied medium: live-action realism, stylized animation, documentary, experimental, etc.
10. Output ONLY the prompt paragraph. Nothing else.`

export function usePromptEnhancer(options: UsePromptEnhancerOptions = {}) {
  const { model = "google/gemini-3-flash-preview", onSuccess, onError } = options

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const enhancePrompt = useCallback(async (
    originalPrompt: string,
    imageDescription?: string,
  ): Promise<string | null> => {
    if (!originalPrompt.trim()) {
      const errorMsg = "Please provide a prompt to enhance."
      setError(errorMsg)
      onError?.(errorMsg)
      return null
    }

    setIsLoading(true)
    setError(null)

    try {
      let userMessage = `User notes and fragments:\n${originalPrompt}`

      if (imageDescription) {
        userMessage += `\n\nReference image description:\n${imageDescription}`
      }

      const result = await callLlmRouter({
        model,
        systemPrompt: SYSTEM_PROMPT,
        userPrompt: userMessage,
        temperature: 0.85,
      })

      const enhanced = result.trim()
      onSuccess?.(enhanced)
      return enhanced
    } catch (err) {
      console.error("Error enhancing prompt:", err)
      const errorMsg = err instanceof Error ? err.message : "Failed to enhance prompt."
      setError(errorMsg)
      onError?.(errorMsg)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [model, onSuccess, onError])

  const clearError = useCallback(() => { setError(null) }, [])

  return { enhancePrompt, isLoading, error, clearError }
}
