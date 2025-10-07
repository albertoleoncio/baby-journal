import { auth } from "@/auth";

async function getAccessToken(req: Request) {
  const authz = req.headers.get("authorization") || req.headers.get("Authorization");
  if (authz?.toLowerCase().startsWith("bearer ")) return authz.slice(7);
  const session = await auth();
  if (!session) return undefined;
  return (session as any).accessToken as string | undefined;
}

async function listChildren(accessToken: string, driveId: string, itemId: string) {
  const res = await fetch(
    `https://graph.microsoft.com/v1.0/drives/${encodeURIComponent(driveId)}/items/${encodeURIComponent(itemId)}/children`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!res.ok) throw new Response(await res.text(), { status: res.status });
  const data = await res.json();
  return data.value || [];
}

async function getFirstVideoThumb(accessToken: string, driveId: string, folderId: string) {
  const items = await listChildren(accessToken, driveId, folderId);
  const files = items.filter((it: any) => it.file && (it.file.mimeType || "").startsWith("video/"));
  files.sort((a: any, b: any) => a.name.localeCompare(b.name, undefined, { numeric: true }));
  const first = files[0];
  if (!first) return undefined;
  const tRes = await fetch(
    `https://graph.microsoft.com/v1.0/drives/${encodeURIComponent(driveId)}/items/${encodeURIComponent(first.id)}/thumbnails`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!tRes.ok) return undefined;
  const td = await tRes.json();
  const t = td.value?.[0];
  return t?.large?.url || t?.extraLarge?.url || t?.medium?.url || t?.small?.url;
}

export async function GET(
  req: Request,
  { params }: { params: { driveId: string; itemId: string } }
) {
  const accessToken = await getAccessToken(req);
  if (!accessToken) return new Response("Unauthorized", { status: 401 });
  const { driveId, itemId } = params;

  const children = await listChildren(accessToken, driveId, itemId);
  const storiesFolder = children.find((c: any) => c.folder && c.name === "stories");
  if (!storiesFolder) return Response.json([]);

  const storyChildren = await listChildren(accessToken, driveId, storiesFolder.id);
  const subfolders = storyChildren.filter((it: any) => it.folder && /^\d+$/.test(it.name));

  const results: { id: string; title: string; date: string; coverUrl?: string }[] = [];
  for (const f of subfolders) {
    const coverUrl = await getFirstVideoThumb(accessToken, driveId, f.id);
    results.push({ id: f.id as string, title: f.name as string, date: f.createdDateTime || f.lastModifiedDateTime, coverUrl });
  }
  results.sort((a, b) => Number(b.title) - Number(a.title));
  return Response.json(results);
}
