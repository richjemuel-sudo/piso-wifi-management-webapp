import { RouterOSAPI } from "node-routeros";
import { env } from "../config/env";
import { prisma } from "../db/prisma";

const devSessions = new Map<string, { code: string; minutes: number; endsAt: number }>();



export interface ActiveSession {
  id: string;
  user: string;
  mac: string;
  address: string;
  /** seconds consumed so far */
  uptimeSeconds: number;
  /** seconds remaining before the voucher runs out */
  remainingSeconds: number;
}

export interface HotspotUserInput {
  code: string;
  profile: string;
  uptime: string; // "HH:MM:SS"
  /** binds the code to one device — stops sharing */
  macAddress?: string;
}

/** "1d 02:03:04" and "02:03:04" both appear in RouterOS output. */
export function parseRouterOsTime(value?: string): number {
  if (!value) return 0;

  let total = 0;
  const weeks = value.match(/(\d+)w/);
  const days = value.match(/(\d+)d/);
  if (weeks) total += Number(weeks[1]) * 604800;
  if (days) total += Number(days[1]) * 86400;

  const clock = value.match(/(\d+):(\d+):(\d+)/);
  if (clock) {
    total += Number(clock[1]) * 3600 + Number(clock[2]) * 60 + Number(clock[3]);
  } else {
    // formats like "45m10s" with no colons
    const h = value.match(/(\d+)h/);
    const m = value.match(/(\d+)m(?!s)/);
    const s = value.match(/(\d+)s/);
    if (h) total += Number(h[1]) * 3600;
    if (m) total += Number(m[1]) * 60;
    if (s) total += Number(s[1]);
  }

  return total;
}

export function secondsToUptime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return [h, m, s].map((n) => String(n).padStart(2, "0")).join(":");
}

/** Opens a connection, runs fn, always closes. */
async function withRouter<T>(fn: (conn: RouterOSAPI) => Promise<T>): Promise<T> {
  const conn = new RouterOSAPI({
    host: env.MT_HOST,
    user: env.MT_USER,
    password: env.MT_PASS,
    port: env.MT_PORT,
  });

  try {
    await conn.connect();
    return await fn(conn);
  } finally {
    conn.close();
  }
}

/** Which MAC holds this IP on the hotspot. The customer never tells us. */
export async function macForIp(ip: string): Promise<string | null> {
  console.log(">>> macForIp called, NODE_ENV:", process.env.NODE_ENV);
  if (process.env.NODE_ENV !== "production") return "AA:BB:CC:DD:EE:FF";
  return withRouter(async (conn) => {
    const hosts = await conn.write("/ip/hotspot/host/print", [`?address=${ip}`]);
    return (hosts?.[0] as any)?.["mac-address"] ?? null;
  }).catch(() => null);
}


// ---- replace the whole getActiveByMac function with this ----
export async function getActiveByMac(mac: string): Promise<ActiveSession | null> {
  if (process.env.NODE_ENV !== "production") {
  let s = devSessions.get(mac);

  // NEW: if the voucher backing this dev session was deleted, drop the session.
  if (s) {
    const stillExists = await prisma.voucher.findFirst({ where: { code: s.code } });
    if (!stillExists) {
      devSessions.delete(mac);
      s = undefined;
    }
  }

  if (!s) {
    const v = await prisma.voucher.findFirst({
      where: { mac },
      orderBy: { createdAt: "desc" },
    });
    if (!v) return null;
    s = { code: v.code, minutes: v.minutes, endsAt: Date.now() + v.minutes * 60_000 };
    devSessions.set(mac, s);
  }
 
    const remaining = Math.max(0, Math.round((s.endsAt - Date.now()) / 1000));
 
    // Session ran out — clear it so the portal shows "disconnected" again.
    if (remaining === 0) {
      devSessions.delete(mac);
      return null;
    }
 
    return {
      id: "dev",
      user: s.code,
      mac,
      address: "10.0.0.99",
      uptimeSeconds: s.minutes * 60 - remaining,
      remainingSeconds: remaining,
    };
  }
 
  return withRouter(async (conn) => {
    const rows = await conn.write("/ip/hotspot/active/print", [`?mac-address=${mac}`]);
    const row = rows?.[0] as any;
    if (!row) return null;
    return {
      id: row[".id"],
      user: row.user,
      mac: row["mac-address"],
      address: row.address,
      uptimeSeconds: parseRouterOsTime(row.uptime),
      remainingSeconds: parseRouterOsTime(row["session-time-left"]),
    };
  }).catch(() => null);
}

