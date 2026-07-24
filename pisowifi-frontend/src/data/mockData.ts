export interface Session {
  id: string;
  status: "online" | "paused";
  mac: string;
  sessionStart: string;
  duration: string;
}

export interface Voucher {
  id: string;
  createdAt: string;
  code: string;
  pesos: number;
  mac: string;
  session: string;
  status: "active" | "used" | "expired";
}

export interface SalesPoint {
  label: string;
  pesos: number;
  vouchers: number;
}

const macs = [
  "A1:B2:C3:D4:E5:F6", "3C:71:BF:0A:2D:11", "9E:44:2A:C7:80:35",
  "F0:1D:BC:52:6E:9A", "58:CB:52:14:7F:22", "B4:E6:2D:98:03:71",
];

export const mockSessions: Session[] = Array.from({ length: 11 }, (_, i) => ({
  id: `s${i}`,
  status: i % 4 === 0 ? "paused" : "online",
  mac: macs[i % macs.length],
  sessionStart: `${9 + (i % 3)}:${String(5 + i * 4).padStart(2, "0")} PM`,
  duration: `${(i % 2) + 1}h ${(i * 7) % 60}m`,
}));

export const mockVouchers: Voucher[] = [
  { id: "v1", createdAt: "Jul 24, 12:38 PM", code: "KDYAR9", pesos: 5, mac: macs[0], session: "25m", status: "active" },
  { id: "v2", createdAt: "Jul 24, 12:31 PM", code: "6GTNKQ", pesos: 5, mac: macs[1], session: "25m", status: "used" },
  { id: "v3", createdAt: "Jul 24, 11:52 AM", code: "D7B6N9", pesos: 10, mac: macs[2], session: "50m", status: "expired" },
  { id: "v4", createdAt: "Jul 24, 11:20 AM", code: "RJ12XQ", pesos: 20, mac: macs[3], session: "1h 40m", status: "active" },
  { id: "v5", createdAt: "Jul 24, 10:44 AM", code: "M4KP2C", pesos: 5, mac: macs[4], session: "25m", status: "used" },
];

export const mockSales: SalesPoint[] = [
  { label: "Mon", pesos: 1850, vouchers: 37 },
  { label: "Tue", pesos: 1240, vouchers: 24 },
  { label: "Wed", pesos: 2110, vouchers: 42 },
  { label: "Thu", pesos: 2480, vouchers: 49 },
  { label: "Fri", pesos: 1620, vouchers: 32 },
  { label: "Sat", pesos: 2050, vouchers: 41 },
  { label: "Sun", pesos: 2535, vouchers: 50 },
];

export const peso = (n: number) =>
  new Intl.NumberFormat("en-PH", {
    style: "currency", currency: "PHP", maximumFractionDigits: 0,
  }).format(n);
