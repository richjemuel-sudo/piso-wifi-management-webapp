import { useEffect, useMemo, useRef, useState } from "react";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell,
  ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { RotateCcw } from "lucide-react";
import { getSales, peso, RANGE_META, type Range, type SalesPoint } from "../data/salesData";

/** Horizontal pixels per data point at 100% zoom. Below this, labels collide. */
const BASE_PX_PER_POINT: Record<Range, number> = {
  daily: 48,    // 24 hours → ~1150px, scrolls on most screens
  weekly: 0,    // 7 bars fit comfortably; 0 means "fill the container"
  monthly: 44,  // 30 days → ~1320px
};

const ZOOM_MIN = 0.6;
const ZOOM_MAX = 3;

function ChartTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const p: SalesPoint = payload[0].payload;
  return (
    <div className="rounded-lg border border-navy-600 bg-navy-900 px-3 py-2 shadow-xl">
      <p className="text-xs text-content-secondary">{p.label}</p>
      <p className="mt-0.5 font-semibold text-accent-cyan">{peso(p.pesos)}</p>
      <p className="text-xs text-content-muted">
        {p.vouchers} voucher{p.vouchers === 1 ? "" : "s"}
      </p>
    </div>
  );
}

export default function DailySalesChart() {
  const [range, setRange] = useState<Range>("weekly");
  const [zoom, setZoom] = useState(1);
  const scrollRef = useRef<HTMLDivElement>(null);

  const data = useMemo(() => getSales(range), [range]);
  const meta = RANGE_META[range];

  const total = data.reduce((s, p) => s + p.pesos, 0);
  const currentLabel = data.find((p) => p.isCurrent)?.label;

  const basePx = BASE_PX_PER_POINT[range];
  const scrollable = basePx > 0;
  const chartWidth = scrollable ? Math.round(data.length * basePx * zoom) : undefined;

  // Reset zoom whenever the range changes — a 3x zoom on Weekly makes no sense.
  useEffect(() => setZoom(1), [range]);

  /**
   * Ctrl+wheel to zoom. This needs a manual listener because React attaches
   * wheel handlers passively, and a passive listener can't preventDefault —
   * without which the browser would zoom the whole page instead.
   */
  useEffect(() => {
    const el = scrollRef.current;
    if (!el || !scrollable) return;

    function onWheel(e: WheelEvent) {
      if (!e.ctrlKey) return; // plain scroll stays plain scroll
      e.preventDefault();

      const before = el!.scrollLeft + e.clientX - el!.getBoundingClientRect().left;

      setZoom((z) => {
        const next = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, z * (e.deltaY < 0 ? 1.15 : 0.87)));
        // Keep the point under the cursor roughly in place while zooming.
        requestAnimationFrame(() => {
          if (el) el.scrollLeft = (before / z) * next - (e.clientX - el.getBoundingClientRect().left);
        });
        return next;
      });
    }

    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [scrollable]);

  const axes = (
    <>
      <CartesianGrid stroke="#2A3568" vertical={false} />
      <XAxis
        dataKey="label"
        tick={{ fill: "#6B7A99", fontSize: 11 }}
        axisLine={false}
        tickLine={false}
        interval={0}
        minTickGap={4}
      />
      <YAxis
        tick={{ fill: "#6B7A99", fontSize: 11 }}
        axisLine={false}
        tickLine={false}
        width={56}
        tickFormatter={(v) => `₱${v}`}
      />
      <Tooltip content={<ChartTooltip />} cursor={{ fill: "#ffffff08" }} />
    </>
  );

  return (
    <section className="rounded-xl bg-navy-800 p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="flex items-center gap-2 text-sm font-medium">
            <span className="h-2 w-2 rounded-full bg-accent-cyan" aria-hidden="true" />
            {meta.title}
          </h2>
          <p className="mt-1 text-2xl font-semibold tracking-tight">{peso(total)}</p>
        </div>

        <div className="flex items-center gap-2">
          {scrollable && zoom !== 1 && (
            <button
              onClick={() => setZoom(1)}
              title="Reset zoom"
              aria-label="Reset zoom"
              className="flex items-center gap-1.5 rounded-lg bg-navy-700 px-2.5 py-1.5 text-xs text-content-secondary transition hover:text-content-primary"
            >
              <RotateCcw size={12} aria-hidden="true" />
              {Math.round(zoom * 100)}%
            </button>
          )}
          <select
            value={range}
            onChange={(e) => setRange(e.target.value as Range)}
            aria-label="Select date range"
            className="rounded-lg bg-navy-700 px-3 py-1.5 text-xs text-content-primary outline-none focus:ring-2 focus:ring-accent-cyan/50"
          >
            {(Object.keys(RANGE_META) as Range[]).map((r) => (
              <option key={r} value={r}>{RANGE_META[r].option}</option>
            ))}
          </select>
        </div>
      </div>

      {total === 0 ? (
        <div className="flex h-64 flex-col items-center justify-center gap-1">
          <p className="text-sm font-medium text-content-secondary">No sales yet</p>
          <p className="text-xs text-content-muted">
            Insert a coin to issue the first voucher for this period.
          </p>
        </div>
      ) : (
        <>
          <div
            ref={scrollRef}
            className={`scrollbar-thin mt-5 h-64 ${scrollable ? "overflow-x-auto overflow-y-hidden" : ""}`}
          >
            <div style={{ width: chartWidth, minWidth: "100%", height: "100%" }}>
              <ResponsiveContainer width="100%" height="100%">
                {meta.chart === "bar" ? (
                  <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                    {axes}
                    <Bar dataKey="pesos" radius={[4, 4, 0, 0]}>
                      {data.map((p, i) => (
                        <Cell key={i} fill={p.isCurrent ? "#5EEAD4" : "#2DD4BF"} />
                      ))}
                    </Bar>
                  </BarChart>
                ) : (
                  <AreaChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                    <defs>
                      <linearGradient id="salesFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#2DD4BF" stopOpacity={0.35} />
                        <stop offset="100%" stopColor="#2DD4BF" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    {axes}
                    {range === "daily" && currentLabel && (
                      <ReferenceLine
                        x={currentLabel}
                        stroke="#5EEAD4"
                        strokeDasharray="3 3"
                        label={{ value: "now", fill: "#5EEAD4", fontSize: 10, position: "top" }}
                      />
                    )}
                    <Area
                      type="monotone"
                      dataKey="pesos"
                      stroke="#2DD4BF"
                      strokeWidth={2}
                      fill="url(#salesFill)"
                      activeDot={{ r: 4, fill: "#2DD4BF", stroke: "#0A1130", strokeWidth: 2 }}
                    />
                  </AreaChart>
                )}
              </ResponsiveContainer>
            </div>
          </div>

          {scrollable && (
            <p className="mt-2 text-xs text-content-muted">
              Scroll sideways to pan · Ctrl + scroll to zoom
            </p>
          )}
        </>
      )}
    </section>
  );
}