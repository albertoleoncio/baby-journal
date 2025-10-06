import { auth } from "@/auth";
import { invalidateUserPostsCache } from "@/lib/posts";

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return new Response("Unauthorized", { status: 401 });
  const accessToken = (session as any).accessToken as string | undefined;
  if (!accessToken) return new Response("Unauthorized", { status: 401 });

  const { title, caption } = await req.json().catch(() => ({}));
  const folderName = title || new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");

  // 1) Create the folder under /Apps/BabyJournal (not /children)
  const createRes = await fetch(
    `https://graph.microsoft.com/v1.0/me/drive/root:/Apps/BabyJournal:/children`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: folderName,
        folder: {},
        "@microsoft.graph.conflictBehavior": "rename",
      }),
    }
  );
  if (!createRes.ok) {
    const txt = await createRes.text();
    return new Response(`Failed to create folder: ${txt}`, { status: createRes.status });
  }
  const folder = await createRes.json();

  // 2) Upload caption as description.txt (optional)
  if (caption && caption.length > 0) {
    const capRes = await fetch(
      `https://graph.microsoft.com/v1.0/me/drive/items/${folder.id}:/description.txt:/content`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "text/plain",
        },
        body: caption,
      }
    );
    if (!capRes.ok) {
      const txt = await capRes.text();
      return new Response(`Failed to upload caption: ${txt}`, { status: capRes.status });
    }
  }

  // Invalidate cache so new post shows up on top after redirect
  const userId = (session as any).userId as string | undefined;
  if (userId) invalidateUserPostsCache(userId);

  return Response.json({ folderId: folder.id, folderName });
}
