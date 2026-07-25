import type { Request, Response, NextFunction } from "express";
import { issueVoucher, listVouchers } from "./voucher.service";
import { logger } from "../../utils/logger";

 import { deleteVoucher } from "./voucher.service";

 export async function removeVoucher(req: Request, res: Response, next: NextFunction) {
   try {
     const ok = await deleteVoucher(req.params.id);
     if (!ok) return res.status(404).json({ error: "Voucher not found" });
     res.json({ ok: true });
   } catch (err) {
     next(err);
   }
 }

export async function postVoucher(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await issueVoucher(req.body);
    logger.info(`voucher issued: ${result.code} (${result.minutes} min)`);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

export async function getVouchers(_req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await listVouchers());
  } catch (err) {
    next(err);
  }
}
