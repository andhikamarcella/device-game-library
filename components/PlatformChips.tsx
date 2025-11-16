import type { FC } from "react";
import { cn } from "@/lib/utils";
import { getPlatformIcon } from "@/lib/platformIcons";
import type { RawgParentPlatform, RawgPlatform } from "@/lib/rawg";

type PlatformInfo = {
  id: number;
  name: string;
  slug: string;
};

type PlatformChipEntry = RawgParentPlatform | RawgPlatform | PlatformInfo | null | undefined;

interface PlatformChipsProps {
  platforms?: PlatformChipEntry[] | null;
  className?: string;
  limit?: number;
  size?: "sm" | "md";
}

const sizeStyles: Record<NonNullable<PlatformChipsProps["size"]>, { chip: string; icon: string }> = {
  sm: {
    chip: "px-2.5 py-0.5 text-[11px]",
    icon: "h-3.5 w-3.5",
  },
  md: {
    chip: "px-3 py-1 text-xs",
    icon: "h-4 w-4",
  },
};

const isPlatformInfo = (platform: PlatformInfo | null | undefined): platform is PlatformInfo =>
  Boolean(
    platform &&
      typeof platform.id === "number" &&
      typeof platform.name === "string" &&
      platform.name.trim().length > 0 &&
      typeof platform.slug === "string" &&
      platform.slug.trim().length > 0
  );

const normalizeEntries = (entries: PlatformChipEntry[] = []): PlatformInfo[] =>
  entries
    .map((entry) => {
      if (!entry) return null;
      if (typeof entry === "object" && "platform" in entry) {
        return entry.platform ?? null;
      }
      return entry;
    })
    .filter(isPlatformInfo);

const PlatformChips: FC<PlatformChipsProps> = ({ platforms, className, limit, size = "md" }) => {
  const normalized = normalizeEntries(platforms ?? []);
  if (!normalized.length) {
    return null;
  }

  const entries = typeof limit === "number" ? normalized.slice(0, limit) : normalized;
  const { chip, icon } = sizeStyles[size];

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {entries.map((platform) => {
        const Icon = getPlatformIcon(platform.slug);
        return (
          <span
            key={`${platform.slug}-${platform.id}`}
            className={cn(
              "inline-flex items-center gap-2 rounded-full border border-slate-200/70 bg-white/70 text-slate-800 dark:border-slate-700/60 dark:bg-slate-800/70 dark:text-slate-100",
              chip
            )}
          >
            <Icon className={cn(icon, "text-current")} />
            <span className="truncate">{platform.name}</span>
          </span>
        );
      })}
    </div>
  );
};

export default PlatformChips;
