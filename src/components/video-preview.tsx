"use client";

import { Play } from "lucide-react";
import { useRef, useState } from "react";
import { getThumbnailUrl } from "@/lib/media-url";

const CATEGORY_GRADIENTS: Record<string, string> = {
  cinematic: "linear-gradient(135deg, #1a1a2e, #16213e, #0f3460)",
  nature: "linear-gradient(135deg, #0f3443, #1a5c45, #34e89e20)",
  abstract: "linear-gradient(135deg, #667eea, #764ba2)",
  character: "linear-gradient(135deg, #2d1b69, #11998e)",
  product: "linear-gradient(135deg, #2c3e50, #3498db)",
  commercial: "linear-gradient(135deg, #2c3e50, #3498db)",
  architecture: "linear-gradient(135deg, #232526, #414345)",
  "sci-fi": "linear-gradient(135deg, #0c0c1d, #1a237e, #4a148c)",
  fantasy: "linear-gradient(135deg, #4a1942, #6a1b4d, #c94b4b)",
  documentary: "linear-gradient(135deg, #1c1c1c, #383838, #555)",
  "music-video": "linear-gradient(135deg, #f12711, #f5af19, #f12711)",
  creative: "linear-gradient(135deg, #f12711, #f5af19, #f12711)",
  transformation: "linear-gradient(135deg, #667eea, #764ba2)",
  artistic: "linear-gradient(135deg, #4a1942, #6a1b4d, #c94b4b)",
  action: "linear-gradient(135deg, #0c0c1d, #1a237e, #4a148c)",
};

export function VideoPreview({
  category = "cinematic",
  videoUrl,
  size = "md",
  thumbnailWidth = 640,
}: {
  category?: string;
  videoUrl?: string;
  duration?: string;
  aspectRatio?: string;
  size?: "sm" | "md" | "lg";
  thumbnailWidth?: number;
}) {
  const gradient = CATEGORY_GRADIENTS[category] ?? CATEGORY_GRADIENTS.cinematic;
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hovering, setHovering] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);

  const thumbnailUrl = videoUrl ? getThumbnailUrl(videoUrl, thumbnailWidth, 75) : "";

  const handleEnter = () => {
    setHovering(true);
    // Lazy load: only load the video when user hovers
    if (videoRef.current && videoRef.current.preload === "none") {
      videoRef.current.preload = "metadata";
      videoRef.current.load();
    }
    videoRef.current?.play().catch(() => {});
  };

  const handleLeave = () => {
    setHovering(false);
    if (videoRef.current) {
      videoRef.current.pause();
    }
  };

  const playSize = size === "sm" ? "size-8" : size === "lg" ? "size-14" : "size-10";
  const iconSize = size === "sm" ? 14 : size === "lg" ? 24 : 18;

  return (
    <div
      className="relative overflow-hidden rounded-[var(--radius-surface)] aspect-video"
      style={!videoUrl ? { background: gradient } : undefined}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
    >
      {videoUrl ? (
        <>
          {/* Poster image shown until video loads */}
          {thumbnailUrl && !videoLoaded && (
            <img
              src={thumbnailUrl}
              alt=""
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover"
            />
          )}
          <video
            ref={videoRef}
            src={videoUrl}
            poster={thumbnailUrl}
            muted
            loop
            playsInline
            preload="none"
            onLoadedData={() => setVideoLoaded(true)}
            className="absolute inset-0 h-full w-full object-cover"
          />
          {!hovering && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/20">
              <div className={`${playSize} flex items-center justify-center rounded-full bg-white/20 backdrop-blur-sm`}>
                <Play size={iconSize} className="ml-0.5 text-white" fill="white" />
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className={`${playSize} flex items-center justify-center rounded-full bg-white/20 backdrop-blur-sm`}>
            <Play size={iconSize} className="ml-0.5 text-white" fill="white" />
          </div>
        </div>
      )}
    </div>
  );
}
