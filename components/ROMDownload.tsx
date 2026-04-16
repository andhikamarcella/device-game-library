"use client";

import { romsfunPlatformMap } from "@/lib/romsfun-mapping";
import { slugifyTitle } from "@/lib/slugify";

interface PlatformLike {
  name?: string | null;
  platform?: {
    name?: string | null;
  } | null;
}

interface ROMDownloadProps {
  game: {
    name?: string | null;
    platforms?: PlatformLike[] | null;
  } | null;
}

export default function ROMDownload({ game }: ROMDownloadProps) {
  if (!game) return null;

  const platforms = Array.isArray(game.platforms) ? game.platforms : [];
  if (!platforms.length) return null;

  const romLinks = platforms
    .map((platformEntry) => {
      const platformName =
        typeof platformEntry.name === "string" && platformEntry.name.trim().length
          ? platformEntry.name
          : typeof platformEntry.platform?.name === "string" && platformEntry.platform.name.trim().length
            ? platformEntry.platform.name
            : null;

      if (!platformName) return null;

      const platformSlug = romsfunPlatformMap[platformName] ?? null;

      if (!platformSlug) return null;

      const gameSlug = slugifyTitle(game.name ?? "");

      if (!gameSlug) return null;

      return {
        platformName,
        url: `https://romsfun.com/roms/${platformSlug}/${gameSlug}.html`,
      };
    })
    .filter((entry): entry is { platformName: string; url: string } => Boolean(entry));

  return (
    <section className="space-y-3 rounded-3xl border border-emerald-500/40 bg-emerald-500/10 p-6 shadow-sm">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-semibold text-emerald-900 dark:text-emerald-100">
          ROM Download (ROMsFun)
        </h2>
        <p className="text-sm text-emerald-900/80 dark:text-emerald-100/80">Auto-generated per platform</p>
      </div>

      {romLinks.length === 0 ? (
        <p className="text-sm text-gray-600 dark:text-gray-300">
          ROM not available for any supported platform.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {romLinks.map((link, idx) => (
            <a
              key={`${link.platformName}-${idx}`}
              href={link.url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-between gap-3 rounded-xl border border-emerald-400/50 bg-emerald-500/20 px-4 py-3 text-sm font-semibold text-emerald-900 transition hover:-translate-y-0.5 hover:bg-emerald-500/30 hover:text-emerald-950 dark:text-emerald-50"
            >
              <span>Download for {link.platformName}</span>
              <span className="text-xs font-medium text-emerald-800/80 dark:text-emerald-100/80">romsfun.com</span>
            </a>
          ))}
        </div>
      )}
    </section>
  );
}
