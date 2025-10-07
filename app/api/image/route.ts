import { auth } from "@/auth";

export async function GET(req: Request) {
  const session = await auth();
  if (!session || !(session as any).accessToken) {
    return new Response("Unauthorized", { status: 401 });
  }
  const { searchParams } = new URL(req.url);
  const driveItemId = searchParams.get("id");
  const driveId = searchParams.get("driveId");
  if (!driveItemId) return new Response("Missing id", { status: 400 });

  const accessToken = (session as any).accessToken as string;

  // Build URL for personal or shared drive
  const base = driveId
    ? `https://graph.microsoft.com/v1.0/drives/${encodeURIComponent(driveId)}/items/${encodeURIComponent(driveItemId)}/content`
    : `https://graph.microsoft.com/v1.0/me/drive/items/${encodeURIComponent(driveItemId)}/content`;

  // Forward Range header for video streaming support
  const headers: Record<string, string> = { Authorization: `Bearer ${accessToken}` };
  const range = req.headers.get("range") || req.headers.get("Range");
  if (range) headers["Range"] = range;

  // Get raw content stream of the file (image/video/content)
  const res = await fetch(base, { headers });

  if (!res.ok) {
    return new Response("Failed to fetch image", { status: res.status });
  }

  // Stream through with essential headers preserved
  const outHeaders = new Headers();
  const ct = res.headers.get("Content-Type");
  if (ct) outHeaders.set("Content-Type", ct);
  const cl = res.headers.get("Content-Length");
  if (cl) outHeaders.set("Content-Length", cl);
  const cr = res.headers.get("Content-Range");
  if (cr) outHeaders.set("Content-Range", cr);
  const ar = res.headers.get("Accept-Ranges");
  if (ar) outHeaders.set("Accept-Ranges", ar);
  const etag = res.headers.get("ETag");
  if (etag) outHeaders.set("ETag", etag);
  const lm = res.headers.get("Last-Modified");
  if (lm) outHeaders.set("Last-Modified", lm);
  outHeaders.set("Cache-Control", "private, max-age=300");

  return new Response(res.body, { status: res.status, headers: outHeaders });
}
