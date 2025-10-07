import { auth } from "@/auth";

async function getThumbnail(accessToken: string, driveId: string, itemId: string): Promise<string | undefined> {
  try {
    const res = await fetch(
      `https://graph.microsoft.com/v1.0/drives/${encodeURIComponent(driveId)}/items/${itemId}/thumbnails`,
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

async function getTextContent(accessToken: string, driveId: string, itemId: string): Promise<string | null> {
  try {
    const capRes = await fetch(
      `https://graph.microsoft.com/v1.0/drives/${encodeURIComponent(driveId)}/items/${itemId}/content`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    if (capRes.ok) return await capRes.text();
  } catch {}
  return null;
}

function isMedia(mime: string, name: string): boolean {
  return mime.startsWith("image/") || mime.startsWith("video/") || name.toLowerCase().endsWith(".mp4");
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return new Response("Unauthorized", { status: 401 });
  const accessToken = (session as any).accessToken as string | undefined;
  if (!accessToken) return new Response("Unauthorized", { status: 401 });

  const { driveId, folderId } = await req.json();
  if (!driveId || !folderId) return new Response("Missing driveId/folderId", { status: 400 });

  // List children of the shared folder
  const res = await fetch(
    `https://graph.microsoft.com/v1.0/drives/${encodeURIComponent(driveId)}/items/${encodeURIComponent(folderId)}/children`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!res.ok) return new Response(await res.text(), { status: res.status });
  const data = await res.json();

  let description: string | null = null;
  const images: { id: string; name: string; mimeType?: string; thumbnailUrl?: string; driveId?: string }[] = [];
  for (const it of data.value || []) {
    if (!it.file) continue;
    const mt = it.file?.mimeType || "";
    if (isMedia(mt, it.name)) {
  const thumbnailUrl = await getThumbnail(accessToken, driveId, it.id);
  images.push({ id: it.id, name: it.name, mimeType: mt, thumbnailUrl, driveId });
      continue;
    }
    if (/\.(txt|md)$/i.test(it.name)) {
      description = (await getTextContent(accessToken, driveId, it.id)) ?? description;
    }
  }

  images.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
  return Response.json({ description, images });
}
