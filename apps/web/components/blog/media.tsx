/* eslint-disable @next/next/no-img-element */

export function BlogImage({
  src,
  alt,
  caption,
  width,
  priority,
}: {
  src: string;
  alt: string;
  caption?: string;
  width?: "full" | "wide" | "default";
  priority?: boolean;
}) {
  const widthClass =
    width === "full"
      ? "-mx-4 md:-mx-6 lg:-mx-12"
      : width === "wide"
        ? "-mx-4 md:-mx-6"
        : "";

  return (
    <figure className={`my-6 ${widthClass}`}>
      <img
        src={src}
        alt={alt}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        className="w-full rounded-xl object-cover"
      />
      {caption && (
        <figcaption className="mt-2 text-center text-[11px] text-foreground/25 px-4">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}

export function BlogVideo({
  src,
  poster,
  caption,
}: {
  src: string;
  poster?: string;
  caption?: string;
}) {
  return (
    <figure className="my-6">
      <video
        src={src}
        poster={poster}
        controls
        preload="metadata"
        className="w-full rounded-xl"
      />
      {caption && (
        <figcaption className="mt-2 text-center text-[11px] text-foreground/25">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}

export function ImageGrid({
  images,
  columns = 2,
  caption,
}: {
  images: { src: string; alt: string }[];
  columns?: 2 | 3 | 4;
  caption?: string;
}) {
  const colClass =
    columns === 4
      ? "grid-cols-2 md:grid-cols-4"
      : columns === 3
        ? "grid-cols-2 md:grid-cols-3"
        : "grid-cols-2";

  return (
    <figure className="my-6">
      <div className={`grid gap-2 ${colClass}`}>
        {images.map((img, i) => (
          <img
            key={i}
            src={img.src}
            alt={img.alt}
            loading="lazy"
            decoding="async"
            className="w-full rounded-lg object-cover aspect-video"
          />
        ))}
      </div>
      {caption && (
        <figcaption className="mt-2 text-center text-[11px] text-foreground/25">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}

export function Embed({
  src,
  title,
  aspectRatio = "16/9",
}: {
  src: string;
  title: string;
  aspectRatio?: string;
}) {
  return (
    <div className="my-6 overflow-hidden rounded-xl border border-[color:var(--border-soft)]">
      <iframe
        src={src}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        loading="lazy"
        className="w-full"
        style={{ aspectRatio }}
      />
    </div>
  );
}
