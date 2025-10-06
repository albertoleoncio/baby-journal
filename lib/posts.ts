import { listChildren, GraphDriveItem } from "./graph";

export type Post = {
  id: string;
  title: string;
  description: string | null;
  date: string; // ISO string
  images: { id: string; name: string; mimeType?: string }[];
};

// naive in-memory cache per user (server memory) with TTL
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const cache = new Map<string, { ts: number; posts: Post[] }>();

const ROOT_PATH = "/Apps/BabyJournal";

function isTextFile(name: string) {
  const l = name.toLowerCase();
  return l === "description.txt" || l === "description.md" || l.endsWith(".md") || l.endsWith(".txt");
}

function isImage(item: GraphDriveItem) {
  const mt = item.file?.mimeType || "";
  return mt.startsWith("image/");
}

export async function getUserPosts(accessToken: string, userId: string): Promise<Post[]> {
  const key = `${userId}`;
  const now = Date.now();
  const entry = cache.get(key);
  if (entry && now - entry.ts < CACHE_TTL_MS) return entry.posts;

  // First list subfolders under ROOT_PATH
  const children = await listChildren(accessToken, ROOT_PATH);
  const subfolders = children.filter((c) => c.folder);

  const posts: Post[] = [];
  for (const folder of subfolders) {
    const subPath = `${ROOT_PATH}/${folder.name}`;
    const items = await listChildren(accessToken, subPath);

    let description: string | null = null;
    const images: Post["images"] = [];

    for (const it of items) {
      if (it.file) {
        if (isTextFile(it.name)) {
          try {
            // Download the file content as text
            const contentRes = await fetch(
              `https://graph.microsoft.com/v1.0/me/drive/items/${it.id}/content`,
              {
                headers: { Authorization: `Bearer ${accessToken}` },
              }
            );
            if (contentRes.ok) {
              description = await contentRes.text();
            }
          } catch {}
        } else if (isImage(it)) {
          images.push({ id: it.id, name: it.name, mimeType: it.file?.mimeType });
        }
      }
    }

    const sortedImages = images.toSorted((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
    posts.push({
      id: folder.id,
      title: folder.name,
      description,
      date: folder.createdDateTime || folder.lastModifiedDateTime || new Date().toISOString(),
      images: sortedImages,
    });
  }

  posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  cache.set(key, { ts: now, posts });
  return posts;
}

export function invalidateUserPostsCache(userId: string) {
  cache.delete(`${userId}`);
}
