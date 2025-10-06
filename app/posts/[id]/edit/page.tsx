"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

export default function EditPostPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState<{ title: string; description: string | null; images: { id: string; name: string; thumbnailUrl?: string }[] } | null>(null);
  const [title, setTitle] = useState("");
  const [caption, setCaption] = useState("");
  const [newFiles, setNewFiles] = useState<File[]>([]);

  useEffect(() => {
    (async () => {
      const res = await fetch(`/api/posts/${params.id}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
        setTitle(json.title || "");
        setCaption(json.description || "");
      }
      setLoading(false);
    })();
  }, [params.id]);

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const fl = e.target.files;
    if (!fl) return;
    const arr: File[] = [];
    for (let i = 0; i < fl.length; i++) {
      const f = fl[i];
      if (!f.type.startsWith("image/")) continue;
      arr.push(f);
    }
    setNewFiles((prev) => [...prev, ...arr]);
  }

  async function removeFile(fileId: string) {
    if (!confirm("Remove this image?")) return;
    const res = await fetch("/api/posts/delete-file", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fileId }),
    });
    if (res.ok) {
      setData((prev) => prev ? { ...prev, images: prev.images.filter((i) => i.id !== fileId) } : prev);
    } else {
      alert("Failed: " + (await res.text()));
    }
  }

  async function onSave() {
    setSaving(true);
    // Rename if changed
    if (title && title !== data?.title) {
      await fetch("/api/posts/rename", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ folderId: params.id, newName: title }) });
    }
    // Update caption
    await fetch("/api/posts/update-caption", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ folderId: params.id, caption }) });
    // Upload new files
    for (const file of newFiles) {
      const form = new FormData();
      form.append("folderId", params.id);
      form.append("file", file);
      form.append("fileName", file.name);
      await fetch("/api/upload/file", { method: "POST", body: form as any });
    }
    setSaving(false);
    router.push("/feed");
  }

  if (loading) return <div className="p-4">Loading…</div>;
  if (!data) return <div className="p-4">Not found</div>;

  return (
    <div className="mx-auto max-w-md sm:max-w-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Edit Post</h1>
        <a href="/feed" className="text-sm underline">Back to feed</a>
      </div>
  <label htmlFor="title" className="block text-sm">Title</label>
  <input id="title" placeholder="Post title" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full border rounded px-3 py-2" />
  <label htmlFor="caption" className="block text-sm">Caption</label>
  <textarea id="caption" placeholder="Write a caption" value={caption} onChange={(e) => setCaption(e.target.value)} className="w-full border rounded px-3 py-2 min-h-[100px]" />

      <div className="space-y-2">
        <div className="grid grid-cols-3 gap-2">
          {data.images.map((img) => (
            <div key={img.id} className="relative">
              <img src={img.thumbnailUrl || `/api/image?id=${img.id}`} alt={img.name} className="w-full h-24 object-cover rounded" />
              <button type="button" className="absolute top-1 right-1 bg-black/60 text-white text-xs rounded px-1" onClick={() => removeFile(img.id)}>×</button>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="add-images" className="block text-sm">Add images</label>
        <input id="add-images" type="file" accept="image/*" multiple onChange={onPick} />
      </div>

      <div className="flex items-center gap-3">
        <button onClick={onSave} disabled={saving} className="rounded-full bg-black text-white dark:bg-white dark:text-black px-4 py-2 text-sm disabled:opacity-50">
          {saving ? "Saving…" : "Save"}
        </button>
        <button onClick={() => router.push("/feed")} className="rounded-full border px-4 py-2 text-sm">Cancel</button>
      </div>
    </div>
  );
}
