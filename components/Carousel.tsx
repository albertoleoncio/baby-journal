"use client";

import { useState } from "react";

type Img = { id: string; name: string; mimeType?: string; thumbnailUrl?: string };

export function Carousel({ images }: Readonly<{ images: Img[] }>) {
  const [index, setIndex] = useState(0);
  const count = images.length;
  if (count === 0) return null;

  function prev() {
    setIndex((i) => (i - 1 + count) % count);
  }
  function next() {
    setIndex((i) => (i + 1) % count);
  }

  // Basic swipe detection
  let startX = 0;
  function onTouchStart(e: React.TouchEvent) {
    startX = e.touches[0].clientX;
  }
  function onTouchEnd(e: React.TouchEvent) {
    const dx = e.changedTouches[0].clientX - startX;
    if (dx > 30) prev();
    else if (dx < -30) next();
  }

  const item = images[index];
  const isVideo = (item.mimeType || "").startsWith("video/") || item.name.toLowerCase().endsWith(".mp4");
  const driveId = (item as any).driveId as string | undefined;

  const mediaUrl = (() => {
    const base = `/api/image?id=${encodeURIComponent(item.id)}`;
    return driveId ? `${base}&driveId=${encodeURIComponent(driveId)}` : base;
  })();

  return (
    <div className="relative aspect-[4/5] bg-black/5 dark:bg-white/5">
      {isVideo ? (
        <video
          src={mediaUrl}
          poster={item.thumbnailUrl}
          className="w-full h-full object-cover"
          controls
          preload="metadata"
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          <track kind="captions" label="captions" />
        </video>
      ) : (
        <img
          src={item.thumbnailUrl || mediaUrl}
          alt={item.name}
          className="w-full h-full object-cover"
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
          loading="lazy"
        />
      )}
      {count > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full w-8 h-8 grid place-items-center"
            aria-label="Previous"
          >
            ‹
          </button>
          <button
            onClick={next}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full w-8 h-8 grid place-items-center"
            aria-label="Next"
          >
            ›
          </button>
          <div className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-0.5 rounded-full">
            {index + 1}/{count}
          </div>
        </>
      )}
    </div>
  );
}
