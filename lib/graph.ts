export type GraphDriveItem = {
  id: string;
  name: string;
  folder?: { childCount: number };
  file?: { mimeType?: string };
  createdDateTime?: string;
  lastModifiedDateTime?: string;
};

type GraphListResponse<T> = {
  value: T[];
  '@odata.nextLink'?: string;
};

export async function graphGet<T>(
  accessToken: string,
  url: string,
  init?: RequestInit
): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: {
      ...(init?.headers || {}),
      Authorization: `Bearer ${accessToken}`,
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Graph error ${res.status}: ${text}`);
  }
  return res.json();
}

export async function listChildren(
  accessToken: string,
  path: string
): Promise<GraphDriveItem[]> {
  let url = `https://graph.microsoft.com/v1.0/me/drive/root:${encodeURI(
    path
  )}:/children`;
  const all: GraphDriveItem[] = [];
  for (let i = 0; i < 10; i++) {
    const data = await graphGet<GraphListResponse<GraphDriveItem>>(accessToken, url);
    all.push(...data.value);
    if (!data['@odata.nextLink']) break;
    url = data['@odata.nextLink'];
  }
  return all;
}

export async function listFolderRecursive(
  accessToken: string,
  path: string
): Promise<Record<string, GraphDriveItem[]>> {
  const result: Record<string, GraphDriveItem[]> = {};
  const children = await listChildren(accessToken, path);
  result[path] = children;
  for (const item of children) {
    if (item.folder) {
      const subPath = `${path}/${item.name}`;
      result[subPath] = await listChildren(accessToken, subPath);
    }
  }
  return result;
}
