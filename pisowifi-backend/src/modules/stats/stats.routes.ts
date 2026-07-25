import { Router } from "express";
import { getSummaryStats, getSalesStats, getSessionsStats } from "./stats.controller";
import { requireAuth } from "../../middleware/requireAuth";

export const statsRoutes = Router();

// All dashboard data — admin only.
statsRoutes.get("/summary", requireAuth, getSummaryStats);
statsRoutes.get("/sales", requireAuth, getSalesStats);
statsRoutes.get("/sessions", requireAuth, getSessionsStats);
