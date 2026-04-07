"use client";

import { useState, useEffect, useCallback } from "react";

import { useToast } from "@workspace/ui/hooks/use-toast";
import { usePromptEnhancer } from "@workspace/ui/hooks/use-prompt-enhancer";
import { useImagePromptGenerator } from "@workspace/ui/hooks/use-image-prompt-generator";
import { LLM_MODELS, type LlmModel } from "@workspace/ui/hooks/use-multi-shot-generator";

import {
  PageHeader,
  ChooseCategoriesSection,
  OptionsCarouselSection,
  CustomInputSection,
  GeneratedPromptSection,
  ClearAllDialog,
  SuccessDialog,
} from './components';

import promptData from "../../public/data/model-prompts/prompts.json";

// Transform JSON data into promptBank format
const promptBank = Object.entries(promptData.prompt_details).reduce((acc, [key, category]) => {
  acc[key] = category.values.map((item: any, index) => ({
    type: item.value,
    prompt: item.prompt || `${item.value} - professional cinematic style`,
    flux_prompt: item.prompt || `${item.value} - professional cinematic style`,
    cover_image: item.thumbnail?.url || `/prompts/placeholder-${key}-${index}.jpg`,
    category: key,
    hasVideo: item.example?.type === 'video',
    videoUrl: item.example?.type === 'video' ? item.example.url : null
  }));
  return acc;
}, {} as Record<string, Array<{type: string; prompt: string; flux_prompt: string; cover_image: string; category: string; hasVideo: boolean; videoUrl: string | null}>>);

type PromptSelections = { [key: string]: string };

