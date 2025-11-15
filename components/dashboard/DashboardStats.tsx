import clsx from "clsx";
import { LibraryStats } from "@/lib/user-games";

const formatNumber = (value: number) => new Intl.NumberFormat().format(value);

export function DashboardStats({ stats }: { stats: LibraryStats }) {
  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard label="Games in library" value={formatNumber(stats.totalGames)} />
      <StatCard label="Currently playing" value={formatNumber(stats.totalPlaying)} trend="info" />
      <StatCard label="Completed" value={formatNumber(stats.totalCompleted)} trend="success" />
      <StatCard label="Wishlist" value={formatNumber(stats.totalWishlist)} trend="muted" />
      <StatCard label="Total playtime" value={`${formatNumber(stats.totalPlaytime)} h`} />
      <StatCard
        label="Favourite platform"
        value={stats.mostCommonPlatform ? stats.mostCommonPlatform.toUpperCase() : "—"}
      />
      <StatCard label="Top genres" value={stats.topGenres.length ? stats.topGenres.join(", ") : "—"} span={2} />
    </section>
  );
}

function StatCard({
  label,
  value,
  trend,
  span,
}: {
  label: string;
  value: string;
  trend?: "info" | "success" | "muted";
  span?: number;
}) {
  const trendClasses: Record<NonNullable<typeof trend>, string> = {
    info: "border-blue-500/40 bg-blue-500/10 text-blue-300",
    success: "border-emerald-500/40 bg-emerald-500/10 text-emerald-300",
    muted: "border-slate-500/40 bg-slate-500/10 text-slate-300",
  };

  return (
    <article
      className={clsx(
        "rounded-2xl border border-slate-200/80 bg-white/70 p-5 shadow-md shadow-slate-900/5 backdrop-blur dark:border-slate-800/60 dark:bg-slate-900/60",
        span === 2 && "sm:col-span-2",
        span === 3 && "sm:col-span-3",
      )}
    >
      <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-3 text-2xl font-semibold text-slate-900 transition-colors dark:text-white">{value}</p>
      {trend ? <span className={`mt-4 inline-flex rounded-full px-3 py-1 text-xs ${trendClasses[trend]}`}>Trend</span> : null}
    </article>
  );
}
