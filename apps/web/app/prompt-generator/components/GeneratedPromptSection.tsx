"use client";

import { useRef } from "react";
import Image from "next/image";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  CopyIcon,
  RocketIcon,
  Loading03Icon,
  AiBeautifyFreeIcons,
  UndoIcon,
  Delete01Icon,
  Cancel01Icon,
} from "@hugeicons/core-free-icons";
import { useToast } from "@workspace/ui/hooks/use-toast";
import { Card, CardContent } from "@workspace/ui/components/ui/card";
import { Button } from "@workspace/ui/components/ui/button";
import { Textarea } from "@workspace/ui/components/ui/textarea";
import { StatusBadge } from "@workspace/ui/components/ui/status-badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@workspace/ui/components/ui/tooltip";

interface GeneratedPromptSectionProps {
  finalPrompt: string;
  promptSegments: Array<{ category: string; text: string; color: string }>;
  isGeneratingPrompt: boolean;
  isPromptEnhanced: boolean;
  originalPrompt: string;
  imageFile: File | null;
  imageUrl: string;
  onGeneratePrompt: () => void;
  onUndo: () => void;
  onRemoveImage: () => void;
  onRemoveSegment: (category: string) => void;
  llmModel?: string;
  onLlmModelChange?: (model: string) => void;
}

