import { auth } from "@/auth";
import { getUserPostIndex } from "@/lib/posts";
import { getUserStories } from "@/lib/stories";
import { PostCard } from "@/components/PostCard";
import { SignInRequired } from "@/components/SignInRequired";
import { FeedContainer } from "@/components/FeedContainer";
import { StoriesClient } from "@/app/feed/stories-client";

export const dynamic = "force-dynamic";

export default async function FeedPage() {
  const session = await auth();
  if (!session) return <SignInRequired />;

  const accessToken = (session as any).accessToken as string;
  const userId = (session as any).userId as string;
  const index = await getUserPostIndex(accessToken, userId);
  const stories = (await getUserStories(accessToken, userId)).filter(s => /^\d+$/.test(s.title));

  return (
    <FeedContainer
      title="Baby Journal"
      right={
        <>
          <a href="/upload" className="rounded-full border px-3 py-1 text-sm bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-400 dark:text-black transition">Upload</a>
          <a href="/api/auth/signout" className="rounded-full border px-3 py-1 text-sm hover:bg-black/5 dark:hover:bg-white/10">Sign out</a>
        </>
      }
    >
      <StoriesClient initial={stories.map(s => ({ id: s.id, title: s.title, date: s.date, coverUrl: s.videos[0]?.thumbnailUrl }))} />
      {index.map((p) => (
        <PostCard key={p.id} id={p.id} title={p.title} date={p.date} />
      ))}
      {index.length === 0 && (
        <div className="text-center text-sm text-black/60 dark:text-white/60 py-12">
          No posts found in OneDrive at <code className="px-1 py-0.5 rounded bg-black/5 dark:bg-white/10">/Apps/BabyJournal</code>.
        </div>
      )}
    </FeedContainer>
  );
}
