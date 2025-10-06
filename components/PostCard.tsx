"use client";
import { useEffect, useState } from "react";
import { Carousel } from "@/components/Carousel";
import { PostActions } from "@/components/PostActions";

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

export function PostCard({ id, title, date }: { id: string; title: string; date: string }) {
  const [images, setImages] = useState<Img[] | null>(null);
  const [description, setDescription] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch(`/api/posts/${id}`);
        if (!active) return;
        if (res.ok) {
          const json = await res.json();
          setImages(json.images || []);
          setDescription(json.description || null);
        }
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [id]);

  return (
    <article className="bg-white dark:bg-black rounded-2xl shadow-sm ring-1 ring-black/5 dark:ring-white/10 overflow-hidden">
      {images === null ? (
        <div className="aspect-[4/5] animate-pulse w-full bg-black/5 dark:bg-white/10" />
      ) : images.length > 0 ? (
        <Carousel images={images} />
      ) : (
        <div className="aspect-[4/5] grid place-items-center text-xs text-black/50 dark:text-white/50">No images</div>
      )}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <h2 className="text-base font-semibold mb-1">{formatEpochTitle(title)}</h2>
          <div className="flex items-center gap-3">
            <a href={`/posts/${id}/edit`} className="text-xs hover:underline">Edit</a>
            <PostActions folderId={id} />
          </div>
        </div>
        <p className="text-xs text-black/50 dark:text-white/50 mb-2">{new Date(date).toLocaleString()}</p>
        {description ? (
          <p className="text-sm whitespace-pre-wrap leading-relaxed">{description}</p>
        ) : loading ? (
          <div className="h-4 w-2/3 bg-black/5 dark:bg-white/10 rounded animate-pulse" />
        ) : null}
      </div>
    </article>
  );
}
