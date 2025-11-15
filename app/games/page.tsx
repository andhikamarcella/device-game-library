import { LibrarySection } from "@/components/dashboard/LibrarySection";

export default function GamesPage() {
  return (
    <div className="space-y-6 pb-16">
      <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">Library</h1>
      <p className="text-sm text-slate-600 dark:text-slate-300">
        Manage ownership, play status, and notes for every game you have saved from the dashboard search.
      </p>
      <LibrarySection />
    </div>
  );
}

