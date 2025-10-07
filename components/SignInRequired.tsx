export function SignInRequired() {
  return (
    <div className="min-h-dvh flex items-center justify-center p-6">
      <div className="text-center space-y-4">
        <h1 className="text-2xl font-semibold">Sign in required</h1>
        <a href="/api/auth/signin" className="inline-block rounded-full bg-black text-white dark:bg-white dark:text-black px-5 py-2 text-sm">
          Sign in with Microsoft
        </a>
      </div>
    </div>
  );
}
