import { auth } from "@/auth";

export async function GET(
  req: Request,
  { params }: { params: { driveId: string; itemId: string } }
) {
  // Prefer Authorization header if provided (SSR calling with Graph token)
  let accessToken: string | undefined;
  const authz = req.headers.get("authorization") || req.headers.get("Authorization");
  if (authz?.toLowerCase().startsWith("bearer ")) {
    accessToken = authz.slice(7);
  } else {
    const session = await auth();
    if (!session) return new Response("Unauthorized", { status: 401 });
    accessToken = (session as any).accessToken as string | undefined;
  }
  if (!accessToken) return new Response("Unauthorized", { status: 401 });

  const { driveId, itemId } = params;
  // List child folders (each post is a subfolder with epoch name)
  const res = await fetch(
    `https://graph.microsoft.com/v1.0/drives/${encodeURIComponent(driveId)}/items/${encodeURIComponent(itemId)}/children`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!res.ok) return new Response(await res.text(), { status: res.status });
  const data = await res.json();
  const subfolders = (data.value || []).filter((it: any) => it.folder);
  const list = subfolders
    .map((f: any) => ({ id: f.id as string, title: f.name as string, date: f.createdDateTime || f.lastModifiedDateTime }))
    .sort((a: any, b: any) => Number(b.title) - Number(a.title));
  return Response.json(list);
}
