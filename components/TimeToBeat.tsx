export type TimeToBeatResponse = {
  main: number | null;
  extra: number | null;
  complete: number | null;
};

const buildBaseUrl = () => {
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  if (process.env.SITE_URL) return process.env.SITE_URL;
  return "http://localhost:3000";
};

const formatHours = (value: number | null) => {
  if (typeof value !== "number" || Number.isNaN(value) || value <= 0) return "—";
  const hours = Math.floor(value);
  const minutes = Math.round((value - hours) * 60);
  if (hours && minutes) return `${hours}h ${minutes}m`;
  if (hours) return `${hours}h`;
  return `${minutes}m`;
};

async function fetchTimeToBeat(title: string): Promise<TimeToBeatResponse | null> {
  try {
    const response = await fetch(`${buildBaseUrl()}/api/rawg/ttb`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
      next: { revalidate: 60 * 60 },
    });

    if (!response.ok) {
      console.warn("RAWG TTB API returned", response.status);
      return null;
    }

    const data = (await response.json()) as TimeToBeatResponse | { error?: string };

    if ("error" in data) {
      return {
        main: null,
        extra: null,
        complete: null,
      };
    }

    return {
      main: data.main ?? null,
      extra: data.extra ?? null,
      complete: data.complete ?? null,
    };
  } catch (error) {
    console.warn("RAWG TTB fetch failed", error);
    return null;
  }
}

type TimeToBeatProps = {
  title?: string | null;
};

export async function TimeToBeat({ title }: TimeToBeatProps) {
  const safeTitle = title?.trim();
  if (!safeTitle) return null;

  const ttb = await fetchTimeToBeat(safeTitle);
  if (!ttb) return null;

  const rows: Array<{ label: string; value: number | null }> = [
    { label: "Main Story", value: ttb.main },
    { label: "Main + Extra", value: ttb.extra },
    { label: "Completionist", value: ttb.complete },
  ];

  const hasData = rows.some((row) => row.value !== null);
  if (!hasData) return null;

  return (
    <section className="space-y-3 rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
      <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-600 dark:text-slate-400">Time To Beat</h2>
      <div className="divide-y divide-slate-200 text-sm text-slate-800 dark:divide-slate-800 dark:text-slate-100">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between py-2 first:pt-0 last:pb-0">
            <span className="text-slate-600 dark:text-slate-300">{row.label}</span>
            <span className="font-semibold text-slate-900 dark:text-white">
              {formatHours(row.value)}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

export default TimeToBeat;
