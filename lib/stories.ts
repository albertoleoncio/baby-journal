import { listChildren, GraphDriveItem } from "./graph";

export type Story = {
  id: string;
  title: string; // epoch string from folder name
  date: string; // ISO from folder metadata
  description: string | null;
  videos: {
    id: string;
    name: string;
    mimeType?: string;
    thumbnailUrl?: string; // preview thumbnail if available from graph
  }[];
};

export type StoryIndex = {
  id: string;
  title: string; // epoch string in folder name
  date: string; // ISO from folder metadata
};

// naive in-memory cache per user (server memory) with TTL
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const cache = new Map<string, { ts: number; stories: Story[] }>();

const ROOT_PATH = "/Apps/BabyJournal/stories";

function isTextFile(name: string) {
  const l = name.toLowerCase();
  return l === "description.txt" || l === "description.md" || l.endsWith(".md") || l.endsWith(".txt");
}

function isVideo(item: GraphDriveItem) {
  const mt = item.file?.mimeType || "";
  return mt.startsWith("video/");
}

async function fetchTextContent(accessToken: string, itemId: string): Promise<string | null> {
  try {
    const res = await fetch(`https://graph.microsoft.com/v1.0/me/drive/items/${itemId}/content`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (res.ok) return await res.text();
  } catch {}
  return null;
}

async function fetchThumbnailUrl(accessToken: string, itemId: string): Promise<string | undefined> {
  try {
    const thumbRes = await fetch(
      `https://graph.microsoft.com/v1.0/me/drive/items/${itemId}/thumbnails`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    if (thumbRes.ok) {
      const thumbData = await thumbRes.json();
      const t = thumbData.value?.[0];
      return t?.large?.url || t?.extraLarge?.url || t?.medium?.url || t?.small?.url;
    }
  } catch {}
  return undefined;
}

async function buildStoryFromFolder(accessToken: string, folder: GraphDriveItem): Promise<Story> {
  const subPath = `${ROOT_PATH}/${folder.name}`;
  const items = await listChildren(accessToken, subPath);

  let description: string | null = null;
  const videos: Story["videos"] = [];

  for (const it of items || []) {
    if (!it.file) continue;
    if (isTextFile(it.name)) {
      description = await fetchTextContent(accessToken, it.id) || description;
      continue;
    }
    if (isVideo(it)) {
      const thumbnailUrl = await fetchThumbnailUrl(accessToken, it.id);
      videos.push({ id: it.id, name: it.name, mimeType: it.file?.mimeType, thumbnailUrl });
    }
  }

  const sortedVideos = videos.toSorted((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
  return {
    id: folder.id,
    title: folder.name,
    description,
    date: folder.createdDateTime || folder.lastModifiedDateTime || new Date().toISOString(),
    videos: sortedVideos,
  };
}

export async function getUserStories(accessToken: string, userId: string): Promise<Story[]> {
  const key = `${userId}`;
  const now = Date.now();
  const isDev = process.env.NODE_ENV === "development";
  const entry = cache.get(key);
  if (!isDev && entry && now - entry.ts < CACHE_TTL_MS) return entry.stories;

  const children = await listChildren(accessToken, ROOT_PATH);
  const subfolders = (children || []).filter((c) => c.folder);
  const stories: Story[] = [];
  for (const folder of subfolders) {
    stories.push(await buildStoryFromFolder(accessToken, folder));
  }

  stories.sort((a, b) => Number(b.title) - Number(a.title));
  cache.set(key, { ts: now, stories });
  return stories;
}

export function invalidateUserStoriesCache(userId: string) {
  cache.delete(`${userId}`);
}

export async function getUserStoriesIndex(accessToken: string, _userId: string): Promise<StoryIndex[]> {
  const children = await listChildren(accessToken, ROOT_PATH);
  const subfolders = (children || []).filter((c) => c.folder);
  const list: StoryIndex[] = subfolders.map((f) => ({
    id: f.id!,
    title: f.name,
    date: f.createdDateTime || f.lastModifiedDateTime || new Date().toISOString(),
  }));
  list.sort((a, b) => Number(b.title) - Number(a.title));
  return list;
}
