"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type LocalFile = {
  file: File;
  preview: string;
};

export default function UploadPage() {
  const [files, setFiles] = useState<LocalFile[]>([]);
  const [caption, setCaption] = useState("");
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const router = useRouter();

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const fl = e.target.files;
    if (!fl) return;
    const arr: LocalFile[] = [];
    for (let i = 0; i < fl.length; i++) {
      const f = fl[i];
      if (!f.type.startsWith("image/")) continue;
      arr.push({ file: f, preview: URL.createObjectURL(f) });
    }
    setFiles((prev) => [...prev, ...arr]);
  }

  function onRemove(preview: string) {
    setFiles((prev) => prev.filter((x) => x.preview !== preview));
  }

  function onClear() {
    setFiles([]);
  }

  const canPost = useMemo(() => files.length > 0 || caption.trim().length > 0, [files, caption]);

  async function onSubmit() {
    if (!canPost) return;
    try {
      setLoading(true);
      setProgress(0);
      // 1) Create folder and upload caption
      const startRes = await fetch("/api/upload/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, caption }),
      });
      if (!startRes.ok) {
        alert("Failed to create post: " + (await startRes.text()));
        setLoading(false);
        return;
      }
      const { folderId } = await startRes.json();

      // 2) Upload files sequentially
      for (let i = 0; i < files.length; i++) {
        const form = new FormData();
        form.append("folderId", folderId);
        form.append("file", files[i].file);
        form.append("fileName", files[i].file.name);
        const res = await fetch("/api/upload/file", { method: "POST", body: form });
        if (!res.ok) {
          alert("Failed to upload image: " + (await res.text()));
          setLoading(false);
          return;
        }
        setProgress(Math.round(((i + 1) / files.length) * 100));
      }

      // Done
      setLoading(false);
      setProgress(100);
      router.push("/feed");
    } catch (e: any) {
      console.error(e);
      alert("Upload failed: " + (e?.message || String(e)));
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md sm:max-w-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">New Post</h1>
        <a href="/feed" className="text-sm underline">Back to feed</a>
      </div>
      <input
        type="text"
        placeholder="Optional title (used as folder name)"
        className="w-full border rounded px-3 py-2"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <textarea
        placeholder="Write a caption..."
        className="w-full border rounded px-3 py-2 min-h-[100px]"
        value={caption}
        onChange={(e) => setCaption(e.target.value)}
      />
      <div className="space-y-2">
        <label htmlFor="images" className="block text-sm text-black/70 dark:text-white/70">Images</label>
        <input
          id="images"
          aria-label="Images"
          type="file"
          accept="image/*"
          multiple
          onChange={onPick}
          className="block"
        />
        <div
          onDragOver={(e) => { e.preventDefault(); }}
          onDrop={(e) => {
            e.preventDefault();
            const fl = e.dataTransfer.files;
            const arr: LocalFile[] = [];
            for (let i = 0; i < fl.length; i++) {
              const f = fl[i];
              if (!f.type.startsWith("image/")) continue;
              arr.push({ file: f, preview: URL.createObjectURL(f) });
            }
            setFiles((prev) => [...prev, ...arr]);
          }}
          className="border-2 border-dashed rounded-lg p-6 text-center text-sm text-black/60 dark:text-white/60"
        >
          Drag & drop images here
        </div>
        {files.length > 0 && (
          <>
            <div className="flex justify-end">
              <button type="button" onClick={onClear} className="text-xs underline">Clear all</button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {files.map((f) => (
                <div key={`${f.preview}-${f.file.size}`} className="relative">
                  <img src={f.preview} alt="preview" className="w-full h-24 object-cover rounded" />
                  <button type="button" className="absolute top-1 right-1 bg-black/60 text-white text-xs rounded px-1" onClick={() => onRemove(f.preview)}>×</button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={onSubmit}
          disabled={!canPost || loading}
          className="rounded-full bg-black text-white dark:bg-white dark:text-black px-4 py-2 text-sm disabled:opacity-50"
        >
          {loading ? "Posting…" : "Post"}
        </button>
        {loading && (
          <div className="text-sm text-black/60 dark:text-white/60">{progress}%</div>
        )}
      </div>
    </div>
  );
}
