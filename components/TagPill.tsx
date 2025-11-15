import { cn } from "@/lib/utils";

export function TagPill({ label, className }: { label: string; className?: string }) {
  return (
    <span className={cn("inline-flex items-center rounded-full bg-slate-800/80 px-2.5 py-1 text-xs font-medium text-slate-300", className)}>
      #{label}
    </span>
  );
}
