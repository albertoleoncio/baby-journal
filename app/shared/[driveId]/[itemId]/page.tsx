import { auth } from "@/auth";
import { PostCard } from "@/components/PostCard";
import { SignInRequired } from "@/components/SignInRequired";
import { FeedContainer } from "@/components/FeedContainer";

export const dynamic = "force-dynamic";

export default async function SharedFeedPage({ params }: { readonly params: { readonly driveId: string; readonly itemId: string } }) {
  const session = await auth();
  if (!session) return <SignInRequired />;

  const accessToken = (session as any).accessToken as string;
  const { driveId, itemId } = params;
  const res = await fetch(`${process.env.NEXTAUTH_URL || ''}/api/shared/${encodeURIComponent(driveId)}/${encodeURIComponent(itemId)}/posts`, { headers: { Authorization: `Bearer ${accessToken}` } });
  const posts = res.ok ? await res.json() : [];

  return (
    <FeedContainer
      title="Shared Baby Journal"
      right={<a href="/feed" className="rounded-full border px-3 py-1 text-sm hover:bg-black/5 dark:hover:bg-white/10">Back to my feed</a>}
    >
      {posts.map((p: any) => (
        <PostCard key={p.id} driveId={driveId} id={p.id} title={p.title} date={p.date} />
      ))}
      {posts.length === 0 && (
        <div className="text-center text-sm text-black/60 dark:text-white/60 py-12">No posts found in shared folder.</div>
      )}
    </FeedContainer>
  );
}
