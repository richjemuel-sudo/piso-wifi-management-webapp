import type { Request, Response, NextFunction } from "express";
import { issueVoucher, listVouchers } from "./voucher.service";
import { logger } from "../../utils/logger";

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
