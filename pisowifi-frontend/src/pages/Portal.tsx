import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, X } from "lucide-react";

interface PortalState {
  mac: string;
  ip: string;
  status: "connected" | "paused" | "disconnected";
  remainingSeconds: number;
  pendingPesos: number;
  claimExpiresIn: number;
  minutesPerPeso: number;
  pauseExpiresIn: number;
}

interface Rates {
  minutesPerPeso: number;
  pauseLimitHours: number;
  examples: { pesos: number; minutes: number }[];
}

const POLL_MS = 3000;

function formatClock(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${h}h : ${String(m).padStart(2, "0")}m : ${String(sec).padStart(2, "0")}s`;
}

export default function Portal() {
  const [state, setState] = useState<PortalState | null>(null);
  const [rates, setRates] = useState<Rates | null>(null);
  const [showRates, setShowRates] = useState(false);
  const [voucher, setVoucher] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  /** Ticks locally between polls so the countdown moves every second. */
  const [tick, setTick] = useState(0);
  const lastSync = useRef(Date.now());

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/portal/state");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setState(data);
      lastSync.current = Date.now();
      setTick(0);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Can't reach the machine.");
    }
  }, []);

  useEffect(() => {
    load();
    const poll = setInterval(load, POLL_MS);
    const clock = setInterval(() => setTick((t) => t + 1), 1000);
    return () => {
      clearInterval(poll);
      clearInterval(clock);
    };
  }, [load]);

  async function act(path: string, label: string, body?: object) {
    setBusy(label);
    setError(null);
    try {
      const res = await fetch(`/api/portal/${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: body ? JSON.stringify(body) : undefined,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      await load();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Try again.");
      return false;
    } finally {
      setBusy(null);
    }
  }

  async function openRates() {
    setShowRates(true);
    if (!rates) {
      const res = await fetch("/api/portal/rates");
      if (res.ok) setRates(await res.json());
    }
  }

  const paying = !!state && state.claimExpiresIn > 0;
  const claimSecondsLeft = state ? Math.max(0, Math.ceil(state.claimExpiresIn / 1000) - tick) : 0;
  const displaySeconds = state
    ? state.status === "connected"
      ? state.remainingSeconds - tick
      : state.remainingSeconds
    : 0;

  const statusColor = {
    connected: "text-accent-green",
    paused: "text-accent-yellow",
    disconnected: "text-accent-red",
  }[state?.status ?? "disconnected"];

  const statusLabel = {
    connected: "Connected",
    paused: "Paused",
    disconnected: "Disconnected",
  }[state?.status ?? "disconnected"];

  return (
    <div className="flex min-h-screen items-center justify-center bg-navy-900 px-4 py-8">
      <div className="w-full max-w-sm rounded-2xl bg-navy-800 px-6 py-8">
        <div className="flex items-center justify-center gap-3">
          <img src="/logo.png" alt="" className="h-24 w-63 rounded-x1" />
          
        </div>

        <p className="mt-5 text-center text-3xl font-semibold tabular-nums">
          {formatClock(displaySeconds)}
        </p>

        <p className="mt-1 text-center text-xs">
          <span className="text-content-secondary">Status: </span>
          <span className={`font-medium ${statusColor}`}>{statusLabel}</span>
        </p>
        <p className="mt-0.5 text-center font-mono text-[11px] text-content-muted">
          {state ? `${state.ip}  |  ${state.mac}` : "Connecting…"}
        </p>

        {/* ---- Paying: show running total and a countdown on the claim ---- */}
        {paying ? (
          <div className="mt-6 flex items-center justify-between rounded-xl bg-navy-700 px-5 py-3.5">
            <span className="text-lg font-semibold tabular-nums">
              ₱ {state!.pendingPesos}
            </span>
            <span className="flex items-center gap-2 text-xs text-content-muted">
              {claimSecondsLeft}s
              <Loader2 size={14} className="animate-spin" aria-hidden="true" />
            </span>
          </div>
        ) : null}

        <div className="mt-4 flex flex-col gap-2.5">
          {paying ? (
            <button
              onClick={() => act("done-paying", "done")}
              disabled={busy !== null || state!.pendingPesos <= 0}
              className="flex items-center justify-center gap-2 rounded-xl bg-accent-green py-3.5 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-40"
            >
              {busy === "done" && <Loader2 size={15} className="animate-spin" aria-hidden="true" />}
              DONE PAYING
            </button>
          ) : (
            <button
              onClick={() => act("claim", "claim")}
              disabled={busy !== null || !state}
              className="flex items-center justify-center gap-2 rounded-xl bg-accent-green py-3.5 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-40"
            >
              {busy === "claim" && <Loader2 size={15} className="animate-spin" aria-hidden="true" />}
              INSERT COIN
            </button>
          )}

          <button
            onClick={() =>
              state?.status === "paused" ? act("resume", "pause") : act("pause", "pause")
            }
            disabled={
              busy !== null ||
              !state ||
              (state.status !== "connected" && state.status !== "paused")
            }
            className="flex items-center justify-center gap-2 rounded-xl bg-navy-700 py-3.5 text-sm font-semibold transition hover:bg-navy-600 disabled:opacity-40"
          >
            {busy === "pause" && <Loader2 size={15} className="animate-spin" aria-hidden="true" />}
            {state?.status === "paused" ? "RESUME" : "PAUSE"}
          </button>

          <button
            onClick={openRates}
            className="rounded-xl bg-accent-yellow py-3.5 text-sm font-semibold text-navy-900 transition hover:brightness-110"
          >
            WIFI RATES
          </button>
        </div>

        {/* ---- Voucher redemption for codes bought elsewhere ---- */}
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (await act("redeem", "redeem", { code: voucher })) setVoucher("");
          }}
          className="mt-4 flex overflow-hidden rounded-full bg-navy-700"
        >
          <input
            value={voucher}
            onChange={(e) => setVoucher(e.target.value)}
            placeholder="Voucher here"
            aria-label="Voucher code"
            className="min-w-0 flex-1 bg-transparent px-4 py-2.5 text-sm uppercase placeholder:normal-case placeholder:text-content-muted outline-none"
          />
          <button
            type="submit"
            disabled={busy !== null || !voucher.trim()}
            className="shrink-0 bg-indigo-600 px-5 text-xs font-semibold text-white transition hover:bg-indigo-500 disabled:opacity-50"
          >
            {busy === "redeem" ? "…" : "Connect"}
          </button>
        </form>

        {state?.status === "paused" && state.pauseExpiresIn > 0 && (
          <p className="mt-3 text-center text-[11px] text-content-muted">
            Paused time expires in {Math.ceil(state.pauseExpiresIn / 3600_000)}h
          </p>
        )}

        {error && (
          <p role="alert" className="mt-3 text-center text-xs text-accent-red">
            {error}
          </p>
        )}
      </div>

      {showRates && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
          onClick={() => setShowRates(false)}
        >
          <div
            className="w-full max-w-xs rounded-2xl bg-navy-800 p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold">WiFi rates</h2>
              <button onClick={() => setShowRates(false)} aria-label="Close">
                <X size={16} className="text-content-muted" />
              </button>
            </div>

            {rates ? (
              <>
                <ul className="mt-4 flex flex-col gap-2">
                  {rates.examples.map((r) => (
                    <li
                      key={r.pesos}
                      className="flex justify-between rounded-lg bg-navy-700 px-4 py-2.5 text-sm"
                    >
                      <span className="font-medium">₱{r.pesos}</span>
                      <span className="text-content-secondary">{r.minutes} min</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-4 text-[11px] leading-relaxed text-content-muted">
                  Pause holds your remaining time for up to {rates.pauseLimitHours} hours.
                  After that it's forfeited.
                </p>
              </>
            ) : (
              <p className="py-6 text-center text-xs text-content-muted">Loading…</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}