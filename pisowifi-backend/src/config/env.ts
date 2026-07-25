import "dotenv/config";
import { z } from "zod";

const schema = z.object({
  PORT: z.coerce.number().default(4000),
  MT_HOST: z.string(),
  MT_PORT: z.coerce.number().default(8728),
  MT_USER: z.string(),
  MT_PASS: z.string(),
  HOTSPOT_PROFILE: z.string().default("plan-1hr"),
  MINUTES_PER_PESO: z.coerce.number().default(5),
  DATABASE_URL: z.string(),
  DEVICE_API_KEY: z.string().min(16),
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default("12h"),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  console.error("Invalid environment variables:", parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
