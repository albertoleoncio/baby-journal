"use client";
import { useMemo, useState } from "react";
import { StoriesBar } from "@/components/StoriesBar";
import { StoryViewer } from "@/components/StoryViewer";

type StoryItem = { id: string; title: string; date: string; coverUrl?: string };

export function StoriesClient({ initial }: Readonly<{ initial: StoryItem[] }>) {
  const [openId, setOpenId] = useState<string | null>(null);
  const items = useMemo(() => initial, [initial]);
  return (
    <div className="px-2">
      <StoriesBar items={items} onOpen={(id) => setOpenId(id)} />
      {openId && (
        <StoryViewer
          id={openId}
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
