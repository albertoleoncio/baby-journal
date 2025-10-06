import { auth } from "@/auth";
import { invalidateUserPostsCache } from "@/lib/posts";

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return new Response("Unauthorized", { status: 401 });
  const accessToken = (session as any).accessToken as string | undefined;
  const userId = (session as any).userId as string | undefined;
  if (!accessToken || !userId) return new Response("Unauthorized", { status: 401 });

  const { folderId, newName } = await req.json().catch(() => ({}));
  if (!folderId || !newName) return new Response("Missing folderId or newName", { status: 400 });

  const res = await fetch(`https://graph.microsoft.com/v1.0/me/drive/items/${encodeURIComponent(folderId)}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name: newName }),
  });
  if (!res.ok) {
    const txt = await res.text();
    return new Response(`Failed to rename: ${txt}`, { status: res.status });
  }
  invalidateUserPostsCache(userId);
  return Response.json({ ok: true });
}
