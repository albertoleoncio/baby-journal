import { auth } from "@/auth";

function isTextFile(name: string) {
  const l = name.toLowerCase();
  return l === "description.txt" || l === "description.md" || l.endsWith(".md") || l.endsWith(".txt");
}

async function getAccessToken(req: Request) {
  const authz = req.headers.get("authorization") || req.headers.get("Authorization");
  if (authz?.toLowerCase().startsWith("bearer ")) return authz.slice(7);
  const session = await auth();
  if (!session) return undefined;
  return (session as any).accessToken as string | undefined;
}

export async function GET(
  req: Request,
  { params }: { params: { driveId: string; itemId: string; storyId: string } }
) {
  const accessToken = await getAccessToken(req);
  if (!accessToken) return new Response("Unauthorized", { status: 401 });

  const { driveId, storyId } = params;

  const itemsRes = await fetch(
    `https://graph.microsoft.com/v1.0/drives/${encodeURIComponent(driveId)}/items/${encodeURIComponent(storyId)}/children`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!itemsRes.ok) return new Response(await itemsRes.text(), { status: itemsRes.status });
  const itemsData = await itemsRes.json();
  const items = itemsData.value || [];

  let description: string | null = null;
  const videos: { id: string; name: string; mimeType?: string }[] = [];

  for (const it of items) {
    if (!it.file) continue;
    if (isTextFile(it.name)) {
      const c = await fetch(
        `https://graph.microsoft.com/v1.0/drives/${encodeURIComponent(driveId)}/items/${encodeURIComponent(it.id)}/content`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      if (c.ok) description = await c.text();
      continue;
    }
    if ((it.file.mimeType || "").startsWith("video/")) {
      videos.push({ id: it.id as string, name: it.name as string, mimeType: it.file.mimeType as string });
    }
  }

  videos.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
  return Response.json({ id: storyId, description, videos });
}
