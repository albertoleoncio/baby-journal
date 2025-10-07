"use client";
import { useEffect, useState } from "react";

type SharedItem = {
  name?: string;
  remoteItem?: {
    id: string;
    parentReference?: { driveId?: string };
    shared?: { owner?: { user?: { displayName?: string } } };
  };
};

export function SharedFeedButton() {
  const [link, setLink] = useState<string | null>(null);
  const [label, setLabel] = useState<string>("");

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch("/api/shared");
        if (!res.ok) return;
        const data = await res.json();
        const items: SharedItem[] = data?.value || [];
        const bj = items.find((i) => i.name === "BabyJournal" && i.remoteItem?.id && i.remoteItem?.parentReference?.driveId);
        if (bj && active) {
          const driveId = bj.remoteItem!.parentReference!.driveId!;
          const itemId = bj.remoteItem!.id;
          const owner = bj.remoteItem?.shared?.owner?.user?.displayName || "someone";
          setLink(`/shared/${encodeURIComponent(driveId)}/${encodeURIComponent(itemId)}`);
          setLabel(`Go to ${owner}'s feed`);
        }
      } catch {}
    })();
    return () => { active = false; };
  }, []);

  if (!link) return null;
  return (
    <a href={link} className="rounded-full border px-4 py-2 text-sm">
      {label || "Go to shared feed"}
    </a>
  );
}
