"use client";

import { useRouter } from "next/navigation";
import { ArrowRightCircle } from "lucide-react";
import { MetadataResult } from "@/lib/types";
import { useGameStore } from "@/hooks/useGameStore";

export function MetadataApplyButton({ metadata }: { metadata: MetadataResult }) {
  const router = useRouter();
  const { setDraftGame } = useGameStore();

  const handleApply = () => {
    setDraftGame({
      title: metadata.title,
      platformId: metadata.platformId ?? "",
      platformName: metadata.platform ?? metadata.platformShortName ?? "",
      region: metadata.region,
      status: "backlog",
      format: "rom",
      tags: metadata.genre ? [metadata.genre.toLowerCase()] : metadata.tags ?? [],
      notes: metadata.synopsis,
      fileName: metadata.rom?.fileName,
      folderPath: metadata.rom?.fileExtension,
      favorite: false,
    });
    router.push("/games");
  };

  return (
    <button
      type="button"
      onClick={handleApply}
      className="inline-flex items-center gap-2 rounded-xl border border-emerald-500/60 bg-emerald-500/20 px-4 py-2 text-sm font-semibold text-emerald-200 transition hover:border-emerald-400 hover:text-white"
    >
      <ArrowRightCircle className="h-4 w-4" /> Use metadata to add game
    </button>
  );
}
