export function StoriesSkeleton({ count = 6 }: Readonly<{ count?: number }>) {
  const keys = Array.from({ length: count }, () => crypto.randomUUID());
  return (
    <div className="flex gap-3 overflow-x-auto pb-2 px-2">
      {keys.map((k) => (
        <div key={k} className="flex-shrink-0 text-center">
          <div className="w-16 h-16 rounded-full bg-black/10 dark:bg-white/10 animate-pulse" />
          <div className="mt-1 h-3 w-10 mx-auto rounded bg-black/10 dark:bg-white/10 animate-pulse" />
        </div>
      ))}
    </div>
  );
}
