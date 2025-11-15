import { Suspense } from "react";

import { DashboardSearch } from "@/components/dashboard/DashboardSearch";
import { DashboardStats } from "@/components/dashboard/DashboardStats";
import { LibrarySection } from "@/components/dashboard/LibrarySection";

function SearchFallback() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          key={index}
          className="h-48 animate-pulse rounded-2xl border border-slate-200/60 bg-white/80 dark:border-white/10 dark:bg-[#0c1d36]/70"
        />
      ))}
    </div>
  );
}

export default function DashboardPage() {
  return (
    <div className="space-y-10 pb-16">
      <Suspense fallback={<SearchFallback />}>
        <DashboardSearch />
      </Suspense>
      <DashboardStats />
      <LibrarySection />
    </div>
  );
}

