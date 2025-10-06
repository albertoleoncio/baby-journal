import { auth } from "@/auth";
import { invalidateUserPostsCache } from "@/lib/posts";

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return new Response("Unauthorized", { status: 401 });
  const accessToken = (session as any).accessToken as string | undefined;
  const userId = (session as any).userId as string | undefined;
  if (!accessToken || !userId) return new Response("Unauthorized", { status: 401 });

  const { fileId } = await req.json().catch(() => ({}));
  if (!fileId) return new Response("Missing fileId", { status: 400 });

  const res = await fetch(`https://graph.microsoft.com/v1.0/me/drive/items/${encodeURIComponent(fileId)}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok && res.status !== 204) return new Response(await res.text(), { status: res.status });
  invalidateUserPostsCache(userId);
  return Response.json({ ok: true });
}