export function clearDevSession(mac: string) {
  devSessions.delete(mac);
}

export async function createHotspotUser({
  code,
  profile,
  uptime,
  macAddress,
}: HotspotUserInput): Promise<void> {
  if (process.env.NODE_ENV !== "production") return;   // ← add
  return withRouter(async (conn) => {
    const params = [
      `=name=${code}`,
      `=password=${code}`,
      `=profile=${profile}`,
      `=limit-uptime=${uptime}`,
    ];
    if (macAddress) params.push(`=mac-address=${macAddress}`);
    await conn.write("/ip/hotspot/user/add", params);
  });
}

/**
 * Logs a device in without the customer typing anything.
 * This is what makes "insert coin → connected" possible.
 */
export async function loginUser(code: string, mac: string, ip: string): Promise<void> {
  if (process.env.NODE_ENV !== "production") return; // no-op in dev
  return withRouter(async (conn) => {
    await conn.write("/ip/hotspot/active/login", [
      `=user=${code}`,
      `=password=${code}`,
      `=mac-address=${mac}`,
      `=ip=${ip}`,
    ]);
  });
}

/**
 * Pause = log out. MikroTik only counts limit-uptime while a user is active,
 * so their remaining time freezes exactly where it was. No bookkeeping needed
 * on our side beyond remembering when the pause started.
 */
export async function logoutMac(mac: string): Promise<void> {
  return withRouter(async (conn) => {
    const rows = await conn.write("/ip/hotspot/active/print", [`?mac-address=${mac}`]);
    const id = (rows?.[0] as any)?.[".id"];
    if (id) await conn.write("/ip/hotspot/active/remove", [`=.id=${id}`]);
  });
}

/** Remaining time on a user who isn't currently logged in. */
export async function getUserRemaining(code: string): Promise<number | null> {
  return withRouter(async (conn) => {
    const rows = await conn.write("/ip/hotspot/user/print", [`?name=${code}`]);
    const row = rows?.[0] as any;
    if (!row) return null;

    const limit = parseRouterOsTime(row["limit-uptime"]);
    const used = parseRouterOsTime(row.uptime);
    return Math.max(0, limit - used);
  }).catch(() => null);
}

export async function removeUser(code: string): Promise<void> {
  return withRouter(async (conn) => {
    const rows = await conn.write("/ip/hotspot/user/print", [`?name=${code}`]);
    const id = (rows?.[0] as any)?.[".id"];
    if (id) await conn.write("/ip/hotspot/user/remove", [`=.id=${id}`]);
  }).catch(() => undefined);
}

export async function getActiveSessions(): Promise<ActiveSession[]> {
  if (process.env.NODE_ENV !== "production") {
    // Reuse the fake dev sessions so the dashboard shows whatever the portal
    // has "connected". Falls back to empty if none.
    const vouchers = await prisma.voucher.findMany({
      where: { mac: { not: null } },
      orderBy: { createdAt: "desc" },
      take: 10,
    });
    // Only surface ones the dev-session map still considers live.
    const out: ActiveSession[] = [];
    for (const v of vouchers) {
      if (!v.mac) continue;
      const active = await getActiveByMac(v.mac);
      if (active) out.push(active);
    }
    return out;
  }

  return withRouter(async (conn) => {
    const rows = await conn.write("/ip/hotspot/active/print");
    return (rows as any[]).map((row) => ({
      id: row[".id"],
      user: row.user,
      mac: row["mac-address"],
      address: row.address,
      uptimeSeconds: parseRouterOsTime(row.uptime),
      remainingSeconds: parseRouterOsTime(row["session-time-left"]),
    }));
  }).catch(() => []);
}
