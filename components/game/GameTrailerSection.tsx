"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, Play } from "lucide-react";
import { extractTrailerFromIgdb, type GameTrailerSource } from "@/lib/gameMedia";
import type { GameDetailsPayload } from "@/lib/gameData";
import type { YoutubeSearchResult } from "@/lib/youtube";

const IFRAME_PERMISSIONS =
  "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";

type GameTrailerSectionProps = {
  game: GameDetailsPayload;
  className?: string;
};

type TrailerStatus = "idle" | "loading" | "loaded" | "empty" | "quota" | "error";

type TrailerDisplay = {
  source: "igdb" | "youtube";
  youtubeId: string;
  title: string;
  attribution: string;
};

function buildAttribution(source: GameTrailerSource["type"], channelTitle?: string): string {
  if (source === "igdb-clip" || source === "igdb-movie") {
    return "Provided by IGDB";
  }
  if (channelTitle) {
    return `YouTube • ${channelTitle}`;
  }
  return "YouTube";
}

function derivePlatformHint(game: GameDetailsPayload): string | undefined {
  const parent = game.parent_platforms?.find((entry) => entry?.platform?.name);
  if (parent?.platform?.name) {
    return parent.platform.name;
  }
  const platform = game.platforms?.find((entry) => entry?.platform?.name);
  return platform?.platform?.name ?? undefined;
}

export function GameTrailerSection({ game, className }: GameTrailerSectionProps) {
  const igdbSource = useMemo(() => extractTrailerFromIgdb(game), [game]);
  const [status, setStatus] = useState<TrailerStatus>(igdbSource.type === "none" ? "idle" : "loaded");
  const [display, setDisplay] = useState<TrailerDisplay | null>(() => {
    if (igdbSource.type === "none") {
      return null;
    }
    return {
      source: "igdb",
      youtubeId: igdbSource.youtubeId,
      title: igdbSource.title || `${game.name} trailer`,
      attribution: buildAttribution(igdbSource.type),
    } satisfies TrailerDisplay;
  });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (igdbSource.type === "none") {
      setDisplay(null);
      setStatus("idle");
      setErrorMessage(null);
      return;
    }
    setDisplay({
      source: "igdb",
      youtubeId: igdbSource.youtubeId,
      title: igdbSource.title || `${game.name} trailer`,
      attribution: buildAttribution(igdbSource.type),
    });
    setStatus("loaded");
    setErrorMessage(null);
  }, [game.name, igdbSource]);

  const handleYoutubeSearch = async () => {
    if (!game.name || status === "loading") {
      return;
    }
    setStatus("loading");
    setErrorMessage(null);
    try {
      const params = new URLSearchParams({ gameName: game.name });
      const platformHint = derivePlatformHint(game);
      if (platformHint) {
        params.set("platform", platformHint);
      }
      const response = await fetch(`/api/youtube/trailer?${params.toString()}`);
      const payload = (await response.json().catch(() => null)) as YoutubeSearchResult | null;
      if (!payload) {
        throw new Error("Invalid YouTube response");
      }
      if (payload.ok && payload.videos.length > 0) {
        const video = payload.videos[0];
        setDisplay({
          source: "youtube",
          youtubeId: video.id,
          title: video.title,
          attribution: buildAttribution("external", video.channelTitle),
        });
        setStatus("loaded");
        return;
      }
      if (!payload.ok) {
        if (payload.reason === "quota-exceeded") {
          setStatus("quota");
          setErrorMessage(payload.message ?? "YouTube quota exceeded");
          return;
        }
        if (payload.reason === "no-results") {
          setStatus("empty");
          setErrorMessage("No trailer found on YouTube.");
          return;
        }
        setStatus("error");
        setErrorMessage(payload.message ?? "Failed to load trailer.");
        return;
      }
      setStatus("empty");
      setErrorMessage("No trailer found on YouTube.");
    } catch (error) {
      console.error("Trailer search error", error);
      setStatus("error");
      setErrorMessage("Failed to load trailer. Please try again later.");
    }
  };

  const canSearchYoutube = igdbSource.type === "none";
  const headingId = `game-trailer-${game.id}`;

  if (!game.name) {
    return null;
  }

  return (
    <section className={`space-y-3 ${className ?? ""}`} aria-labelledby={headingId}>
      <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
        <Play className="h-4 w-4" aria-hidden="true" />
        <h2 id={headingId} className="text-sm font-semibold uppercase tracking-widest">
          Trailer & gameplay preview
        </h2>
      </div>
      {display ? (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-950/90 text-white shadow-lg dark:border-slate-800">
          <div className="aspect-video w-full bg-black">
            <iframe
              title={display.title}
              src={`https://www.youtube.com/embed/${display.youtubeId}`}
              allow={IFRAME_PERMISSIONS}
              allowFullScreen
              className="h-full w-full"
            />
          </div>
          <div className="space-y-1 px-4 py-3 text-sm">
            <p className="font-semibold text-white">{display.title}</p>
            <p className="text-xs uppercase tracking-wide text-slate-300">{display.attribution}</p>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white/70 p-6 text-center text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-300">
          <p className="font-medium">No official trailer was provided by IGDB.</p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Search YouTube on-demand to keep API usage low.</p>
          <div className="mt-4">
            <button
              type="button"
              onClick={handleYoutubeSearch}
              disabled={!canSearchYoutube || status === "loading"}
              className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {status === "loading" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
              {status === "loading" ? "Searching..." : "Search trailer on YouTube"}
            </button>
          </div>
          {status === "quota" ? (
            <p className="mt-2 text-xs text-amber-600 dark:text-amber-300">
              YouTube quota for today is exhausted. Trailer preview is temporarily unavailable.
            </p>
          ) : null}
          {status === "empty" ? (
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">No trailer found on YouTube.</p>
          ) : null}
          {status === "error" ? (
            <p className="mt-2 text-xs text-rose-600 dark:text-rose-300">{errorMessage}</p>
          ) : null}
        </div>
      )}
    </section>
  );
}
