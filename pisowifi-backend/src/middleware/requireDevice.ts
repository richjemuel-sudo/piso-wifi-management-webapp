import type { Request, Response, NextFunction } from "express";
import { env } from "../config/env";

/**
 * The NodeMCU can't log in or hold a JWT, so it carries a static shared key.
 * Rotating it means reflashing — fine for one vendo, revisit at scale.
 */
export function requireDevice(req: Request, res: Response, next: NextFunction) {
  if (req.headers["x-device-key"] !== env.DEVICE_API_KEY) {
    return res.status(401).json({ error: "Invalid device key" });
  }
  next();
}
