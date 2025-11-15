"use client";

import { FormEvent, useMemo, useState } from "react";
import { Search, Upload, Info } from "lucide-react";
import { Card } from "@/components/Card";
import { MetadataCard } from "@/components/MetadataCard";
import { MetadataSkeleton } from "@/components/MetadataSkeleton";
import { MetadataApplyButton } from "@/components/MetadataApplyButton";
import { MetadataResult } from "@/lib/types";
import { extractPlatformFromFilename, extractRegion, normalizeFilename } from "@/lib/utils";

function crc32(buffer: ArrayBuffer): string {
  const table = new Uint32Array(256).map((_, index) => {
    let c = index;
    for (let k = 0; k < 8; k += 1) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    return c >>> 0;
  });
  let crc = 0 ^ -1;
  const data = new Uint8Array(buffer);
  for (let i = 0; i < data.length; i += 1) {
    crc = (crc >>> 8) ^ table[(crc ^ data[i]) & 0xff];
  }
  return ((crc ^ -1) >>> 0).toString(16).toUpperCase().padStart(8, "0");
}

export default function MetadataPage() {
  const [filename, setFilename] = useState("");
  const [crc, setCrc] = useState("");
  const [platform, setPlatform] = useState("");
  const [loading, setLoading] = useState(false);
  const [metadata, setMetadata] = useState<MetadataResult | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [demoMode, setDemoMode] = useState(false);

  const suggestions = useMemo(() => {
    return {
      normalizedTitle: filename ? normalizeFilename(filename) : "",
      region: filename ? extractRegion(filename) : undefined,
      platform: filename ? extractPlatformFromFilename(filename) : undefined,
    };
  }, [filename]);

  const handleFileUpload = async (file: File) => {
    if (file.size > 12 * 1024 * 1024) {
      setError("File too large. Please upload a file under 12MB.");
      return;
    }
    setError(null);
    setFilename(file.name);
    try {
      const buffer = await file.arrayBuffer();
      const hash = crc32(buffer);
      setCrc(hash);
    } catch (err) {
      console.error(err);
      setError("Failed to compute CRC32 hash.");
    }
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!filename && !crc) {
      setError("Enter a filename or CRC value to search.");
      return;
    }
    setLoading(true);
    setMetadata(null);
    setError(null);
    setWarnings([]);
    try {
      const params = new URLSearchParams();
      if (filename) params.set("query", filename);
      if (crc) params.set("crc", crc);
      if (platform) params.set("platform", platform);
      const response = await fetch(`/api/rom/identify?${params.toString()}`);
      const json = await response.json();
      if (!response.ok || !json.success) {
        setError(json.error ?? "No metadata found for this ROM.");
        setWarnings(json.warnings ?? []);
        setDemoMode(Boolean(json.demoMode));
      } else {
        setMetadata(json.metadata as MetadataResult);
        setWarnings(json.warnings ?? []);
        setDemoMode(Boolean(json.demoMode));
      }
    } catch (err) {
      console.error(err);
      setError("Unexpected error fetching metadata.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-white">ROM metadata fetcher</h2>
        <p className="text-sm text-slate-400">Identify ROM information via Screenscraper or filename heuristics.</p>
      </div>

      <Card
        title="Lookup"
        description="Provide a filename, CRC, or upload a ROM to detect metadata."
        action={demoMode ? <span className="text-xs text-amber-300">Screenscraper demo mode</span> : null}
      >
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-1 text-sm text-slate-200">
              Filename
              <input
                value={filename}
                onChange={(event) => setFilename(event.target.value)}
                placeholder="Pokemon FireRed (USA).gba"
                className="w-full rounded-xl border border-slate-800 bg-slate-900 px-4 py-2 text-sm text-slate-100 focus:border-emerald-500 focus:outline-none"
              />
            </label>
            <label className="space-y-1 text-sm text-slate-200">
              CRC32
              <input
                value={crc}
                onChange={(event) => setCrc(event.target.value.toUpperCase())}
                placeholder="AB12CD34"
                className="w-full rounded-xl border border-slate-800 bg-slate-900 px-4 py-2 text-sm text-slate-100 focus:border-emerald-500 focus:outline-none"
              />
            </label>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-1 text-sm text-slate-200">
              Platform override (Screenscraper system ID)
              <input
                value={platform}
                onChange={(event) => setPlatform(event.target.value)}
                placeholder="22 (Game Boy Advance)"
                className="w-full rounded-xl border border-slate-800 bg-slate-900 px-4 py-2 text-sm text-slate-100 focus:border-emerald-500 focus:outline-none"
              />
            </label>
            <label className="flex cursor-pointer flex-col gap-2 text-sm text-slate-200">
              Upload ROM (optional)
              <span className="inline-flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900 px-4 py-2 text-sm text-slate-200 transition hover:border-emerald-400 hover:text-white">
                <Upload className="h-4 w-4" /> Choose file
              </span>
              <input
                type="file"
                accept=".gba,.gbc,.gb,.nes,.sfc,.smc,.zip,.7z,.bin,.iso,.cia,.nds,.3ds,.z64,.chd"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) {
                    handleFileUpload(file);
                  }
                }}
              />
            </label>
          </div>
          {filename ? (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 text-sm text-slate-300">
              <p className="flex items-center gap-2 text-slate-200">
                <Info className="h-4 w-4 text-emerald-300" /> Quick hints
              </p>
              <div className="mt-2 grid gap-3 sm:grid-cols-3">
                <div>
                  <p className="text-xs uppercase tracking-widest text-slate-500">Normalized title</p>
                  <p className="text-sm font-medium text-slate-200">{suggestions.normalizedTitle}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-widest text-slate-500">Detected region</p>
                  <p className="text-sm font-medium text-slate-200">{suggestions.region ?? "—"}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-widest text-slate-500">Guessed platform</p>
                  <p className="text-sm font-medium text-slate-200">{suggestions.platform ?? "—"}</p>
                </div>
              </div>
            </div>
          ) : null}
          <div className="flex items-center gap-3">
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-xl border border-emerald-500/50 bg-emerald-500/20 px-4 py-2 text-sm font-semibold text-emerald-200 transition hover:border-emerald-400 hover:text-white"
            >
              <Search className="h-4 w-4" /> Fetch metadata
            </button>
            {loading ? <span className="text-sm text-slate-400">Searching...</span> : null}
          </div>
        </form>
        {error ? <p className="mt-4 text-sm text-rose-300">{error}</p> : null}
        {warnings.length ? (
          <ul className="mt-3 list-disc space-y-1 pl-5 text-xs text-amber-300">
            {warnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        ) : null}
      </Card>

      {loading ? <MetadataSkeleton /> : null}

      {!loading && metadata ? (
        <Card
          title="Metadata preview"
          description="Review details fetched from external services before applying to your library."
          action={<MetadataApplyButton metadata={metadata} />}
        >
          <MetadataCard metadata={metadata} />
        </Card>
      ) : null}
    </div>
  );
}
