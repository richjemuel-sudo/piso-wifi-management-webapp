import { useState } from "react";
import { Coins, X, Loader2 } from "lucide-react";

/**
 * Dev-only coin simulator. Stands in for the NodeMCU by POSTing to the exact
 * same endpoint (/api/portal/coin) with the same device-key header. From the
 * backend's point of view there's no difference between this and real hardware
 * — which is the point: it proves the software path without the ESP present.
 *
 * Render it once, high in the tree (e.g. in App). It only shows in dev.
 */
// Must match DEVICE_API_KEY in the backend .env. Safe here because this file
// is dev-only and never ships to production (guarded below).
const DEVICE_KEY = import.meta.env.VITE_DEVICE_KEY ?? "";

const COINS = [1, 5, 10, 20];
export default function CoinSimulator() {
  const [open, setOpen] = useState(true);
  const [busy, setBusy] = useState<number | null>(null);
  const [last, setLast] = useState<string | null>(null);

  // Never render in a production build.
  if (import.meta.env.PROD) return null;

  async function insert(pesos: number) {
    setBusy(pesos);
    setLast(null);
    try {
      const res = await fetch("/api/portal/coin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Device-Key": DEVICE_KEY,
        },
        body: JSON.stringify({ pesos }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);

      setLast(
        data.credited
          ? `+₱${pesos} → claim total ₱${data.total}`
          : `+₱${pesos} → orphan pool (no open claim)`
      );
    } catch (err) {
      setLast(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusy(null);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-4 right-4 z-100 flex h-11 w-11 items-center justify-center rounded-full bg-accent-yellow text-navy-900 shadow-lg transition hover:brightness-110"
        title="Coin simulator (dev)"
        aria-label="Open coin simulator"
      >
        <Coins size={18} />
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-100 w-56 rounded-xl border border-navy-600 bg-navy-800 p-3 shadow-2xl">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-xs font-semibold text-accent-yellow">
          <Coins size={13} aria-hidden="true" /> Coin simulator
        </span>
        <button
          onClick={() => setOpen(false)}
          aria-label="Close simulator"
          className="text-content-muted transition hover:text-content-primary"
        >
          <X size={14} />
        </button>
      </div>

      <p className="mt-1 text-[10px] leading-tight text-content-muted">
        Dev tool — stands in for the NodeMCU. Tap INSERT COIN in the portal
        first, then drop coins here.
      </p>

      <div className="mt-3 grid grid-cols-2 gap-2">
        {COINS.map((c) => (
          <button
            key={c}
            onClick={() => insert(c)}
            disabled={busy !== null}
            className="flex items-center justify-center gap-1 rounded-lg bg-navy-700 py-2 text-sm font-medium transition hover:bg-navy-600 disabled:opacity-50"
          >
            {busy === c ? (
              <Loader2 size={13} className="animate-spin" aria-hidden="true" />
            ) : (
              `₱${c}`
            )}
          </button>
        ))}
      </div>

      {last && (
        <p className="mt-2 text-[10px] leading-tight text-content-secondary">{last}</p>
      )}
    </div>
  );
}