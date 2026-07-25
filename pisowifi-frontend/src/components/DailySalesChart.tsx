import { useEffect, useRef, useState } from "react";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { api, type SalesSummary, type SalesPoint } from "../api/client";
import { useApi } from "../hooks/useApi";

type Range = "daily" | "weekly" | "monthly";
const RANGES: { value: Range; label: string; chart: "bar" | "area" }[] = [
  { value: "daily", label: "Daily", chart: "area" },
  { value: "weekly", label: "Weekly", chart: "bar" },
  { value: "monthly", label: "Monthly", chart: "area" },
];

// Pixels per point when scrolling. 0 = fill container (weekly's 7 points fit).
const PX_PER_POINT: Record<Range, number> = { daily: 46, weekly: 0, monthly: 44 };

const peso = (n: number) =>
  new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP", maximumFractionDigits: 0 }).format(n);

function ChartTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const p: SalesPoint = payload[0].payload;
  return (
    <div className="rounded-lg border border-navy-600 bg-navy-900 px-3 py-2">
      <p className="text-xs text-content-secondary">{p.label}</p>
      <p className="mt-0.5 font-semibold text-accent-cyan">{peso(p.pesos)}</p>
      <p className="text-xs text-content-muted">{p.vouchers} vouchers</p>
    </div>
  );
}

export default function DailySalesChart() {
  const [range, setRange] = useState<Range>("weekly");
  const meta = RANGES.find((r) => r.value === range)!;
  const { data, loading, error } = useApi<SalesSummary>(() => api.sales(range), [range], 15_000);
  const scrollRef = useRef<HTMLDivElement>(null);

  const points = data?.points ?? [];
  const total = data?.totalPesos ?? 0;
  const title = { daily: "Today's sales", weekly: "Last 7 days", monthly: "Last 30 days" }[range];

  const basePx = PX_PER_POINT[range];
  const scrollable = basePx > 0;
  const width = scrollable ? points.length * basePx : undefined;

  // On dense views, scroll to the right edge (most recent / current) on load.
  useEffect(() => {
    if (scrollable && scrollRef.current) {
      scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
    }
  }, [scrollable, points.length, range]);

  const axes = (
    <>
      <CartesianGrid stroke="#2A3568" vertical={false} />
      <XAxis dataKey="label" tick={{ fill: "#6B7A99", fontSize: 11 }} axisLine={false} tickLine={false} interval={0} minTickGap={4} />
      <YAxis tick={{ fill: "#6B7A99", fontSize: 11 }} axisLine={false} tickLine={false} width={56} tickFormatter={(v) => `₱${v}`} />
      <Tooltip content={<ChartTooltip />} cursor={{ fill: "#ffffff08" }} />
    </>
  );

  return (
    <section className="rounded-xl bg-navy-800 p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="flex items-center gap-2 text-sm font-medium">
            <span className="h-2 w-2 rounded-full bg-accent-cyan" aria-hidden="true" />
            {title}
          </h2>
          <p className="mt-1 text-2xl font-semibold tracking-tight">{peso(total)}</p>
        </div>
        <select
          value={range}
          onChange={(e) => setRange(e.target.value as Range)}
          aria-label="Date range"
          className="rounded-lg bg-navy-700 px-3 py-1.5 text-xs outline-none focus:ring-2 focus:ring-accent-cyan/50"
        >
          {RANGES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center text-sm text-content-muted">Loading…</div>
      ) : error ? (
        <div className="flex h-64 items-center justify-center text-sm text-accent-red">{error}</div>
      ) : total === 0 ? (
        <div className="flex h-64 flex-col items-center justify-center gap-1">
          <p className="text-sm font-medium text-content-secondary">No sales yet</p>
          <p className="text-xs text-content-muted">Insert a coin to see it here.</p>
        </div>
      ) : (
        <>
          <div ref={scrollRef} className={`scrollbar-thin mt-5 h-64 ${scrollable ? "overflow-x-auto overflow-y-hidden" : ""}`}>
            <div style={{ width, minWidth: "100%", height: "100%" }}>
              <ResponsiveContainer width="100%" height="100%">
                {meta.chart === "bar" ? (
                  <BarChart data={points} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                    {axes}
                    <Bar dataKey="pesos" radius={[4, 4, 0, 0]}>
                      {points.map((p, i) => <Cell key={i} fill={p.isCurrent ? "#5EEAD4" : "#2DD4BF"} />)}
                    </Bar>
                  </BarChart>
                ) : (
                  <AreaChart data={points} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                    <defs>
                      <linearGradient id="fill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#2DD4BF" stopOpacity={0.35} />
                        <stop offset="100%" stopColor="#2DD4BF" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    {axes}
                    <Area type="monotone" dataKey="pesos" stroke="#2DD4BF" strokeWidth={2} fill="url(#fill)" />
                  </AreaChart>
                )}
              </ResponsiveContainer>
            </div>
          </div>
          {scrollable && (
            <p className="mt-2 text-xs text-content-muted">Scroll sideways to see the full day</p>
          )}
        </>
      )}
    </section>
  );
}