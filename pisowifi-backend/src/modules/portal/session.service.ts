import { prisma } from "../../db/prisma";
import { env } from "../../config/env";
import {
  getActiveByMac,
  createHotspotUser,
  loginUser,
  logoutMac,
  getUserRemaining,
  removeUser,
  secondsToUptime,
  clearDevSession
} from "../../lib/mikrotik";

export interface PortalState {
  mac: string;
  ip: string;
  status: "connected" | "paused" | "disconnected";
  /** seconds left on the current session */
  remainingSeconds: number;
  /** pesos sitting in the machine waiting to be converted */
  pendingPesos: number;
  /** ms until the claim lapses, 0 when no claim is open */
  claimExpiresIn: number;
  minutesPerPeso: number;
  /** when paused, ms until the paused time is forfeited */
  pauseExpiresIn: number;
}

interface Claim {
  mac: string;
  ip: string;
  pesos: number;
  expiresAt: number;
}

const CLAIM_TTL_MS = 30_000;
const ORPHAN_TTL_MS = 120_000;

const claims = new Map<string, Claim>();
let orphanPesos = 0;
let orphanExpiresAt = 0;

function sweep() {
  const now = Date.now();
  for (const [mac, c] of claims) if (c.expiresAt < now) claims.delete(mac);
  if (orphanExpiresAt < now) orphanPesos = 0;
}

/* ---------------------------------------------------------------- settings */

