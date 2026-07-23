import express from "express";
import { voucherRoutes } from "./modules/vouchers/voucher.routes";
import { errorHandler } from "./middleware/errorHandler";
import path from "path";

export const app = express();

app.use(express.json());

app.get("/health", (_req, res) => res.json({ ok: true }));
app.use("/api/vouchers", voucherRoutes);

app.use(errorHandler); // must be last
app.use(express.static(path.join(__dirname, '../public')));