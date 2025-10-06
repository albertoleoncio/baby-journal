"use client";
import { useState } from "react";
export function PostActions({ folderId, onDeleted }: { folderId: string; onDeleted?: () => void }) {
  const [loading, setLoading] = useState(false);
  async function handleDelete() {
    if (!confirm("Delete this post?")) return;
    setLoading(true);
    const res = await fetch("/api/posts/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ folderId }),
    });
    setLoading(false);
    if (res.ok) {
      if (onDeleted) onDeleted();
      window.location.reload();
    } else {
      alert("Delete failed: " + (await res.text()));
    }
  }
  return (
    <button type="button" onClick={handleDelete} disabled={loading} className="text-xs text-red-600 hover:underline">
      {loading ? "Deleting…" : "Delete"}
    </button>
  );
}