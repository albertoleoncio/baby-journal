import { auth } from "@/auth";

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
    if (it.file) {
      const mt = it.file?.mimeType || "";
      if (/^image\//.test(mt)) {
        let thumbnailUrl: string | undefined;
        try {
          const thumbRes = await fetch(
            `https://graph.microsoft.com/v1.0/me/drive/items/${it.id}/thumbnails`,
            { headers: { Authorization: `Bearer ${accessToken}` } }
          );
          if (thumbRes.ok) {
            const td = await thumbRes.json();
            if (td.value && td.value[0]) {
              // Always prefer large, then medium, then small
              thumbnailUrl = td.value[0].large?.url || td.value[0].medium?.url || td.value[0].small?.url;
            }
          }
        } catch {}
        images.push({ id: it.id, name: it.name, mimeType: mt, thumbnailUrl });
      } else if (/\.(txt|md)$/i.test(it.name)) {
        // Fetch caption text content
        try {
          const capRes = await fetch(`https://graph.microsoft.com/v1.0/me/drive/items/${it.id}/content`, {
            headers: { Authorization: `Bearer ${accessToken}` },
          });
          if (capRes.ok) description = await capRes.text();
        } catch {}
      }
    }
  }

  images.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
  return Response.json({ id: folderId, title: item.name || "", description, images });
}
