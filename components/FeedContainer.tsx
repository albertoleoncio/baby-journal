type Props = {
  title?: string;
  right?: React.ReactNode;
  children: React.ReactNode;
};

export function FeedContainer({ title = "Baby Journal", right, children }: Props) {
  return (
    <div className="mx-auto max-w-md sm:max-w-lg md:max-w-2xl lg:max-w-3xl p-0 sm:p-4">
      <header className="sticky top-0 z-10 backdrop-blur bg-background/70 border-b border-black/5 dark:border-white/10 px-4 py-3 flex items-center justify-between">
        <h1 className="text-lg font-semibold">{title}</h1>
        <div className="flex gap-2">{right}</div>
      </header>
      <main className="space-y-6 p-2">{children}</main>
    </div>
  );
}
