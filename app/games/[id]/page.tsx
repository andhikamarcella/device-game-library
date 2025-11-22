import { notFound } from "next/navigation";
import { GameDetails, type GameReview } from "@/components/GameDetails";
import {
  getGameAdditions,
  getGameDetails,
  getGameReviews,
  getGameScreenshots,
  getGameTrailers,
  getSimilarGamesForGame,
  getGameAchievements,
  getGameSeriesEntries,
  type RawgAchievement,
  type RawgGameDetails,
  type RawgMovie,
  type RawgRelatedGame,
  type RawgScreenshot,
  type RawgSimilarGame,
} from "@/lib/rawg";

export const revalidate = 300;

type GameDetailPageProps = {
  params: { id: string };
  searchParams?: Record<string, string | string[] | undefined>;
};


const getSingleParamValue = (value: string | string[] | undefined): string | null => {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }
  return typeof value === "string" ? value : null;
};

export default async function GameDetailPage({ params, searchParams }: GameDetailPageProps) {
  const id = Number.parseInt(params.id, 10);

  if (!Number.isFinite(id)) {
    notFound();
  }

  let game: RawgGameDetails;

  try {
    game = await getGameDetails(id);
  } catch (error) {
    if (error instanceof Error && /404/.test(error.message)) {
      notFound();
    }
    throw error;
  }

  const screenshotsPromise = getGameScreenshots(id, 1, 12).catch(
    () => [] as Awaited<ReturnType<typeof getGameScreenshots>>,
  );
  const reviewsPromise = getGameReviews(id, 1, 6).catch(
    () => [] as Awaited<ReturnType<typeof getGameReviews>>,
  );
  const trailersPromise = getGameTrailers(id).catch(() => [] as RawgMovie[]);
  const similarPromise = getSimilarGamesForGame(id).catch(() => [] as RawgSimilarGame[]);
  const achievementsPromise = getGameAchievements(id, 20).catch(() => [] as RawgAchievement[]);
  const additionsPromise = getGameAdditions(id, 12).catch(() => [] as RawgRelatedGame[]);
  const seriesPromise = getGameSeriesEntries(id, 12).catch(() => [] as RawgRelatedGame[]);
  const [screenshots, reviews, trailers, similarGames, achievements, additions, seriesEntries] = await Promise.all([
    screenshotsPromise,
    reviewsPromise,
    trailersPromise,
    similarPromise,
    achievementsPromise,
    additionsPromise,
    seriesPromise,
  ]);

  const screenshotMap = new Map<string, { id: number; image: string; width?: number; height?: number }>();
  game.short_screenshots?.forEach((shot) => {
    if (shot?.image) {
      screenshotMap.set(shot.image, shot);
    }
  });
  screenshots.forEach((shot) => {
    if (shot?.image) {
      screenshotMap.set(shot.image, shot);
    }
  });

  const gallery: RawgScreenshot[] = Array.from(screenshotMap.values());

  const cleanedReviews: GameReview[] = reviews
    .map((review) => {
      const rawText = review.text ?? "";
      const text = rawText.replace(/<[^>]+>/g, "").trim();
      if (!text) return null;
      const parsedRating =
        typeof review.rating === "number"
          ? review.rating
          : typeof review.rating === "string"
            ? Number.parseFloat(review.rating)
            : NaN;
      return {
        id: review.id,
        text,
        rating: Number.isFinite(parsedRating) ? parsedRating : null,
        createdAt: review.created ?? null,
        author: review.user?.username ?? "RAWG user",
      };
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item))
    .sort((a, b) => {
      const aDate = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bDate = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bDate - aDate;
    })
    .slice(0, 3);

  const backParams = new URLSearchParams();
  const qParam = getSingleParamValue(searchParams?.q)?.trim();
  const platformParam = getSingleParamValue(searchParams?.platform)?.trim();
  const pageParam = getSingleParamValue(searchParams?.page)?.trim();
  const returnToParam = getSingleParamValue(searchParams?.returnTo)?.trim();

  const sanitizedReturnTo = returnToParam && returnToParam.startsWith("/") ? returnToParam : null;

  if (qParam) {
    backParams.set("q", qParam);
  }
  if (platformParam) {
    backParams.set("platform", platformParam);
  }
  if (pageParam) {
    const parsedPage = Number.parseInt(pageParam, 10);
    if (Number.isFinite(parsedPage) && parsedPage > 0) {
      backParams.set("page", String(parsedPage));
    }
  }

  const backHref = sanitizedReturnTo ?? (backParams.size > 0 ? `/?${backParams.toString()}` : "/");
  const backLabel = sanitizedReturnTo?.startsWith("/library") ? "Back to library" : "Back to search";

  return (
    <GameDetails
      game={game}
      backLink={{ href: backHref, label: backLabel }}
      screenshots={gallery}
      reviews={cleanedReviews}
      trailers={trailers}
      similarGames={similarGames}
      achievements={achievements}
      additions={additions}
      series={seriesEntries}
    />
  );
}
