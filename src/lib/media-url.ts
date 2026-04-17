/**
 * Fal refinery URL transformer — proxies fal.media assets through
 * an image-optimizing CDN that returns optimized WebP frames for videos.
 *
 * Example:
 *   getThumbnailUrl("https://v3b.fal.media/.../video.mp4", 640)
 *   → "https://refinery.fal.media/url/<encoded>/tr:w-640,q-80/video.webp"
 */

export function getThumbnailUrl(url: string, width = 640, quality = 80): string {
  if (!url) return "";
  if (!url.startsWith("http")) return url;

  // Only proxy fal.media assets — external URLs passed through
  if (!url.includes("fal.media")) return url;

  const encoded = encodeURIComponent(url);
  const parts = url.split("/");
  const lastPart = parts[parts.length - 1] || "asset";
  const filename = lastPart.replace(/\.(mp4|mov|webm|png|jpg|jpeg)$/i, ".webp");
  return `https://refinery.fal.media/url/${encoded}/tr:w-${width},q-${quality}/${filename}`;
}
