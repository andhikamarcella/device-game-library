import { MetadataResult } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { ScreenshotCarousel } from "@/components/ScreenshotCarousel";

export function MetadataCard({ metadata }: { metadata: MetadataResult }) {
  const cover = metadata.media?.cover ?? metadata.media?.box ?? metadata.media?.logo;
  return (
    <div className="grid gap-6 md:grid-cols-[220px,1fr]">
      <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/80">
        {cover ? (
          <img src={cover} alt={`${metadata.title} cover`} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full min-h-[280px] items-center justify-center bg-slate-900 text-sm text-slate-500">
            No artwork available
          </div>
        )}
      </div>
      <div className="space-y-4">
        <div>
          <h3 className="text-2xl font-semibold text-white">{metadata.title}</h3>
          <p className="text-sm text-slate-400">{metadata.platform ?? metadata.platformShortName ?? "Unknown platform"}</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <InfoItem label="Region" value={metadata.region ?? "—"} />
          <InfoItem label="Release" value={formatDate(metadata.releaseDate)} />
          <InfoItem label="Publisher" value={metadata.publisher ?? "—"} />
          <InfoItem label="Developer" value={metadata.developer ?? "—"} />
          <InfoItem label="Genre" value={metadata.genre ?? (metadata.tags?.join(", ") ?? "—")} />
          <InfoItem label="CRC32" value={metadata.hashes?.crc ?? "—"} />
        </div>
        {metadata.synopsis ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 text-sm text-slate-300">
            {metadata.synopsis}
          </div>
        ) : null}
        {metadata.media?.screenshots?.length ? (
          <ScreenshotCarousel images={metadata.media.screenshots} />
        ) : null}
      </div>
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-widest text-slate-500">{label}</p>
      <p className="text-sm font-medium text-slate-200">{value}</p>
    </div>
  );
}
