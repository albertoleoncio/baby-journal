import { auth } from "@/auth";
import { PostCard } from "@/components/PostCard";

export const dynamic = "force-dynamic";

export default async function SharedFeedPage({ params }: { params: { driveId: string; itemId: string } }) {
  const session = await auth();
  if (!session) {
    return (
      <div className="min-h-dvh flex items-center justify-center p-6">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-semibold">Sign in required</h1>
          <a href="/api/auth/signin" className="inline-block rounded-full bg-black text-white dark:bg-white dark:text-black px-5 py-2 text-sm">Sign in with Microsoft</a>
        </div>
      </div>
    );
  }

  const accessToken = (session as any).accessToken as string;
  const { driveId, itemId } = params;
  const res = await fetch(`${process.env.NEXTAUTH_URL || ''}/api/shared/${encodeURIComponent(driveId)}/${encodeURIComponent(itemId)}/posts`, { headers: { Authorization: `Bearer ${accessToken}` } });
  const posts = res.ok ? await res.json() : [];

  return (
    <div className="mx-auto max-w-md sm:max-w-lg md:max-w-2xl lg:max-w-3xl p-0 sm:p-4">
      <header className="sticky top-0 z-10 backdrop-blur bg-background/70 border-b border-black/5 dark:border-white/10 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <a href="/feed" className="rounded-full border px-3 py-1 text-sm hover:bg-black/5 dark:hover:bg-white/10">Back to my feed</a>
        </div>
      </header>

      <main className="space-y-6 p-2">
        {posts.map((p: any) => (
          <PostCard key={p.id} driveId={driveId} id={p.id} title={p.title} date={p.date} />
        ))}
        {posts.length === 0 && (
          <div className="text-center text-sm text-black/60 dark:text-white/60 py-12">No posts found in shared folder.</div>
        )}
      </main>
    </div>
  );
}