/** Admin-configurable, defaults to 24h. Stored as a row so the UI can edit it. */
export async function getPauseLimitHours(): Promise<number> {
  const row = await prisma.setting.findUnique({ where: { key: "pauseLimitHours" } });
  const parsed = Number(row?.value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 24;
}

export async function setPauseLimitHours(hours: number): Promise<void> {
  await prisma.setting.upsert({
    where: { key: "pauseLimitHours" },
    create: { key: "pauseLimitHours", value: String(hours) },
    update: { value: String(hours) },
  });
}

/* ------------------------------------------------------------------ claims */

export function openClaim(mac: string, ip: string): Claim {
  sweep();

  const existing = claims.get(mac);
  if (existing) {
    existing.expiresAt = Date.now() + CLAIM_TTL_MS;
    return existing;
  }

  const claim: Claim = { mac, ip, pesos: 0, expiresAt: Date.now() + CLAIM_TTL_MS };

  // Coins dropped before anyone tapped go to the next claimer — the money is
  // already in the box, and silently eating it is worse than being generous.
  if (orphanPesos > 0 && orphanExpiresAt > Date.now()) {
    claim.pesos = orphanPesos;
    orphanPesos = 0;
  }

  claims.set(mac, claim);
  return claim;
}

/** NodeMCU reports a coin. Newest open claim wins. */
export function creditCoin(pesos: number): Claim | null {
  sweep();

  let target: Claim | null = null;
  for (const c of claims.values()) {
    if (!target || c.expiresAt > target.expiresAt) target = c;
  }

  if (!target) {
    orphanPesos += pesos;
    orphanExpiresAt = Date.now() + ORPHAN_TTL_MS;
    return null;
  }

  target.pesos += pesos;
  target.expiresAt = Date.now() + CLAIM_TTL_MS; // paying keeps the slot alive
  return target;
}

/* ------------------------------------------------------------------- state */

export async function getState(mac: string, ip: string): Promise<PortalState> {
  sweep();

  const claim = claims.get(mac);
  const active = await getActiveByMac(mac);
  const paused = await prisma.pausedSession.findUnique({ where: { mac } });

  let status: PortalState["status"] = "disconnected";
  let remainingSeconds = 0;
  let pauseExpiresIn = 0;

  if (active) {
    status = "connected";
    remainingSeconds = active.remainingSeconds;
  } else if (paused) {
    const limitMs = (await getPauseLimitHours()) * 3600_000;
    const elapsed = Date.now() - paused.pausedAt.getTime();

    if (elapsed >= limitMs) {
      // Forfeited — clean up so the customer sees an honest "disconnected".
      await removeUser(paused.code);
      await prisma.pausedSession.delete({ where: { mac } });
    } else {
      status = "paused";
      remainingSeconds = (await getUserRemaining(paused.code)) ?? 0;
      pauseExpiresIn = limitMs - elapsed;
    }
  }

  return {
    mac,
    ip,
    status,
    remainingSeconds,
    pendingPesos: claim?.pesos ?? 0,
    claimExpiresIn: claim ? Math.max(0, claim.expiresAt - Date.now()) : 0,
    minutesPerPeso: env.MINUTES_PER_PESO,
    pauseExpiresIn,
  };
}

/* ------------------------------------------------------------------ actions */

function makeCode(): string {
  const charset = "23456789ABCDEFGHJKMNPQRSTUVWXYZ"; // no 0/O, 1/I/L
  let out = "";
  for (let i = 0; i < 6; i++) out += charset[Math.floor(Math.random() * charset.length)];
  return out;
}

/**
 * "Done paying" — converts pending coins into a live session.
 * The customer never sees or types a code; we know their MAC, so we create
 * the user and log them in directly.
 */
export async function convertCoins(mac: string, ip: string) {
  const claim = claims.get(mac);
  if (!claim || claim.pesos <= 0) throw new Error("No coins inserted yet.");

  const pesos = claim.pesos;
  const minutes = pesos * env.MINUTES_PER_PESO;

  // If they already have a session, extend it rather than starting a new one.
  const active = await getActiveByMac(mac);
  const paused = await prisma.pausedSession.findUnique({ where: { mac } });
  const existingCode = active?.user ?? paused?.code;

  if (existingCode) {
    const remaining = (await getUserRemaining(existingCode)) ?? 0;
    await removeUser(existingCode);
    if (paused) await prisma.pausedSession.delete({ where: { mac } });

    const code = makeCode();
    await createHotspotUser({
      code,
      profile: env.HOTSPOT_PROFILE,
      uptime: secondsToUptime(remaining + minutes * 60),
      macAddress: mac,
    });
    await loginUser(code, mac, ip);
    await prisma.voucher.create({ data: { code, pesos, minutes, mac } });
    claims.delete(mac);
    clearDevSession(mac);
    return { code, minutes, totalSeconds: remaining + minutes * 60 };
  }

  let code = "";
  for (let attempt = 0; attempt < 5; attempt++) {
    code = makeCode();
    try {
      await createHotspotUser({
        code,
        profile: env.HOTSPOT_PROFILE,
        uptime: secondsToUptime(minutes * 60),
        macAddress: mac,
      });
      break;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      if (!msg.includes("already have user") || attempt === 4) throw err;
    }
  }

  await loginUser(code, mac, ip);
  await prisma.voucher.create({ data: { code, pesos, minutes, mac } });
  claims.delete(mac);

  return { code, minutes, totalSeconds: minutes * 60 };
}

/** Customer holds a code from elsewhere. */
export async function redeemVoucher(code: string, mac: string, ip: string) {
  const remaining = await getUserRemaining(code);
  if (remaining === null) throw new Error("That code doesn't exist.");
  if (remaining <= 0) throw new Error("That code has already been used up.");

  await loginUser(code, mac, ip);
  return { code, remainingSeconds: remaining };
}

/**
 * Pause is just a logout — MikroTik stops counting limit-uptime when the user
 * isn't active, so their remaining time freezes on its own. We only record
 * when the pause started, to enforce the expiry window.
 */
export async function pauseSession(mac: string) {
  const active = await getActiveByMac(mac);
  if (!active) throw new Error("You're not connected right now.");

  await logoutMac(mac);
  await prisma.pausedSession.upsert({
    where: { mac },
    create: { mac, code: active.user, pausedAt: new Date() },
    update: { code: active.user, pausedAt: new Date() },
  });

  const hours = await getPauseLimitHours();
  return { remainingSeconds: active.remainingSeconds, pauseLimitHours: hours };
}

export async function resumeSession(mac: string, ip: string) {
  const paused = await prisma.pausedSession.findUnique({ where: { mac } });
  if (!paused) throw new Error("Nothing to resume.");

  const limitMs = (await getPauseLimitHours()) * 3600_000;
  if (Date.now() - paused.pausedAt.getTime() >= limitMs) {
    await removeUser(paused.code);
    await prisma.pausedSession.delete({ where: { mac } });
    throw new Error("Your paused time expired. Please insert coins again.");
  }

  await loginUser(paused.code, mac, ip);
  await prisma.pausedSession.delete({ where: { mac } });

  return { remainingSeconds: (await getUserRemaining(paused.code)) ?? 0 };
}
