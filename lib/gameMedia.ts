import type { GameClip, GameDetailsPayload, GameTrailer } from "@/lib/gameData";

export type GameTrailerSource =
  | { type: "igdb-clip"; title: string; youtubeId: string; thumbnailUrl: string }
  | { type: "igdb-movie"; title: string; youtubeId: string; thumbnailUrl: string }
  | { type: "external"; title: string; youtubeId: string; thumbnailUrl: string }
  | { type: "none" };

function hasYoutubeId(source: GameTrailerSource): source is Extract<GameTrailerSource, { youtubeId: string }> {
  return "youtubeId" in source && typeof source.youtubeId === "string" && !!source.youtubeId;
}

const YOUTUBE_ID_PATTERNS = [
  /youtu\.be\/([^?&#/]+)/i,
  /youtube\.com\/(?:watch\?.*v=|embed\/|v\/)([^?&#/]+)/i,
  /youtube\.com\/shorts\/([^?&#/]+)/i,
  /i\.ytimg\.com\/vi\/([^/]+)/i,
  /img\.youtube\.com\/vi\/([^/]+)/i,
];

function extractYoutubeId(url: string | null | undefined): string | null {
  if (!url) {
    return null;
  }
  const trimmed = url.trim();
  if (!trimmed) {
    return null;
  }

  try {
    const parsed = new URL(trimmed.startsWith("http") ? trimmed : `https:${trimmed}`);
    const host = parsed.hostname.toLowerCase();
    if (host.includes("youtube.com") || host.includes("youtu.be")) {
      const idFromQuery = parsed.searchParams.get("v");
      if (idFromQuery) {
        return idFromQuery;
      }
      const pathnameMatch = YOUTUBE_ID_PATTERNS.find((pattern) => {
        const result = parsed.href.match(pattern);
        if (result && result[1]) {
          return true;
        }
        return false;
      });
      if (pathnameMatch) {
        const match = parsed.href.match(pathnameMatch);
        if (match && match[1]) {
          return match[1];
        }
      }
      const fallback = parsed.pathname.split("/").filter(Boolean).pop();
      if (fallback) {
        return fallback;
      }
    }
    if (host.includes("ytimg.com") || host.includes("img.youtube.com")) {
      for (const pattern of YOUTUBE_ID_PATTERNS) {
        const match = parsed.href.match(pattern);
        if (match && match[1]) {
          return match[1];
        }
      }
    }
  } catch (error) {
    for (const pattern of YOUTUBE_ID_PATTERNS) {
      const match = trimmed.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }
  }

  return null;
}

function buildThumbnailUrl(youtubeId: string, fallback?: string | null): string {
  if (fallback && fallback.trim()) {
    return fallback;
  }
  return `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`;
}

function collectClipSources(clip: GameClip | null | undefined, title: string): GameTrailerSource | null {
  if (!clip) {
    return null;
  }
  const possibleUrls = [clip.video, clip.clip, ...(clip.clips ? Object.values(clip.clips) : [])];
  for (const url of possibleUrls) {
    const youtubeId = extractYoutubeId(url);
    if (youtubeId) {
      return {
        type: "igdb-clip",
        title,
        youtubeId,
        thumbnailUrl: buildThumbnailUrl(youtubeId, clip.preview ?? undefined),
      } satisfies GameTrailerSource;
    }
  }
  return null;
}

function collectMovieSources(movies: GameTrailer[] | null | undefined, title: string): GameTrailerSource | null {
  if (!movies || movies.length === 0) {
    return null;
  }
  for (const movie of movies) {
    const clipTitle = movie.name || title;
    const preview = (movie as { preview?: string | null }).preview;
    const youtubeId = extractYoutubeId(movie.video_id) ?? movie.video_id;
    if (youtubeId) {
      return {
        type: "igdb-movie",
        title: clipTitle,
        youtubeId,
        thumbnailUrl: buildThumbnailUrl(youtubeId, preview ?? undefined),
      } satisfies GameTrailerSource;
    }
  }
  return null;
}

function collectAllMovieSources(
  movies: GameTrailer[] | null | undefined,
  title: string,
): GameTrailerSource[] {
  if (!movies || movies.length === 0) {
    return [];
  }

  const sources: GameTrailerSource[] = [];
  movies.forEach((movie, index) => {
    const clipTitle = movie.name || `${title || "Trailer"} ${index + 1}`;
    const preview = (movie as { preview?: string | null }).preview;
    const youtubeId = extractYoutubeId(movie.video_id) ?? movie.video_id;
    if (youtubeId) {
      sources.push({
        type: "igdb-movie",
        title: clipTitle,
        youtubeId,
        thumbnailUrl: buildThumbnailUrl(youtubeId, preview ?? undefined),
      });
    }
  });

  return sources;
}

export function extractTrailerFromIgdb(game: GameDetailsPayload): GameTrailerSource {
  const title = game.name || "";
  const clipSource = collectClipSources(game.clip, title);
  if (clipSource) {
    return clipSource;
  }

  const movieSource = collectMovieSources(game.movies, title);
  if (movieSource) {
    return movieSource;
  }

  return { type: "none" };
}

export function collectIgdbVideos(game: GameDetailsPayload): GameTrailerSource[] {
  const title = game.name || "";
  const sources: GameTrailerSource[] = [];

  const clipSource = collectClipSources(game.clip, title);
  if (clipSource) {
    sources.push(clipSource);
  }

  const movieSources = collectAllMovieSources(game.movies, title);
  if (movieSources.length) {
    const seen = new Set<string>(sources.filter(hasYoutubeId).map((entry) => entry.youtubeId));
    for (const movie of movieSources) {
      if (hasYoutubeId(movie) && !seen.has(movie.youtubeId)) {
        sources.push(movie);
        seen.add(movie.youtubeId);
      }
    }
  }

  return sources.filter(hasYoutubeId);
}
