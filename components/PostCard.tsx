"use client";
import { useEffect, useRef, useState } from "react";
import { Carousel } from "@/components/Carousel";
import { PostActions } from "@/components/PostActions";
import { requestQueue } from "@/lib/client/requestQueue";

type Img = { id: string; name: string; mimeType?: string; thumbnailUrl?: string };

function formatEpochTitle(epoch: string): string {
  const date = new Date(Number(epoch) * 1000);
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

// If driveId is provided, we treat it as a shared, read-only post
export function PostCard({ id, title, date, driveId }: Readonly<{ id: string; title: string; date: string; driveId?: string }>) {
  const [images, setImages] = useState<Img[] | null>(null);
  const [description, setDescription] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [preloaded, setPreloaded] = useState(false);
  const ref = useRef<HTMLElement | null>(null);
  const [visible, setVisible] = useState(false);

  const preloadImage = (url: string) =>
    new Promise<void>((resolve) => {
      const i = new Image();
      i.onload = () => resolve();
      i.onerror = () => resolve();
      i.src = url;
    });

  // Observe visibility to avoid fetching details when offscreen
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) setVisible(true);
        }
      },
      { rootMargin: "1000px 0px", threshold: 0.01 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!visible) return;
    let active = true;
    requestQueue
      .add(async () => {
        let res: Response;
        if (driveId) {
          res = await fetch(`/api/shared/post`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ driveId, folderId: id }),
          });
        } else {
          res = await fetch(`/api/posts/${id}`);
        }
        if (!res.ok) throw new Error(`Failed to load post ${id}`);
        return res.json();
      })
      .then((json) => {
        if (!active) return;
        setImages(json.images || []);
        setDescription(json.description || null);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [visible, id, driveId]);

  // Preload all images sequentially once we have details
  useEffect(() => {
    if (!images || preloaded) return;
    let canceled = false;
    (async () => {
      for (const img of images) {
        if (!img.thumbnailUrl) continue;
        await preloadImage(img.thumbnailUrl);
        if (canceled) return;
      }
      if (!canceled) setPreloaded(true);
    })();
    return () => {
      canceled = true;
    };
  }, [images, preloaded]);

  let media: React.ReactNode = null;
  if (images === null) {
    media = <div className="aspect-[4/5] animate-pulse w-full bg-black/5 dark:bg-white/10" />;
  } else if (images.length > 0) {
    media = <Carousel images={images} />;
  } else {
    media = (
      <div className="aspect-[4/5] grid place-items-center text-xs text-black/50 dark:text-white/50">No images</div>
    );
  }

  let descriptionSection: React.ReactNode = null;
  if (description) {
    descriptionSection = <p className="text-sm whitespace-pre-wrap leading-relaxed">{description}</p>;
  } else if (loading) {
    descriptionSection = <div className="h-4 w-2/3 bg-black/5 dark:bg-white/10 rounded animate-pulse" />;
  }

  return (
    <article ref={ref as React.RefObject<HTMLElement>} className="bg-white dark:bg-black rounded-2xl shadow-sm ring-1 ring-black/5 dark:ring-white/10 overflow-hidden">
      {media}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <h2 className="text-base font-semibold mb-1">{formatEpochTitle(title)}</h2>
          {!driveId ? (
            <div className="flex items-center gap-3">
              <a href={`/posts/${id}/edit`} className="text-xs hover:underline">Edit</a>
              <PostActions folderId={id} />
            </div>
          ) : (
            <div className="flex items-center gap-3">{/* Shared: read-only */}</div>
          )}
        </div>
        <p className="text-xs text-black/50 dark:text-white/50 mb-2">{new Date(date).toLocaleString()}</p>
        {descriptionSection}
      </div>
    </article>
  );
}
