import { prisma } from "../../db/prisma";
import { getActiveSessions } from "../../lib/mikrotik";

export type Range = "daily" | "weekly" | "monthly";

export interface SalesPoint {
  label: string;
  pesos: number;
  vouchers: number;
  isCurrent?: boolean;
}

/* ------------------------------------------------------------- top cards */

export async function getSummary() {
  const now = new Date();
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);

  const [all, today, sessions] = await Promise.all([
    prisma.voucher.aggregate({ _sum: { pesos: true } }),
    prisma.voucher.aggregate({
      _sum: { pesos: true },
      where: { createdAt: { gte: startOfToday } },
    }),
    getActiveSessions().catch(() => []),
  ]);

  return {
    totalPesos: all._sum.pesos ?? 0,
    todayPesos: today._sum.pesos ?? 0,
    activeClients: sessions.length,
  };
}

/* ----------------------------------------------------------------- sales */

function windowStart(range: Range) {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  if (range === "weekly") start.setDate(start.getDate() - 6);
  if (range === "monthly") start.setDate(start.getDate() - 29);
  const prevStart = new Date(start);
  if (range === "daily") prevStart.setDate(prevStart.getDate() - 1);
  if (range === "weekly") prevStart.setDate(prevStart.getDate() - 7);
  if (range === "monthly") prevStart.setDate(prevStart.getDate() - 30);
  return { start, prevStart };
}

function emptyBuckets(range: Range, start: Date): Map<string, SalesPoint> {
  const buckets = new Map<string, SalesPoint>();
  const nowH = new Date().getHours();

  if (range === "daily") {
    for (let h = 0; h < 24; h++) {
      const d = new Date(start);
      d.setHours(h, 0, 0, 0);
      buckets.set(keyOf(d, range), {
        label: `${String(h).padStart(2, "0")}:00`,
        pesos: 0,
        vouchers: 0,
        isCurrent: h === nowH,
      });
    }
  } else {
    const days = range === "weekly" ? 7 : 30;
    for (let i = 0; i < days; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      d.setHours(0, 0, 0, 0);
      buckets.set(keyOf(d, range), {
        label:
          days <= 7
            ? d.toLocaleDateString("en-PH", { weekday: "short" })
            : d.toLocaleDateString("en-PH", { month: "short", day: "numeric" }),
        pesos: 0,
        vouchers: 0,
        isCurrent: i === days - 1,
      });
    }
  }
  return buckets;
}

function keyOf(date: Date, range: Range): string {
  const d = new Date(date);
  if (range === "daily") d.setMinutes(0, 0, 0);
  else d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

export async function getSales(range: Range) {
  const { start, prevStart } = windowStart(range);

  const rows = await prisma.voucher.findMany({
    where: { createdAt: { gte: prevStart } },
    select: { pesos: true, createdAt: true },
  });

  const buckets = emptyBuckets(range, start);
  let totalPesos = 0;
  let totalVouchers = 0;
  let prevPesos = 0;

  for (const row of rows) {
    if (row.createdAt < start) {
      prevPesos += row.pesos;
      continue;
    }
    const point = buckets.get(keyOf(row.createdAt, range));
    if (!point) continue;
    point.pesos += row.pesos;
    point.vouchers += 1;
    totalPesos += row.pesos;
    totalVouchers += 1;
  }

  const changePct =
    prevPesos > 0 ? Math.round(((totalPesos - prevPesos) / prevPesos) * 100) : null;

  return {
    range,
    points: [...buckets.values()],
    totalPesos,
    totalVouchers,
    changePct,
  };
}