export function GeneratedPromptSection({
  finalPrompt,
  promptSegments,
  isGeneratingPrompt,
  isPromptEnhanced,
  originalPrompt,
  imageFile,
  imageUrl,
  onGeneratePrompt,
  onUndo,
  onRemoveImage,
  onRemoveSegment,
  llmModel,
  onLlmModelChange,
}: GeneratedPromptSectionProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(finalPrompt);
      toast({
        title: "Copied!",
        description: "Prompt copied to clipboard",
      });
    } catch (err) {
      // Fallback for older browsers
      if (textareaRef.current) {
        textareaRef.current.select();
        document.execCommand("copy");
        toast({
          title: "Copied!",
          description: "Prompt copied to clipboard",
        });
      }
    }
  };

  const getDisplayImage = () => {
    if (imageFile) {
      return URL.createObjectURL(imageFile);
    }
    return imageUrl;
  };

  return (
    <section className="border-t border-border" data-section="generated-prompt">
      <div className="px-3 sm:px-6 py-4 sm:py-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col gap-3 sm:gap-4 mb-4 sm:mb-6">
            <div className="text-center sm:text-left">
              <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold text-foreground mb-1 sm:mb-2">
                Generated Prompt
              </h2>
              <p className="text-xs sm:text-sm lg:text-base text-muted-foreground">
                Your cinematic prompt is ready to use
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2">
              {/* LLM Model Selector */}
              {onLlmModelChange && (
                <select
                  value={llmModel || ''}
                  onChange={(e) => onLlmModelChange(e.target.value)}
                  className="text-xs bg-background border border-border rounded-md px-2 py-1.5 text-muted-foreground"
                >
                  {[
                    { id: 'anthropic/claude-sonnet-4.6', label: 'Sonnet 4.6' },
                    { id: 'google/gemini-3-flash-preview', label: 'Gemini 3 Flash' },
                    { id: 'google/gemini-3.1-pro-preview', label: 'Gemini 3.1 Pro' },
                    { id: 'openai/gpt-5.4-mini', label: 'GPT-5.4 Mini' },
                  ].map(m => (
                    <option key={m.id} value={m.id}>{m.label}</option>
                  ))}
                </select>
              )}
              {/* Enhance Button */}
              <Button
                onClick={onGeneratePrompt}
                disabled={isGeneratingPrompt}
                className="w-full sm:w-auto text-sm sm:text-base"
              >
                {isGeneratingPrompt ? (
                  <>
                    <HugeiconsIcon icon={Loading03Icon} className="size-4 mr-2 animate-spin" />
                    <span>Enhancing...</span>
                  </>
                ) : (
                  <>
                    <HugeiconsIcon icon={AiBeautifyFreeIcons} className="size-4 mr-2" />
                    <span>Enhance</span>
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Cool border effect */}
          <div className="relative">
            <Card className="!p-3 sm:!p-4 border border-border bg-card shadow-sm">
              <CardContent className="!p-0">
                {promptSegments.length > 0 || finalPrompt ? (
                  <div className="space-y-6">
                    {/* Display enhanced prompt as unified text or segmented badges */}
                    {finalPrompt ? (
                      <div className="space-y-3 sm:space-y-4">
                        <div className="flex flex-col lg:flex-row items-start gap-3 lg:gap-4">
                          {/* Reference Image Display - Top on mobile, left on large screens */}
                          {(imageFile || imageUrl) && (
                            <div className="w-full lg:flex-shrink-0 lg:w-48">
                              <div className="relative">
                                <div className="aspect-video w-full max-w-sm mx-auto lg:max-w-none lg:mx-0 rounded-lg overflow-hidden border border-border">
                                  <Image
                                    src={getDisplayImage()}
                                    alt="Reference"
                                    fill
                                    sizes="(max-width: 1024px) 100vw, 192px"
                                    className="object-cover"
                                  />
                                  {/* Trash icon overlay */}
                                  <button
                                    onClick={onRemoveImage}
                                    className="absolute top-1 right-1 sm:top-2 sm:right-2 bg-red-500/80 hover:bg-red-500 text-white p-1 sm:p-1.5 rounded-full transition-colors"
                                  >
                                    <HugeiconsIcon icon={Delete01Icon} className="size-2.5 sm:size-3" />
                                  </button>
                                </div>
                            
                              </div>
                            </div>
                          )}

                          {/* Prompts Section - Bottom on mobile, right on large screens */}
                          <div className="flex-1 min-w-0 space-y-3 sm:space-y-4">
                            <div>
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                                <h4 className="text-sm font-semibold text-foreground">
                                  {isPromptEnhanced ? "Enhanced Prompt" : "Generated Prompt"}
                                </h4>
                                <div className="flex items-center gap-1 sm:gap-2">
                                  {isPromptEnhanced && originalPrompt && (
                                    <Button
                                      onClick={onUndo}
                                      variant="outline"
                                      size="sm"
                                      className="text-xs flex-1 sm:flex-none"
                                    >
                                      <HugeiconsIcon icon={UndoIcon} className="size-3 mr-1" />
                                      <span className="hidden xs:inline">Undo</span>
                                    </Button>
                                  )}
                                  <Button
                                    onClick={copyToClipboard}
                                    variant="outline"
                                    size="sm"
                                    className="text-xs flex-1 sm:flex-none"
                                  >
                                    <HugeiconsIcon icon={CopyIcon} className="size-3 mr-1" />
                                    <span className="hidden xs:inline">Copy</span>
                                  </Button>
                                </div>
                              </div>
                              <div className="bg-muted/30 p-3 sm:p-4 rounded-lg border border-border">
                                <p className="text-xs sm:text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                                  {finalPrompt}
                                </p>
                              </div>
                            </div>

                            {promptSegments.length > 0 && (
                              <div>
                                <h4 className="text-sm font-semibold text-foreground mb-2 sm:mb-3">
                                  Prompt Segments
                                </h4>
                                <div className="flex flex-wrap gap-1 sm:gap-2">
                                  {promptSegments.map((segment, index) => {
                                    // Color mapping using StatusBadge variants
                                    const colorVariants = {
                                      lighting: "orange",
                                      camera_shot: "green",
                                      camera_movement: "red",
                                      mood: "purple",
                                      style: "blue",
                                      subject: "cyan",
                                      environment: "yellow",
                                      time_of_day: "orange",
                                      weather: "cyan",
                                      color_grade: "green",
                                      composition: "yellow",
                                      lens: "purple",
                                      frame_rate_motion: "red",
                                      sound_direction: "beta",
                                      vfx: "blue",
                                      action_blocking: "green",
                                      transitions_editing: "purple",
                                      style_family: "blue",
                                      motion_logic: "red",
                                      focus_control: "cyan",
                                      historical_period: "yellow",
                                      culture_context: "orange",
                                      custom_text: "beta",
                                    };
                                    
                                    const variant = colorVariants[segment.category as keyof typeof colorVariants] || "default";
                                    
                                    return (
                                      <TooltipProvider key={index}>
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <StatusBadge
                                              variant={variant as any}
                                              className="inline-flex items-center gap-1 sm:gap-1.5 hover:opacity-80 transition-opacity cursor-default text-xs sm:text-sm"
                                            >
                                              <span className="font-semibold">{segment.category.replace('_', ' ')}:</span>
                                              <span className="truncate max-w-20 sm:max-w-32">{segment.text}</span>
                                              <button
                                                onClick={() => onRemoveSegment(segment.category)}
                                                className="ml-0.5 sm:ml-1 opacity-70 hover:opacity-100 transition-opacity hover:scale-110"
                                                title={`Remove ${segment.category}`}
                                              >
                                                <HugeiconsIcon icon={Cancel01Icon} className="size-2.5 sm:size-3" />
                                              </button>
                                            </StatusBadge>
                                          </TooltipTrigger>
                                          <TooltipContent className="max-w-xs">
                                            <div className="space-y-1">
                                              <p className="font-semibold text-xs">{segment.category.replace('_', ' ')}</p>
                                              <p className="text-xs">{segment.text}</p>
                                            </div>
                                          </TooltipContent>
                                        </Tooltip>
                                      </TooltipProvider>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8 sm:py-12">
                        <HugeiconsIcon icon={RocketIcon} className="size-8 sm:size-12 text-muted-foreground mb-3 sm:mb-4 mx-auto" />
                        <p className="text-sm sm:text-base text-muted-foreground px-4">
                          Your generated prompt will appear here...
                        </p>
                      </div>
                    )}

                    {/* Stats */}
                    {finalPrompt && (
                      <div className="flex items-center justify-center sm:justify-between pt-3 sm:pt-4 border-t border-border">
                        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 sm:gap-6 text-xs text-muted-foreground">
                          <span>Length: {finalPrompt.length} chars</span>
                          <span>{finalPrompt.split(" ").length} words</span>
                          <span>{promptSegments.length} categories</span>
                        </div>
                      </div>
                    )}

                    {/* Hidden textarea for copy functionality */}
                    <Textarea
                      ref={textareaRef}
                      value={finalPrompt}
                      readOnly
                      className="sr-only"
                    />
                  </div>
                ) : (
                  <div className="text-center py-8 sm:py-12">
                    <HugeiconsIcon icon={RocketIcon} className="size-8 sm:size-12 text-muted-foreground mb-3 sm:mb-4 mx-auto" />
                    <p className="text-sm sm:text-base text-muted-foreground px-4">
                      Your generated prompt will appear here...
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}
