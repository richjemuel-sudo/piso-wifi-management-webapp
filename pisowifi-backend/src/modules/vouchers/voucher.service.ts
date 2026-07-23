import { prisma } from "../../db/prisma";
import { env } from "../../config/env";
import { createHotspotUser } from "../../lib/mikrotik";
import { minutesToUptime } from "../../utils/time";
import type { IssueVoucherInput } from "./voucher.schema";

/** Create the MikroTik hotspot user, then persist the voucher for the dashboard. */
export async function issueVoucher({ code, pesos }: IssueVoucherInput) {
  const minutes = pesos * env.MINUTES_PER_PESO;
  const uptime = minutesToUptime(minutes);

  // 1) Provision access on MikroTik
  await createHotspotUser({ code, profile: env.HOTSPOT_PROFILE, uptime });

  // 2) Record it so the dashboard can show sales/vouchers
  const voucher = await prisma.voucher.create({
    data: { code, pesos, minutes },
  });

  return { ...voucher, uptime };
}

export function listVouchers() {
  return prisma.voucher.findMany({ orderBy: { createdAt: "desc" }, take: 100 });
}
