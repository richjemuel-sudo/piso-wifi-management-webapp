import { z } from "zod";

export const issueVoucherSchema = z.object({
  code: z.string().min(4).max(16),
  pesos: z.number().int().positive(),
});

export type IssueVoucherInput = z.infer<typeof issueVoucherSchema>;
