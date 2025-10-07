import { getUserStories } from "@/lib/stories";
import { StoriesClient } from "@/app/feed/stories-client";

export default async function StoriesSection({ accessToken, userId }: Readonly<{ accessToken: string; userId: string }>) {
  const stories = (await getUserStories(accessToken, userId)).filter((s) => /^\d+$/.test(s.title));
  return (
    <StoriesClient initial={stories.map((s) => ({ id: s.id, title: s.title, date: s.date, coverUrl: s.videos[0]?.thumbnailUrl }))} />
  );
}
