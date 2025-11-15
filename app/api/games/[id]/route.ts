import { NextResponse } from "next/server";
import { getGameDetails, getGameScreenshots, getGameReviews } from "@/lib/rawg";

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const id = Number.parseInt(params.id, 10);

  if (!Number.isFinite(id)) {
    return NextResponse.json({ error: "Invalid game id." }, { status: 400 });
  }

  try {
    const [details, screenshots, reviews] = await Promise.all([
      getGameDetails(id),
      getGameScreenshots(id, 1, 12),
      getGameReviews(id, 1, 6),
    ]);

    const screenshotMap = new Map<string, { id: number; image: string; width?: number; height?: number }>();
    details.short_screenshots?.forEach((shot) => {
      if (shot?.image) {
        screenshotMap.set(shot.image, shot);
      }
    });
    screenshots.forEach((shot) => {
      if (shot?.image) {
        screenshotMap.set(shot.image, shot);
      }
    });

    const gallery = Array.from(screenshotMap.values()).map((shot) => ({
      id: shot.id,
      url: shot.image,
      width: shot.width ?? null,
      height: shot.height ?? null,
    }));

    const cleanedReviews = reviews
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
      .filter((review): review is NonNullable<typeof review> => Boolean(review));

    const response = {
      id: details.id,
      name: details.name,
      description: details.description_raw ?? details.description ?? "",
      backgroundImage: details.background_image_additional ?? details.background_image,
      thumbnail: details.background_image ?? details.background_image_additional ?? gallery[0]?.url ?? null,
      released: details.released,
      rating: details.rating,
      ratingsCount: details.ratings_count,
      website: details.website ?? null,
      genres: details.genres?.map((genre) => genre.name) ?? [],
      platforms: details.platforms?.map((entry) => entry.platform.name) ?? [],
      developers: details.developers?.map((developer) => developer.name) ?? [],
      publishers: details.publishers?.map((publisher) => publisher.name) ?? [],
      gallery,
      reviews: cleanedReviews,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("RAWG detail error", error);
    const message = error instanceof Error ? error.message : "Unable to load game details.";
    const status = message.includes("404") ? 404 : 500;
    return NextResponse.json({ error: status === 404 ? "Game not found." : message }, { status });
  }
}
