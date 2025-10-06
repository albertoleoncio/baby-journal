import { auth } from "@/auth";

export async function GET(req: Request) {
  const session = await auth();
  if (!session || !(session as any).accessToken) {
    return new Response("Unauthorized", { status: 401 });
  }
  const { searchParams } = new URL(req.url);
  const driveItemId = searchParams.get("id");
  if (!driveItemId) return new Response("Missing id", { status: 400 });

  const accessToken = (session as any).accessToken as string;

  // Get raw content stream of the file
  const res = await fetch(
    `https://graph.microsoft.com/v1.0/me/drive/items/${encodeURIComponent(
      driveItemId
    )}/content`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  if (!res.ok) {
    return new Response("Failed to fetch image", { status: res.status });
  }

  // Stream through
  return new Response(res.body, {
    status: 200,
    headers: {
      "Content-Type": res.headers.get("Content-Type") || "image/jpeg",
      "Cache-Control": "private, max-age=300", // 5 minutes in proxy
    },
  });
}
