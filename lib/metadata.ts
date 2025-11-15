import { MetadataResult } from "@/lib/types";
import { extractPlatformFromFilename, extractRegion, humanizePlatform, normalizeFilename } from "@/lib/utils";

export function buildMetadataFromFilename(filename: string): MetadataResult {
  const normalized = normalizeFilename(filename);
  const region = extractRegion(filename);
  const platform = extractPlatformFromFilename(filename);
  const title = normalized.replace(/\[(.*?)\]/g, "").replace(/\((.*?)\)/g, "").trim();

  return {
    title: title || filename,
    normalizedTitle: title,
    platform,
    platformShortName: platform ? humanizePlatform(platform) : undefined,
    region,
    media: {},
    tags: [],
    hashes: {},
    rom: {
      fileName: filename,
      fileExtension: filename.split(".").pop(),
    },
  } as MetadataResult;
}

export function parseScreenscraperResponse(data: any): MetadataResult | null {
  if (!data?.response?.jeu) return null;
  const game = Array.isArray(data.response.jeu) ? data.response.jeu[0] : data.response.jeu;
  if (!game) return null;
  const rom = game.rom?.[0] ?? game.rom;
  const media = Array.isArray(game.medias?.media) ? game.medias.media : [];
  const getMedia = (type: string) => media.find((item: any) => item.type === type)?.url;

  return {
    title: game.nom ?? game.nom_us ?? game.titre ?? game?.infos?.nom ?? "",
    normalizedTitle: game.nom ?? game.nom_us ?? "",
    platform: game?.systeme?.nom,
    platformId: game?.systemeid,
    platformShortName: game?.systeme?.shortname,
    region: game?.regions?.region ?? rom?.region ?? undefined,
    releaseDate: game?.dates?.date_us ?? game?.dates?.date_eu ?? game?.dates?.date_jp,
    publisher: game?.infos?.editeur,
    developer: game?.infos?.developpeur,
    genre: game?.genres?.genre?.[0]?.nom ?? game?.genres?.genre?.nom,
    synopsis: game?.synopsis ?? game?.synopsis_en ?? game?.synopsis_us,
    media: {
      cover: getMedia("box-2D") ?? getMedia("box-2D-us") ?? getMedia("box-2D-eu"),
      screenshots: media.filter((item: any) => item.type === "ss").map((item: any) => item.url),
      logo: getMedia("logo"),
      box: getMedia("box-3D"),
    },
    hashes: {
      crc: rom?.crc,
      md5: rom?.md5,
      sha1: rom?.sha1,
    },
    rom: {
      fileName: rom?.nom ?? rom?.romfilename,
      fileExtension: rom?.romextension,
    },
  };
}
