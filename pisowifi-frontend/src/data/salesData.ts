export type Range = "daily" | "weekly" | "monthly";

export interface SalesPoint {
  label: string;
  pesos: number;
  vouchers: number;
  /** true for the bucket representing "now" — current hour or today */
  isCurrent?: boolean;
}

export const RANGE_META: Record<Range, { option: string; title: string; chart: "bar" | "area" }> = {
  daily:   { option: "Daily",   title: "Today's sales", chart: "area" },
  weekly:  { option: "Weekly",  title: "Last 7 days",   chart: "bar" },
  monthly: { option: "Monthly", title: "Last 30 days",  chart: "area" },
};

/* ---------------------------------------------------------------------------
   Mock generators. Delete this whole block once the API is wired — the shape
   returned here matches GET /api/stats/sales exactly.
--------------------------------------------------------------------------- */

// Deterministic pseudo-random so the chart doesn't reshuffle on every render.
function seeded(n: number): number {
  const x = Math.sin(n * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

/** Piso wifi traffic is bimodal: a lunch bump and a big evening peak. */
function hourWeight(h: number): number {
  if (h < 6) return 0.05;
  if (h < 11) return 0.3;
  if (h < 14) return 0.75;
  if (h < 17) return 0.5;
  if (h < 22) return 1.0;
  return 0.35;
}

function hourly(): SalesPoint[] {
  const now = new Date().getHours();
  return Array.from({ length: 24 }, (_, h) => {
    const past = h <= now;
    const pesos = past ? Math.round(hourWeight(h) * (60 + seeded(h) * 90)) : 0;
    return {
      label: `${String(h).padStart(2, "0")}:00`,
      pesos,
      vouchers: Math.round(pesos / 5),
      isCurrent: h === now,
    };
  });
}

function daily(days: number): SalesPoint[] {
  const out: SalesPoint[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const weekendBoost = d.getDay() === 0 || d.getDay() === 6 ? 1.25 : 1;
    const pesos = Math.round((900 + seeded(d.getDate() + days) * 1400) * weekendBoost);
    out.push({
      label:
        days <= 7
          ? d.toLocaleDateString("en-PH", { weekday: "short" })
          : d.toLocaleDateString("en-PH", { month: "short", day: "numeric" }),
      pesos,
      vouchers: Math.round(pesos / 5),
      isCurrent: i === 0,
    });
  }
  return out;
}

export function getSales(range: Range): SalesPoint[] {
  if (range === "daily") return hourly();
  if (range === "weekly") return daily(7);
  return daily(30);
}

export const peso = (n: number) =>
  new Intl.NumberFormat("en-PH", {
    style: "currency", currency: "PHP", maximumFractionDigits: 0,
  }).format(n);