"use client";
import { useEffect, useRef, useState } from "react";

type VideoItem = { id: string; name: string; mimeType?: string };

export function StoryViewer({ id, driveId, onClose, onNext, onPrev }: Readonly<{ id: string; driveId?: string; onClose: () => void; onNext?: () => void; onPrev?: () => void }>) {
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    const url = driveId ? `/api/shared/${encodeURIComponent(driveId)}/${encodeURIComponent(id)}/stories/${encodeURIComponent(id)}` : `/api/stories/${id}`;
    fetch(url)
      .then((r) => r.json())
      .then((data) => {
        if (!active) return;
        setVideos(data.videos || []);
        setIndex(0);
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [id]);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    const onEnded = () => setIndex((i) => (i + 1 < videos.length ? i + 1 : i));
    el.addEventListener("ended", onEnded);
    return () => el.removeEventListener("ended", onEnded);
  }, [videos]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [videos, index]);

  function next() {
    if (index + 1 < videos.length) setIndex(index + 1);
    else onNext?.();
  }
  function prev() {
    if (index > 0) setIndex(index - 1);
    else onPrev?.();
  }

  const current = videos[index];
  let src: string | undefined = undefined;
  if (current) {
    src = `/api/image?id=${encodeURIComponent(current.id)}`;
    if (driveId) src += `&driveId=${encodeURIComponent(driveId)}`;
  }

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center">
      <button className="absolute top-4 right-4 text-white/80 hover:text-white" onClick={onClose} aria-label="Close">✕</button>
      {/* Progress bars */}
      <div className="absolute top-2 left-2 right-2 flex gap-1">
        {videos.map((v, i) => {
          let widthClass = "w-0";
          if (i < index) widthClass = "w-full";
          else if (i === index) widthClass = "w-1/2";
          return (
            <div key={v.id} className="h-1 flex-1 bg-white/20 overflow-hidden rounded">
              <div className={`h-full bg-white transition-[width] duration-300 ${widthClass}`}></div>
            </div>
          );
        })}
      </div>
      <div className="w-full max-w-[420px] aspect-[9/16] bg-black">
        {loading && <div className="w-full h-full animate-pulse bg-white/10" />}
        {!loading && current && (
          <video
            ref={videoRef}
            key={current.id}
            src={src}
            className="w-full h-full object-contain"
            autoPlay
            controls={false}
            playsInline
            muted={false}
            onClick={next}
          >
            <track kind="captions" srcLang="en" label="captions" default={false} />
          </video>
        )}
        {!loading && !current && (
          <div className="w-full h-full grid place-items-center text-white/70">No videos</div>
        )}
      </div>
      {/* Nav zones */}
      <button className="absolute inset-y-0 left-0 w-1/3" onClick={prev} aria-label="Previous" />
      <button className="absolute inset-y-0 right-0 w-1/3" onClick={next} aria-label="Next" />
    </div>
  );
}