export default function PromptGeneratorPage() {
  const [selections, setSelections] = useState<PromptSelections>({});
  const [finalPrompt, setFinalPrompt] = useState("");
  const [promptSegments, setPromptSegments] = useState<Array<{ category: string; text: string; color: string }>>([]);
  const [selectedTopic, setSelectedTopic] = useState<string>(Object.keys(promptBank)[0] || "lighting");
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState("");
  const [customText, setCustomText] = useState("");
  const [isPromptEnhanced, setIsPromptEnhanced] = useState(false);
  const [isGeneratingPrompt, setIsGeneratingPrompt] = useState(false);
  const [originalPrompt, setOriginalPrompt] = useState("");
  const [isClearAllDialogOpen, setIsClearAllDialogOpen] = useState(false);
  const [llmModel, setLlmModel] = useState<LlmModel>('google/gemini-3-flash-preview');

  const { toast } = useToast();

  const {
    enhancePrompt,
    isLoading: isEnhancing,
  } = usePromptEnhancer({
    model: llmModel,
    onSuccess: (enhancedPrompt) => {
      if (!isPromptEnhanced) setOriginalPrompt(finalPrompt);
      setFinalPrompt(enhancedPrompt);
      setIsPromptEnhanced(true);
      toast({ title: "Prompt Enhanced", description: "Your prompt has been improved with AI." });
    },
    onError: (error) => {
      toast({ title: "Enhancement Failed", description: error, variant: "destructive" });
    }
  });

  const {
    generateDetailedPrompt,
    isLoading: isGeneratingFromImage,
  } = useImagePromptGenerator({
    systemPrompt: `You are a concise cinematic prompt assembler. Transform user-selected fragments, custom text, and a reference image into a single polished video generation prompt.

Rules:
- Output one English paragraph, 80-150 words, comma-separated phrases.
- No line breaks, bullets, labels, markdown, or commentary.
- Derive visual cues from the image: subject, colors, lighting, environment, composition.
- Prioritize user selections and custom text over image-derived details.
- Use professional cinematography language: shot types, camera movement, lens characteristics, lighting quality.
- Include motion and temporal information.
- Output ONLY the prompt paragraph. Nothing else.`,
    onSuccess: (generatedPrompt) => {
      if (!isPromptEnhanced) setOriginalPrompt(finalPrompt);
      setFinalPrompt(generatedPrompt);
      setIsPromptEnhanced(true);
      toast({ title: "Prompt Generated", description: "A detailed prompt has been generated from your image." });
    },
    onError: (error) => {
      toast({ title: "Generation Failed", description: error, variant: "destructive" });
    }
  });

  const formatOptionName = (name: string) => {
    return name
      .replace(/[_‑-]/g, " ")
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  };

  const generatePrompt = useCallback(() => {
    const categoryColors: { [key: string]: string } = {
      lighting: "orange", camera_shot: "green", camera_movement: "red",
      mood: "purple", style: "blue", subject: "cyan", environment: "yellow",
      time_of_day: "orange", weather: "cyan", color_grade: "green",
      composition: "yellow", lens: "purple", frame_rate_motion: "red",
      sound_direction: "beta", vfx: "blue", action_blocking: "green",
      transitions_editing: "purple", style_family: "blue", motion_logic: "red",
      focus_control: "cyan", historical_period: "yellow", culture_context: "orange",
    };

    const hasValidSelections = Object.values(selections).some(value => value && value.trim() !== "");

    if (!hasValidSelections && !customText.trim()) {
      setFinalPrompt("");
      setPromptSegments([]);
      setIsPromptEnhanced(false);
      setOriginalPrompt("");
      return;
    }

    const selectedPrompts: { [key: string]: { type: string; prompt: string } } = {};
    const segments: Array<{ category: string; text: string; color: string }> = [];

    Object.entries(selections).forEach(([category, selectedType]) => {
      const categoryOptions = promptBank[category as keyof typeof promptBank];
      const selectedOption = categoryOptions?.find((option) => option.type === selectedType);
      if (selectedOption && selectedType) {
        selectedPrompts[category] = selectedOption;
        segments.push({ category, text: selectedOption.prompt, color: categoryColors[category] || "default" });
      }
    });

    if (Object.keys(selectedPrompts).length === 0 && !customText.trim()) {
      setFinalPrompt("");
      setPromptSegments([]);
      setIsPromptEnhanced(false);
      setOriginalPrompt("");
      return;
    }

    if (customText.trim()) {
      segments.unshift({ category: "custom_text", text: customText.trim(), color: "purple" });
    }

    setPromptSegments(segments);

    const allPrompts = [];
    if (customText.trim()) allPrompts.push(customText.trim());
    allPrompts.push(...Object.values(selectedPrompts).map(item => item.prompt));
    setFinalPrompt(allPrompts.join(", "));
    setIsPromptEnhanced(false);
  }, [selections, customText]);

  useEffect(() => { generatePrompt() }, [generatePrompt]);

  const handleSelection = (category: string, type: string) => {
    setSelections((prev) => ({ ...prev, [category]: prev[category] === type ? "" : type }));
  };

  const clearAllSelections = () => {
    setSelections({});
    setCustomText("");
    setIsPromptEnhanced(false);
    setOriginalPrompt("");
  };

  const handleClearAllWithConfirmation = () => {
    const hasContent = Object.values(selections).some(v => v && v.trim() !== "") || customText.trim() || finalPrompt;
    if (hasContent) setIsClearAllDialogOpen(true);
  };

  const confirmClearAll = () => {
    clearAllSelections();
    setImageUrl("");
    setImageFile(null);
    setIsClearAllDialogOpen(false);
  };

  const handleRemoveImage = () => {
    if (imageUrl.startsWith('blob:')) URL.revokeObjectURL(imageUrl);
    setImageUrl("");
    setImageFile(null);
  };

  const handleUndoEnhancement = () => {
    if (originalPrompt) {
      setFinalPrompt(originalPrompt);
      setIsPromptEnhanced(false);
      setOriginalPrompt("");
    }
  };

  const handleRemoveSegment = (category: string) => {
    setSelections((prev) => ({ ...prev, [category]: "" }));
    if (category === "custom_text") setCustomText("");
  };

  const handleGeneratePrompt = async () => {
    const hasSelections = Object.values(selections).some(v => v && v.trim() !== "");
    const hasCustomText = customText.trim() !== "";
    const hasImage = imageFile || imageUrl;

    if (!hasSelections && !hasCustomText && !hasImage) {
      toast({ title: "Nothing to enhance", description: "Select options, add text, or upload an image first.", variant: "destructive" });
      return;
    }

    setIsGeneratingPrompt(true);

    try {
      // Build prompt from current state
      let promptToEnhance = finalPrompt;
      if (!promptToEnhance.trim()) {
        if (hasCustomText) {
          promptToEnhance = customText;
        } else {
          const selectedValues = Object.entries(selections)
            .filter(([_, value]) => value)
            .map(([category, value]) => {
              const opt = promptBank[category as keyof typeof promptBank]?.find(o => o.type === value);
              return opt?.prompt || value;
            });
          promptToEnhance = selectedValues.join(", ");
        }
      }

      if (!promptToEnhance.trim()) {
        toast({ title: "Unable to enhance", description: "Try selecting different options.", variant: "destructive" });
        return;
      }

      if (hasImage) {
        // Image path: use vision model to caption + enhance
        const imageSource = imageFile || imageUrl;
        try {
          await generateDetailedPrompt(imageSource, promptToEnhance, { selections, customText });
        } catch {
          // Fallback to text enhancement
          await enhancePrompt(promptToEnhance);
        }
      } else {
        // Text-only: enhance via LLM router
        await enhancePrompt(promptToEnhance);
      }
    } catch {
      toast({ title: "Enhancement failed", description: "Please try again.", variant: "destructive" });
    } finally {
      setIsGeneratingPrompt(false);
    }
  };

  return (
    <>
      <div className="">
        <PageHeader onClearAll={handleClearAllWithConfirmation} />

        <ChooseCategoriesSection
          promptBank={promptBank}
          selectedTopic={selectedTopic}
          selections={selections}
          onTopicChange={setSelectedTopic}
          formatOptionName={formatOptionName}
        />

        <OptionsCarouselSection
          selectedTopic={selectedTopic}
          promptBank={promptBank}
          selections={selections}
          onSelectionChange={handleSelection}
          formatOptionName={formatOptionName}
        />

        <CustomInputSection
          customText={customText}
          imageFile={imageFile}
          imageUrl={imageUrl}
          onCustomTextChange={setCustomText}
          onImageFileChange={setImageFile}
          onImageUrlChange={setImageUrl}
        />

        <GeneratedPromptSection
          finalPrompt={finalPrompt}
          promptSegments={promptSegments}
          isGeneratingPrompt={isGeneratingPrompt}
          isPromptEnhanced={isPromptEnhanced}
          originalPrompt={originalPrompt}
          imageFile={imageFile}
          imageUrl={imageUrl}
          onGeneratePrompt={handleGeneratePrompt}
          onUndo={handleUndoEnhancement}
          onRemoveImage={handleRemoveImage}
          onRemoveSegment={handleRemoveSegment}
          llmModel={llmModel}
          onLlmModelChange={(m) => setLlmModel(m as LlmModel)}
        />
      </div>

      <SuccessDialog
        isOpen={showSuccessDialog}
        message={successMessage}
        onOpenChange={setShowSuccessDialog}
      />

      <ClearAllDialog
        isOpen={isClearAllDialogOpen}
        onOpenChange={setIsClearAllDialogOpen}
        onConfirm={confirmClearAll}
      />
    </>
  );
}
