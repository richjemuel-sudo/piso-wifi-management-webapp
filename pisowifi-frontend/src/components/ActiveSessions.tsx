import StatusPill from "./StatusPill";
import { api, type ActiveSession } from "../api/client";
import { useApi } from "../hooks/useApi";

function fmtDuration(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export default function ActiveSessions() {
  const { data, loading, error } = useApi<ActiveSession[]>(() => api.activeSessions(), [], 5_000);
  const sessions = data ?? [];

  return (
    <section className="flex flex-col rounded-xl bg-navy-800 p-5">
      <h2 className="flex items-center gap-2 text-sm font-medium">
        <span className="h-2 w-2 rounded-full bg-accent-green" aria-hidden="true" />
        Active sessions ({sessions.length})
      </h2>

      {loading ? (
        <p className="flex-1 py-12 text-center text-sm text-content-muted">Loading…</p>
      ) : error ? (
        <p className="flex-1 py-12 text-center text-sm text-accent-red">{error}</p>
      ) : sessions.length === 0 ? (
        <p className="flex-1 py-12 text-center text-sm text-content-muted">No one connected right now.</p>
      ) : (
        <div className="scrollbar-thin mt-4 max-h-64 overflow-y-auto pr-3">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="sticky top-0 z-10 bg-navy-800">
              <tr className="text-xs text-content-secondary">
                <th className="px-3 pb-2 pl-0 font-medium">Status</th>
                <th className="px-3 pb-2 font-medium">MAC address</th>
                <th className="px-3 pb-2 font-medium">Code</th>
                <th className="px-3 pb-2 text-right font-medium">Remaining</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((s) => (
                <tr key={s.id + s.mac} className="border-t border-navy-600/60">
                  <td className="px-3 py-2.5 pl-0"><StatusPill tone="online" /></td>
                  <td className="px-3 py-2.5 font-mono text-xs text-content-secondary">{s.mac}</td>
                  <td className="px-3 py-2.5 font-mono">{s.user}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums">{fmtDuration(s.remainingSeconds)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
