import { auth } from "@/auth";

export async function GET() {
  const session = await auth();
  if (!session) return new Response("Unauthorized", { status: 401 });
  const accessToken = (session as any).accessToken as string | undefined;
  if (!accessToken) return new Response("Unauthorized", { status: 401 });

  // Fetch items shared with the user
  const res = await fetch("https://graph.microsoft.com/v1.0/me/drive/sharedWithMe", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) return new Response(await res.text(), { status: res.status });
  const data = await res.json();
  return Response.json(data);
}
