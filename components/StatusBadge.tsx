import { GameStatus } from "@/lib/types";
import { cn, getStatusColor } from "@/lib/utils";

export function StatusBadge({ status, className }: { status: GameStatus; className?: string }) {
  return (
    <span className={cn("inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide", getStatusColor(status), className)}>
      {status}
    </span>
  );
}
