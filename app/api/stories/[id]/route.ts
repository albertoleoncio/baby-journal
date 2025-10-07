import { auth } from "@/auth";
import { listChildren } from "@/lib/graph";

const ROOT_PATH = "/Apps/BabyJournal/stories";

function isTextFile(name: string) {
  const l = name.toLowerCase();
  return l === "description.txt" || l === "description.md" || l.endsWith(".md") || l.endsWith(".txt");
}
function isVideo(mime?: string) {
  return (mime || "").startsWith("video/");
}
async function fetchText(accessToken: string, itemId: string) {
  try {
    const res = await fetch(`https://graph.microsoft.com/v1.0/me/drive/items/${itemId}/content`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (res.ok) return await res.text();
  } catch {}
  return null;
}
async function fetchThumb(accessToken: string, itemId: string) {
  try {
    const res = await fetch(`https://graph.microsoft.com/v1.0/me/drive/items/${itemId}/thumbnails`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (res.ok) {
      const data = await res.json();
      const t = data.value?.[0];
      return t?.large?.url || t?.extraLarge?.url || t?.medium?.url || t?.small?.url;
    }
  } catch {}
  return undefined;
}

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session || !(session as any).accessToken) {
    return new Response("Unauthorized", { status: 401 });
  }
  const accessToken = (session as any).accessToken as string;
  const id = params.id;
  if (!id) return new Response("Missing id", { status: 400 });

  try {
    const top = await listChildren(accessToken, ROOT_PATH);
    const folder = (top || []).find((f) => f.id === id || f.name === id);
    if (!folder) return new Response("Not found", { status: 404 });

    const items = await listChildren(accessToken, `${ROOT_PATH}/${folder.name}`);
    let description: string | null = null;
    const videos: { id: string; name: string; mimeType?: string; thumbnailUrl?: string }[] = [];

    for (const it of items || []) {
      if (!it.file) continue;
      if (isTextFile(it.name)) {
        description = (await fetchText(accessToken, it.id)) ?? description;
        continue;
      }
      if (isVideo(it.file?.mimeType)) {
        const thumbnailUrl = await fetchThumb(accessToken, it.id);
        videos.push({ id: it.id, name: it.name, mimeType: it.file?.mimeType, thumbnailUrl });
      }
    }

    videos.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
    return Response.json({ id: folder.id, title: folder.name, description, videos });
  } catch (e: any) {
    return new Response(e?.message || "Error", { status: 500 });
  }
}
