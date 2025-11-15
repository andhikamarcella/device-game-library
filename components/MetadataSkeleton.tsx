export function MetadataSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-6 w-40 rounded-lg bg-slate-800" />
      <div className="grid gap-4 md:grid-cols-[220px,1fr]">
        <div className="h-64 rounded-3xl bg-slate-800" />
        <div className="space-y-4">
          <div className="h-6 w-2/3 rounded-lg bg-slate-800" />
          <div className="grid gap-3 sm:grid-cols-2">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="h-14 rounded-xl bg-slate-800" />
            ))}
          </div>
          <div className="h-28 rounded-2xl bg-slate-800" />
        </div>
      </div>
    </div>
  );
}
