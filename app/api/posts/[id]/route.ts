import { auth } from "@/auth";

async function getThumbnail(accessToken: string, itemId: string): Promise<string | undefined> {
  try {
    const res = await fetch(
      `https://graph.microsoft.com/v1.0/me/drive/items/${itemId}/thumbnails`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    if (!res.ok) return undefined;
    const td = await res.json();
    const t0 = td?.value?.[0];
    return t0?.large?.url || t0?.medium?.url || t0?.small?.url;
  } catch {
    return undefined;
  }
}

async function getTextContent(accessToken: string, itemId: string): Promise<string | null> {
  try {
    const capRes = await fetch(
      `https://graph.microsoft.com/v1.0/me/drive/items/${itemId}/content`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    if (capRes.ok) return await capRes.text();
  } catch {}
  return null;
}

function isMedia(mime: string, name: string): boolean {
  return mime.startsWith("image/") || mime.startsWith("video/") || name.toLowerCase().endsWith(".mp4");
}

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session) return new Response("Unauthorized", { status: 401 });
  const accessToken = (session as any).accessToken as string | undefined;
  if (!accessToken) return new Response("Unauthorized", { status: 401 });

  const folderId = params.id;

  // Fetch item to get the folder name (title)
  const itemRes = await fetch(`https://graph.microsoft.com/v1.0/me/drive/items/${encodeURIComponent(folderId)}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (itemRes.status === 404) return Response.json({ id: folderId, title: "", description: null, images: [] });
  if (!itemRes.ok) return new Response(await itemRes.text(), { status: itemRes.status });
  const item = await itemRes.json();

  // List children of the folder by id
  const childrenRes = await fetch(`https://graph.microsoft.com/v1.0/me/drive/items/${encodeURIComponent(folderId)}/children`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (childrenRes.status === 404) return Response.json({ id: folderId, title: item.name || "", description: null, images: [] });
  if (!childrenRes.ok) return new Response(await childrenRes.text(), { status: childrenRes.status });
  const childrenData = await childrenRes.json();

  let description: string | null = null;
  const images: { id: string; name: string; mimeType?: string; thumbnailUrl?: string }[] = [];
  for (const it of childrenData.value || []) {
    if (!it.file) continue;
    const mt = it.file?.mimeType || "";
    if (isMedia(mt, it.name)) {
      const thumbnailUrl = await getThumbnail(accessToken, it.id);
      images.push({ id: it.id, name: it.name, mimeType: mt, thumbnailUrl });
      continue;
    }
    if (/\.(txt|md)$/i.test(it.name)) {
      description = (await getTextContent(accessToken, it.id)) ?? description;
    }
  }

  images.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
  return Response.json({ id: folderId, title: item.name || "", description, images });
}
