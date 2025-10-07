import { auth } from "@/auth";
import { SharedFeedButton } from "@/components/SharedFeedButton";

export default async function Home() {
  const session = await auth();
  const signedIn = !!session;
  return (
    <div className="min-h-dvh flex items-center justify-center p-8">
      <div className="text-center space-y-6">
        <h1 className="text-3xl font-bold">Baby Journal</h1>
        <p className="text-black/60 dark:text-white/60">A private Instagram-like feed from your OneDrive</p>
        <div className="flex items-center justify-center gap-3">
          {!signedIn ? (
            <a href="/api/auth/signin" className="rounded-full bg-black text-white dark:bg-white dark:text-black px-4 py-2 text-sm">
              Sign in with Microsoft
            </a>
          ) : (
            <>
              <a href="/feed" className="rounded-full border px-4 py-2 text-sm">Go to Feed</a>
              <SharedFeedButton />
              <a href="/api/auth/signout" className="rounded-full border px-4 py-2 text-sm">Sign out</a>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
