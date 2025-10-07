import { auth } from "@/auth";

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
  const images: { id: string; name: string; mimeType?: string; thumbnailUrl?: string }[] = [];
  for (const it of data.value || []) {
    if (it.file) {
      const mt = it.file?.mimeType || "";
      if (/^image\//.test(mt)) {
        let thumbnailUrl: string | undefined;
        try {
          const thumbRes = await fetch(
            `https://graph.microsoft.com/v1.0/drives/${encodeURIComponent(driveId)}/items/${it.id}/thumbnails`,
            { headers: { Authorization: `Bearer ${accessToken}` } }
          );
          if (thumbRes.ok) {
            const td = await thumbRes.json();
            if (td.value && td.value[0]) {
              thumbnailUrl = td.value[0].large?.url || td.value[0].medium?.url || td.value[0].small?.url;
            }
          }
        } catch {}
        images.push({ id: it.id, name: it.name, mimeType: mt, thumbnailUrl });
      } else if (/\.(txt|md)$/i.test(it.name)) {
        try {
          const capRes = await fetch(
            `https://graph.microsoft.com/v1.0/drives/${encodeURIComponent(driveId)}/items/${it.id}/content`,
            { headers: { Authorization: `Bearer ${accessToken}` } }
          );
          if (capRes.ok) description = await capRes.text();
        } catch {}
      }
    }
  }

  images.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
  return Response.json({ description, images });
}
