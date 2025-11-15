import { cn } from "@/lib/utils";

export function TagPill({ label, className }: { label: string; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full bg-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700 transition-colors duration-200 motion-safe:hover:-translate-y-0.5 motion-safe:transition-transform dark:bg-slate-800/80 dark:text-slate-200",
        className,
      )}
      aria-label={`Tag: ${label}`}
    >
      #{label}
    </span>
  );
}
