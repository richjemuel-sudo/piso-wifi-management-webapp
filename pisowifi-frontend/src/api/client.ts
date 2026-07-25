// One place for every dashboard API call. Components import from here instead
// of calling fetch directly, so auth handling and the base path live in one spot.

import { getToken } from "../context/AuthContext";

export interface Voucher {
  id: string;
  code: string;
  pesos: number;
  minutes: number;
  mac: string | null;
  status: string;
  createdAt: string;
}

export interface SalesPoint {
  label: string;
  pesos: number;
  vouchers: number;
  isCurrent?: boolean;
}

export interface SalesSummary {
  range: "daily" | "weekly" | "monthly";
  points: SalesPoint[];
  totalPesos: number;
  totalVouchers: number;
  changePct: number | null;
}

export interface ActiveSession {
  id: string;
  user: string;
  mac: string;
  address: string;
  uptimeSeconds: number;
  remainingSeconds: number;
  
}

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getToken();

  const res = await fetch(`/api${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  });

  // Session died — bounce to login, same as apiFetch does elsewhere.
  if (res.status === 401) {
    localStorage.removeItem("pisowifi_token");
    window.location.href = "/login";
    throw new ApiError(401, "Session expired");
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiError(res.status, (data as any).error ?? "Request failed");
  }
  return data as T;
}

export const api = {
  vouchers: () => request<Voucher[]>("/vouchers"),
  sales: (range: "daily" | "weekly" | "monthly") =>
    request<SalesSummary>(`/stats/sales?range=${range}`),
  activeSessions: () => request<ActiveSession[]>("/stats/sessions"),
  summary: () => request<{ totalPesos: number; todayPesos: number; activeClients: number }>(
    "/stats/summary"
  ),
  deleteVoucher: (id: string) =>
        request<{ ok: true }>(`/vouchers/${id}`, { method: "DELETE" }),
};
