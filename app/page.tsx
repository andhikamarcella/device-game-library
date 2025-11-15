import { Suspense } from "react";

import { DashboardSearch } from "@/components/dashboard/DashboardSearch";
import { DashboardStats } from "@/components/dashboard/DashboardStats";
import { LibrarySection } from "@/components/dashboard/LibrarySection";
import { LibraryProvider } from "@/components/library/LibraryProvider";
import { getLibraryStats, listUserGames } from "@/lib/user-games";
import type { LibraryStats } from "@/lib/user-games";

const emptyStats: LibraryStats = {
  totalGames: 0,
  totalCompleted: 0,
  totalPlaying: 0,
  totalWishlist: 0,
  totalPlaytime: 0,
  mostCommonPlatform: null,
  topGenres: [],
};

export default async function DashboardPage() {
  const [stats, library] = await Promise.all([
    getLibraryStats().catch(() => emptyStats),
    listUserGames().catch(() => []),
  ]);

  return (
    <LibraryProvider initialGames={library}>
      <div className="space-y-10 pb-16">
        <DashboardStats stats={stats} />
        <Suspense fallback={<SearchSkeleton />}>
          <DashboardSearch />
        </Suspense>
        <LibrarySection />
      </div>
    </LibraryProvider>
  );
}

function SearchSkeleton() {
  return (
    <section className="space-y-4">
      <div className="h-32 rounded-2xl border border-slate-200/60 bg-slate-100/40 dark:border-slate-800/60 dark:bg-slate-800/30" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="h-52 rounded-2xl border border-slate-200/60 bg-slate-100/30 dark:border-slate-800/60 dark:bg-slate-800/40"
          />
        ))}
      </div>
    </section>
  );
}
