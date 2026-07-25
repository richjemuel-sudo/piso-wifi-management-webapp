import type { Request, Response } from "express";
import { macForIp } from "../../lib/mikrotik";
import {
  getState, openClaim, creditCoin, convertCoins,
  redeemVoucher, pauseSession, resumeSession, getPauseLimitHours,
} from "./session.service";
import { env } from "../../config/env";

/** Express reports IPv6-mapped addresses on dual-stack sockets. */
function clientIp(req: Request): string {
  const raw =
    (req.headers["x-forwarded-for"] as string)?.split(",")[0] ??
    req.socket.remoteAddress ??
    "";
  return raw.replace(/^::ffff:/, "").trim();
}

/** Resolves the caller's identity from MikroTik, never from the request body. */
async function identify(req: Request, res: Response) {
  const ip = clientIp(req);
  const mac = await macForIp(ip);
  if (!mac) {
    res.status(404).json({
      error: "Couldn't identify your device. Reconnect to the WiFi and try again.",
    });
    return null;
  }
  return { mac, ip };
}

function fail(res: Response, err: unknown) {
  res.status(400).json({
    error: err instanceof Error ? err.message : "Something went wrong.",
  });
}

export async function getPortalState(req: Request, res: Response) {
  const who = await identify(req, res);
  if (!who) return;
  try {
    res.json(await getState(who.mac, who.ip));
  } catch (err) {
    fail(res, err);
  }
}

export async function postClaim(req: Request, res: Response) {
  const who = await identify(req, res);
  if (!who) return;
  const claim = openClaim(who.mac, who.ip);
  res.json({ pesos: claim.pesos, expiresIn: Math.max(0, claim.expiresAt - Date.now()) });
}

export async function postDonePaying(req: Request, res: Response) {
  const who = await identify(req, res);
  if (!who) return;
  try {
    res.json(await convertCoins(who.mac, who.ip));
  } catch (err) {
    fail(res, err);
  }
}

export async function postRedeem(req: Request, res: Response) {
  const who = await identify(req, res);
  if (!who) return;
  const code = String(req.body?.code ?? "").trim().toUpperCase();
  if (!code) return res.status(400).json({ error: "Enter a voucher code." });
  try {
    res.json(await redeemVoucher(code, who.mac, who.ip));
  } catch (err) {
    fail(res, err);
  }
}

export async function postPause(req: Request, res: Response) {
  const who = await identify(req, res);
  if (!who) return;
  try {
    res.json(await pauseSession(who.mac));
  } catch (err) {
    fail(res, err);
  }
}

export async function postResume(req: Request, res: Response) {
  const who = await identify(req, res);
  if (!who) return;
  try {
    res.json(await resumeSession(who.mac, who.ip));
  } catch (err) {
    fail(res, err);
  }
}

export async function getRates(_req: Request, res: Response) {
  res.json({
    minutesPerPeso: env.MINUTES_PER_PESO,
    pauseLimitHours: await getPauseLimitHours(),
    examples: [1, 5, 10, 20].map((pesos) => ({
      pesos,
      minutes: pesos * env.MINUTES_PER_PESO,
    })),
  });
}

/** Vendo-facing. Authenticated by device key, not a session. */
export async function postCoin(req: Request, res: Response) {
  const pesos = Number(req.body?.pesos);
  if (!Number.isFinite(pesos) || pesos <= 0) {
    return res.status(400).json({ error: "pesos must be a positive number" });
  }
  const claim = creditCoin(pesos);
  res.status(201).json({
    credited: !!claim,
    mac: claim?.mac ?? null,
    total: claim?.pesos ?? null,
  });
}
