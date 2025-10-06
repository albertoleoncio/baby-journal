import { listChildren, GraphDriveItem } from "./graph";

export type Post = {
  id: string;
  title: string;
  description: string | null;
  date: string; // ISO string
  images: {
    id: string;
    name: string;
    mimeType?: string;
    thumbnailUrl?: string;
  }[];
};

export type PostIndex = {
  id: string;
  title: string; // epoch string in folder name
  date: string; // ISO from folder metadata
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
  const isDev = process.env.NODE_ENV === "development";
  const entry = cache.get(key);
  if (!isDev && entry && now - entry.ts < CACHE_TTL_MS) return entry.posts;

  // First list subfolders under ROOT_PATH
  const children = await listChildren(accessToken, ROOT_PATH);
  const subfolders = (children || []).filter((c) => c.folder);

  const posts: Post[] = [];
  for (const folder of subfolders) {
    const subPath = `${ROOT_PATH}/${folder.name}`;
    const items = await listChildren(accessToken, subPath);

    let description: string | null = null;
    const images: Post["images"] = [];

    for (const it of items || []) {
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
          // Try to get a thumbnail
          let thumbnailUrl: string | undefined;
          try {
            const thumbRes = await fetch(
              `https://graph.microsoft.com/v1.0/me/drive/items/${it.id}/thumbnails`,
              {
                headers: { Authorization: `Bearer ${accessToken}` },
              }
            );
            if (thumbRes.ok) {
              const thumbData = await thumbRes.json();
              if (thumbData.value && thumbData.value.length > 0) {
                // Always prefer the largest available thumbnail for best quality
                thumbnailUrl =
                  thumbData.value[0].large?.url ||
                  thumbData.value[0].extraLarge?.url ||
                  thumbData.value[0].medium?.url ||
                  thumbData.value[0].small?.url;
              }
            }
          } catch {}
          images.push({ id: it.id, name: it.name, mimeType: it.file?.mimeType, thumbnailUrl });
        }
      }
    }

    const sortedImages = images.toSorted((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
    posts.push({
      id: folder.id,
      title: folder.name, // epoch string
      description,
      date: folder.createdDateTime || folder.lastModifiedDateTime || new Date().toISOString(),
      images: sortedImages,
    });
  }

  // Sort posts by folder name (epoch) descending
  posts.sort((a, b) => Number(b.title) - Number(a.title));
  cache.set(key, { ts: now, posts });
  return posts;
}

export function invalidateUserPostsCache(userId: string) {
  cache.delete(`${userId}`);
}

// Lightweight index for faster first paint: only folders, no images/descriptions
export async function getUserPostIndex(accessToken: string, _userId: string): Promise<PostIndex[]> {
  const children = await listChildren(accessToken, ROOT_PATH);
  const subfolders = (children || []).filter((c) => c.folder);
  const list: PostIndex[] = subfolders.map((f) => ({
    id: f.id!,
    title: f.name,
    date: f.createdDateTime || f.lastModifiedDateTime || new Date().toISOString(),
  }));
  // Sort by folder name as epoch desc
  list.sort((a, b) => Number(b.title) - Number(a.title));
  return list;
}
