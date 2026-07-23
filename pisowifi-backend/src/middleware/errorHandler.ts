import type { Request, Response, NextFunction } from "express";
import { logger } from "../utils/logger";

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  const message = err instanceof Error ? err.message : "Internal server error";
  logger.error(message);
  res.status(500).json({ error: message });
}
