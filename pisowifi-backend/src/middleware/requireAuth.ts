import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import type { AuthUser } from "../modules/auth/auth.service";

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

/** Rejects the request unless it carries a valid "Authorization: Bearer <token>" header. */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  try {
    req.user = jwt.verify(header.slice(7), env.JWT_SECRET) as AuthUser;
    next();
  } catch {
    res.status(401).json({ error: "Session expired" });
  }
}

/** Use after requireAuth to restrict a route to specific roles. */
export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Not allowed" });
    }
    next();
  };
}
