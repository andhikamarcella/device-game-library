import { NextRequest, NextResponse } from "next/server";
import { buildMetadataFromFilename, parseScreenscraperResponse } from "@/lib/metadata";
import { MetadataResult } from "@/lib/types";

export const dynamic = "force-dynamic";

async function fetchFromScreenscraper(query: { filename?: string | null; crc?: string | null; platform?: string | null }) {
  const devId = process.env.SCREENSCRAPER_DEV_ID;
  const devPassword = process.env.SCREENSCRAPER_DEV_PASSWORD;
  if (!devId || !devPassword) {
    return { metadata: null as MetadataResult | null, warnings: ["Screenscraper credentials not configured"] };
  }

  const params = new URLSearchParams({
    devid: devId,
    devpassword: devPassword,
    softname: "DeviceGameLibraryTracker",
    output: "json",
  });

  if (query.filename) {
    params.set("romnom", query.filename);
  }
  if (query.crc) {
    params.set("crc", query.crc);
  }
  if (query.platform) {
    params.set("systemeid", query.platform);
  }

  const url = `https://www.screenscraper.fr/api2/jeuRecherche.php?${params.toString()}`;

  try {
    const response = await fetch(url, { headers: { "User-Agent": "DeviceGameLibraryTracker" } });
    if (!response.ok) {
      return {
        metadata: null,
        warnings: [`Screenscraper request failed: ${response.status}`],
      };
    }
    const data = await response.json();
    const metadata = parseScreenscraperResponse(data);
    if (!metadata) {
      return { metadata: null, warnings: ["No match found on Screenscraper"] };
    }
    return { metadata, warnings: [] };
  } catch (error) {
    console.error("Screenscraper fetch error", error);
    return { metadata: null, warnings: ["Screenscraper request error"] };
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const filename = searchParams.get("query");
  const crc = searchParams.get("crc");
  const platform = searchParams.get("platform");

  if (!filename && !crc) {
    return NextResponse.json({ error: "Provide a query filename or CRC value" }, { status: 400 });
  }

  let metadata: MetadataResult | null = null;
  const warnings: string[] = [];
  let source: "screenscraper" | "fallback" = "fallback";

  const result = await fetchFromScreenscraper({ filename, crc, platform });
  if (result.metadata) {
    metadata = result.metadata;
    source = "screenscraper";
  }
  warnings.push(...result.warnings);

  if (!metadata && filename) {
    metadata = buildMetadataFromFilename(filename);
  }

  if (!metadata) {
    return NextResponse.json(
      {
        success: false,
        metadata: null,
        warnings: warnings.concat("No metadata could be generated"),
        demoMode: !process.env.SCREENSCRAPER_DEV_ID,
      },
      { status: 404 },
    );
  }

  if (filename && !metadata.rom?.fileName) {
    metadata = {
      ...metadata,
      rom: {
        ...(metadata.rom ?? {}),
        fileName: filename,
      },
    };
  }

  if (crc && metadata.hashes && !metadata.hashes.crc) {
    metadata = {
      ...metadata,
      hashes: {
        ...metadata.hashes,
        crc,
      },
    };
  }

  return NextResponse.json({
    success: true,
    source,
    metadata,
    warnings,
    demoMode: !process.env.SCREENSCRAPER_DEV_ID,
  });
}
