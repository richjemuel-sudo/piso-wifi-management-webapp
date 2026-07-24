import express from "express";
import { voucherRoutes } from "./modules/vouchers/voucher.routes";
import { errorHandler } from "./middleware/errorHandler";
import path from "path";
import { authRoutes } from "./modules/auth/auth.routes";
import { requireAuth } from "./middleware/requireAuth";


export const app = express();

app.use(express.json());

app.get("/health", (_req, res) => res.json({ ok: true }));
app.use("/api/vouchers", voucherRoutes);
app.use("/api/auth", authRoutes);
app.use(errorHandler); // must be last
app.use(express.static(path.join(__dirname, '../public')));

app.use("/api/vouchers", requireAuth, voucherRoutes);
//app.use("/api/stats", requireAuth, statsRoutes);