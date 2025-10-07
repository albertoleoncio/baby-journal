"use client";

export type StoryThumb = {
  id: string;
  title: string; // epoch string
  date: string;
  coverUrl?: string; // from first video's thumbnail
};

export function StoriesBar({ items, onOpen }: Readonly<{ items: StoryThumb[]; onOpen: (id: string) => void }>) {
  return (
    <div className="flex gap-3 overflow-x-auto pb-2">
      {items.map((s) => (
        <button
          key={s.id}
          onClick={() => onOpen(s.id)}
          className="flex-shrink-0 text-center focus:outline-none"
          aria-label={`Open story ${s.title}`}
        >
          <div className="w-16 h-16 rounded-full ring-2 ring-blue-500 overflow-hidden bg-black/5 dark:bg-white/10">
            {s.coverUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={s.coverUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full grid place-items-center text-xs text-black/40 dark:text-white/40">{new Date(Number(s.title) * 1000).getDate()}</div>
            )}
          </div>
          <div className="mt-1 text-[10px] text-black/70 dark:text-white/70 w-16 truncate">
            {new Date(Number(s.title) * 1000).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
          </div>
        </button>
      ))}
    </div>
  );
}
