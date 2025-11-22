import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { mapWebsiteLinks, type WebsiteEntry } from "@/lib/links";
import { cn } from "@/lib/utils";

type LinksBoxProps = {
  websites?: WebsiteEntry[] | null;
};

export function LinksBox({ websites }: LinksBoxProps) {
  const links = mapWebsiteLinks(websites);

  return (
    <section className="space-y-3 rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
      <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
        <ExternalLink className="h-4 w-4" aria-hidden="true" />
        <h2 className="text-sm font-semibold uppercase tracking-widest">Official &amp; Community Links</h2>
      </div>

      {links.length === 0 ? (
        <div className="rounded-2xl border border-slate-200/70 bg-slate-50/80 p-4 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-300">
          No links available for this game.
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                target="_blank"
                rel="noreferrer"
                className={cn(
                  "group flex items-center justify-between gap-3 rounded-2xl border border-slate-200/70 bg-white/70 px-4 py-3 text-sm text-slate-800 transition hover:-translate-y-0.5 hover:border-emerald-400 hover:bg-emerald-50/70 hover:text-emerald-700 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-100 dark:hover:border-emerald-400/70 dark:hover:bg-emerald-500/5 dark:hover:text-emerald-200",
                )}
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-700 shadow-sm dark:bg-slate-800 dark:text-slate-100">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <span className="font-semibold leading-tight">{link.label}</span>
                </div>
                <ExternalLink className="h-4 w-4 text-slate-400 transition group-hover:text-emerald-500" aria-hidden="true" />
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}
