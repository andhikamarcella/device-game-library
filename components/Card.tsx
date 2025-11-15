import { cn } from "@/lib/utils";

export function Card({
  title,
  description,
  className,
  children,
  action,
}: {
  title?: string;
  description?: string;
  className?: string;
  action?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "w-full rounded-2xl border border-slate-200/70 bg-white/80 p-6 shadow-lg shadow-slate-900/10 backdrop-blur transition-colors duration-300 ease-out dark:border-white/10 dark:bg-[#0c1a31]/85 dark:shadow-black/40 motion-safe:transition-transform motion-safe:duration-300 motion-safe:ease-out motion-safe:hover:-translate-y-1 motion-safe:hover:shadow-emerald-500/20 focus-within:ring-2 focus-within:ring-emerald-500/40 focus-within:ring-offset-2 focus-within:ring-offset-slate-50 dark:focus-within:ring-offset-[#050b16] high-contrast-surface",
        className,
      )}
    >
      {(title || description || action) && (
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            {title ? <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">{title}</h2> : null}
            {description ? <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{description}</p> : null}
          </div>
          {action ? <div className="shrink-0">{action}</div> : null}
        </div>
      )}
      {children}
    </div>
  );
}
