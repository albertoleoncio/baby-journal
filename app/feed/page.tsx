import { auth } from "@/auth";
import { getUserPosts } from "@/lib/posts";
import { Carousel } from "@/components/Carousel";
import { PostActions } from "@/components/PostActions";

export const dynamic = "force-dynamic";

export default async function FeedPage() {
  const session = await auth();
  if (!session) {
    return (
      <div className="min-h-dvh flex items-center justify-center p-6">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-semibold">Sign in required</h1>
          <a
            href="/api/auth/signin"
            className="inline-block rounded-full bg-black text-white dark:bg-white dark:text-black px-5 py-2 text-sm"
          >
            Sign in with Microsoft
          </a>
        </div>
      </div>
    );
  }

  const accessToken = (session as any).accessToken as string;
  const userId = (session as any).userId as string;
  const posts = await getUserPosts(accessToken, userId);

  return (
    <div className="mx-auto max-w-md sm:max-w-lg md:max-w-2xl lg:max-w-3xl p-0 sm:p-4">
      <header className="sticky top-0 z-10 backdrop-blur bg-background/70 border-b border-black/5 dark:border-white/10 px-4 py-3 flex items-center justify-between">
        <h1 className="text-lg font-semibold">Baby Journal</h1>
        <div className="flex gap-2">
          <a href="/upload" className="rounded-full border px-3 py-1 text-sm bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-400 dark:text-black transition">Upload</a>
          <a href="/api/auth/signout" className="rounded-full border px-3 py-1 text-sm hover:bg-black/5 dark:hover:bg-white/10">Sign out</a>
        </div>
      </header>

      <main className="space-y-6 p-2">
        {posts.map((post) => (
          <article key={post.id} className="bg-white dark:bg-black rounded-2xl shadow-sm ring-1 ring-black/5 dark:ring-white/10 overflow-hidden">
            <Carousel images={post.images} />
            <div className="p-4">
              <div className="flex items-start justify-between gap-2">
                <h2 className="text-base font-semibold mb-1">{post.title}</h2>
                <div className="flex items-center gap-3">
                  <a href={`/posts/${post.id}/edit`} className="text-xs hover:underline">Edit</a>
                  <PostActions folderId={post.id} />
                </div>
              </div>
              <p className="text-xs text-black/50 dark:text-white/50 mb-2">
                {new Date(post.date).toLocaleString()}
              </p>
              {post.description && (
                <p className="text-sm whitespace-pre-wrap leading-relaxed">{post.description}</p>
              )}
            </div>
          </article>
        ))}
        {posts.length === 0 && (
          <div className="text-center text-sm text-black/60 dark:text-white/60 py-12">
            No posts found in OneDrive at <code className="px-1 py-0.5 rounded bg-black/5 dark:bg-white/10">/Apps/BabyJournal</code>.
          </div>
        )}
      </main>
    </div>
  );
}
