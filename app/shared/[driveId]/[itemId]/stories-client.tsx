"use client";
import { useEffect, useState } from "react";
import { StoriesBar } from "@/components/StoriesBar";
import { StoryViewer } from "@/components/StoryViewer";

export function SharedStoriesClient({ driveId, itemId, token }: Readonly<{ driveId: string; itemId: string; token: string }>) {
  const [items, setItems] = useState<{ id: string; title: string; date: string; coverUrl?: string }[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetch(`/api/shared/${encodeURIComponent(driveId)}/${encodeURIComponent(itemId)}/stories`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        if (!active) return;
        setItems(data || []);
      });
    return () => {
      active = false;
    };
  }, [driveId, itemId, token]);

  return (
    <div className="px-2">
      <StoriesBar items={items} onOpen={(id) => setOpenId(id)} />
      {openId && (
        <StoryViewer
          id={openId}
          driveId={driveId}
          onClose={() => setOpenId(null)}
          onNext={() => {
            const idx = items.findIndex((i) => i.id === openId);
            if (idx >= 0 && idx + 1 < items.length) setOpenId(items[idx + 1].id);
            else setOpenId(null);
          }}
          onPrev={() => {
            const idx = items.findIndex((i) => i.id === openId);
            if (idx > 0) setOpenId(items[idx - 1].id);
          }}
        />
      )}
    </div>
  );
}
