import { auth } from "@/auth";

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return new Response("Unauthorized", { status: 401 });
  const accessToken = (session as any).accessToken as string | undefined;
  if (!accessToken) return new Response("Unauthorized", { status: 401 });

  const formData = await req.formData();
  const folderId = formData.get("folderId") as string | null;
  const file = formData.get("file") as File | null;
  if (!folderId || !file) return new Response("Missing folderId or file", { status: 400 });

  const fileName = (formData.get("fileName") as string) || file.name || `photo-${Date.now()}.jpg`;

  // Upload via PUT content to items/{folderId}:/fileName:/content
  const putRes = await fetch(
    `https://graph.microsoft.com/v1.0/me/drive/items/${encodeURIComponent(folderId)}:/${encodeURIComponent(fileName)}:/content`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": file.type || "application/octet-stream",
      },
      body: file.stream(),
      duplex: "half",
    }
  );
  if (!putRes.ok) {
    const txt = await putRes.text();
    return new Response(`Failed to upload file: ${txt}`, { status: putRes.status });
  }

  const uploaded = await putRes.json();
  return Response.json({ id: uploaded.id, name: uploaded.name });
}
