import { auth } from "@/auth";
import { invalidateUserPostsCache } from "@/lib/posts";

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return new Response("Unauthorized", { status: 401 });
  const accessToken = (session as any).accessToken as string | undefined;
  const userId = (session as any).userId as string | undefined;
  if (!accessToken || !userId) return new Response("Unauthorized", { status: 401 });

  const { folderId, caption } = await req.json().catch(() => ({}));
  if (!folderId) return new Response("Missing folderId", { status: 400 });

  // Find description file by name
  const childrenRes = await fetch(`https://graph.microsoft.com/v1.0/me/drive/items/${encodeURIComponent(folderId)}/children`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!childrenRes.ok) return new Response(await childrenRes.text(), { status: childrenRes.status });
  const children = await childrenRes.json();
  const descItem = (children.value || []).find((x: any) => /^(description\.txt|description\.md)$/i.test(x.name));

  if (caption && caption.length > 0) {
    const url = descItem
      ? `https://graph.microsoft.com/v1.0/me/drive/items/${descItem.id}/content`
      : `https://graph.microsoft.com/v1.0/me/drive/items/${encodeURIComponent(folderId)}:/description.txt:/content`;
    const method = descItem ? "PUT" : "PUT";
    const capRes = await fetch(url, {
      method,
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "text/plain" },
      body: caption,
    });
    if (!capRes.ok) return new Response(await capRes.text(), { status: capRes.status });
  } else if (descItem) {
    // Empty caption -> delete description file
    await fetch(`https://graph.microsoft.com/v1.0/me/drive/items/${descItem.id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${accessToken}` },
    });
  }

  invalidateUserPostsCache(userId);
  return Response.json({ ok: true });
}
