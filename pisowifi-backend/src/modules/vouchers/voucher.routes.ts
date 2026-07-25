import { Router } from "express";
import { postVoucher, getVouchers } from "./voucher.controller";
import { validateBody } from "../../middleware/validate";
import { issueVoucherSchema } from "./voucher.schema";
import { requireAuth } from "../../middleware/requireAuth";
import { removeVoucher } from "./voucher.controller";

export const voucherRoutes = Router();

voucherRoutes.post("/", validateBody(issueVoucherSchema), postVoucher);
voucherRoutes.get("/", getVouchers);
voucherRoutes.delete("/:id", requireAuth, removeVoucher);

