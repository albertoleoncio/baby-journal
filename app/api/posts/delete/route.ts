import { auth } from "@/auth";
import { invalidateUserPostsCache } from "@/lib/posts";

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return new Response("Unauthorized", { status: 401 });
  const accessToken = (session as any).accessToken as string | undefined;
  const userId = (session as any).userId as string | undefined;
  if (!accessToken || !userId) return new Response("Unauthorized", { status: 401 });

  const { folderId } = await req.json().catch(() => ({}));
  if (!folderId) return new Response("Missing folderId", { status: 400 });

  const delRes = await fetch(`https://graph.microsoft.com/v1.0/me/drive/items/${encodeURIComponent(folderId)}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!delRes.ok && delRes.status !== 204) {
    const txt = await delRes.text();
    return new Response(`Failed to delete: ${txt}`, { status: delRes.status });
  }
  invalidateUserPostsCache(userId);
  return Response.json({ ok: true });
}
