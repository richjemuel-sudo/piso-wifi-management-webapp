import { RouterOSAPI } from "node-routeros";
import { env } from "../config/env";

export interface HotspotUserInput {
  code: string;
  profile: string;
  uptime: string; // "HH:MM:SS"
}

/**
 * Opens a short-lived connection, adds a hotspot user, then closes.
 * Simple and reliable for a single vendo's request volume.
 */
export async function createHotspotUser({ code, profile, uptime }: HotspotUserInput): Promise<void> {
  const conn = new RouterOSAPI({
    host: env.MT_HOST,
    user: env.MT_USER,
    password: env.MT_PASS,
    port: env.MT_PORT,
  });

  try {
    await conn.connect();
    await conn.write("/ip/hotspot/user/add", [
      `=name=${code}`,
      `=password=${code}`,
      `=profile=${profile}`,
      `=limit-uptime=${uptime}`,
    ]);
  } finally {
    conn.close();
  }
}
