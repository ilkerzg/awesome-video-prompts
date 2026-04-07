"use client";

import { useState } from "react";
import Image from "next/image";
import { HugeiconsIcon } from "@hugeicons/react";
import { CheckmarkCircle01Icon } from "@hugeicons/core-free-icons";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@workspace/ui/components/ui/carousel";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@workspace/ui/components/ui/tooltip";
import { StatusBadge } from "@workspace/ui/components/ui/status-badge";

interface OptionsCarouselSectionProps {
  selectedTopic: string;
  promptBank: Record<string, any[]>;
  selections: Record<string, string>;
  onSelectionChange: (category: string, value: string) => void;
  formatOptionName: (name: string) => string;
}

export function OptionsCarouselSection({
  selectedTopic,
  promptBank,
  selections,
  onSelectionChange,
  formatOptionName,
}: OptionsCarouselSectionProps) {
  const [hoveredVideo, setHoveredVideo] = useState<string | null>(null);

  const handleOptionSelect = (option: any) => {
    if (selections[selectedTopic] === option.type) {
      // Deselect if already selected
      onSelectionChange(selectedTopic, "");
    } else {
      // Select new option
      onSelectionChange(selectedTopic, option.type);
    }
  };

  return (
    <main className="flex-1">
      <div className="px-6 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 lg:mb-10">
            <div>
              <h3 className="text-xl sm:text-2xl font-semibold text-foreground mb-2">
                {formatOptionName(selectedTopic)} Options
              </h3>
              <p className="text-sm sm:text-base text-muted-foreground">
                Choose from our curated collection of{" "}
                {selectedTopic.replace("_", " ")} styles
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="px-3 py-1.5 bg-muted/50 border border-border rounded-md">
                <span className="text-sm font-medium text-foreground">
                  {promptBank[selectedTopic as keyof typeof promptBank]
                    ?.length || 0}{" "}
                  options
                </span>
              </div>
            </div>
          </div>

          <div className="w-full overflow-hidden">
            <Carousel 
              className="w-full"
              opts={{
                align: "start",
                dragFree: true,
                containScroll: "trimSnaps"
              }}
            >
              <div className="flex items-center gap-0 w-full">
                <CarouselPrevious className="relative left-0 h-8 w-8 rounded-md border border-border flex-shrink-0" />
                <CarouselContent className="ml-0 py-3 flex-1">
                  {promptBank[selectedTopic as keyof typeof promptBank]?.map(
                    (option) => (
                      <CarouselItem
                        key={option.type}
                        className="pl-2 pr-2 basis-auto group"
                      >
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                onClick={() => handleOptionSelect(option)}
                                className="text-left transition-all duration-200 focus:outline-none focus:ring-0 rounded-lg"
                              >
                                <div
                                  className={`relative w-48 h-36 rounded-lg overflow-hidden border-2 transition-all duration-300 ${
                                    selections[selectedTopic] === option.type
                                      ? "border-orange shadow-lg shadow-orange/20 ring-1 ring-orange/20"
                                      : "border-border hover:border-border/80 hover:shadow-md"
                                  }`}
                                  onMouseEnter={() => {
                                    if (option.hasVideo) {
                                      setHoveredVideo(option.type);
                                    }
                                  }}
                                  onMouseLeave={() => {
                                    if (option.hasVideo) {
                                      setHoveredVideo(null);
                                    }
                                  }}
                                >
                                  {/* Always show thumbnail image as fallback */}
                                  <Image
                                    src={option.cover_image}
                                    alt={option.type}
                                    fill
                                    sizes="192px"
                                    className="object-cover transition-opacity duration-300"
                                  />

                                  {/* Video that loads and plays only on hover */}
                                  {option.hasVideo && option.videoUrl && hoveredVideo === option.type && (
                                    <video
                                      src={option.videoUrl}
                                      autoPlay
                                      muted
                                      loop
                                      playsInline
                                      className="absolute inset-0 w-full h-full object-cover z-10"
                                    />
                                  )}

                                
                                 

                                  {/* Gradient overlay with text */}
                                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
                                  
                                  {/* Option text inside the card */}
                                  <div className="absolute bottom-3 left-3 right-3 text-center">
                                    <p className="text-sm font-medium text-white truncate drop-shadow-lg">
                                      {formatOptionName(option.type)}
                                    </p>
                                  </div>
                                </div>
                              </button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="max-w-xs">
                                {option.prompt}
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </CarouselItem>
                    )
                  )}
                </CarouselContent>
                <CarouselNext className="relative right-0 h-8 w-8 rounded-md border border-border flex-shrink-0" />
              </div>
            </Carousel>
          </div>
        </div>
      </div>
    </main>
  );
}
