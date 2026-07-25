import type { Request, Response, NextFunction } from "express";
import { getSummary, getSales, type Range } from "./stats.service";
import { getActiveSessions } from "../../lib/mikrotik";

const RANGES: Range[] = ["daily", "weekly", "monthly"];

export async function getSummaryStats(_req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await getSummary());
  } catch (err) {
    next(err);
  }
}

export async function getSalesStats(req: Request, res: Response, next: NextFunction) {
  try {
    const raw = String(req.query.range ?? "weekly");
    const range = (RANGES.includes(raw as Range) ? raw : "weekly") as Range;
    res.json(await getSales(range));
  } catch (err) {
    next(err);
  }
}

export async function getSessionsStats(_req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await getActiveSessions());
  } catch (err) {
    next(err);
  }
}
