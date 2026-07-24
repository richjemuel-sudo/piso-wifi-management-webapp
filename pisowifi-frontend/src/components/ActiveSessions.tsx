import { useState } from "react";
import { Ban, ShieldOff } from "lucide-react";
import StatusPill from "./StatusPill";
import { mockSessions } from "../data/mockData";

export default function ActiveSessions() {
  const sessions = mockSessions;
  const [blocked, setBlocked] = useState<Set<string>>(new Set());

  function toggleBlock(id: string, mac: string) {
    const isBlocked = blocked.has(id);
    if (!isBlocked && !confirm(`Block ${mac}? They'll be disconnected immediately.`)) return;

    setBlocked((prev) => {
      const next = new Set(prev);
      isBlocked ? next.delete(id) : next.add(id);
      return next;
    });
    // TODO: POST /api/sessions/:mac/block — adds a MikroTik IP binding of type "blocked"
  }

  return (
    <section className="flex flex-col rounded-xl bg-navy-800 p-5">
      <h2 className="flex items-center gap-2 text-sm font-medium">
        <span className="h-2 w-2 rounded-full bg-accent-green" aria-hidden="true" />
        Active sessions ({sessions.length})
      </h2>

      {sessions.length === 0 ? (
        <p className="flex-1 py-12 text-center text-sm text-content-muted">
          No one connected right now.
        </p>
      ) : (
        // pr-3 keeps the last column clear of the overlay scrollbar
        <div className="scrollbar-thin mt-4 max-h-64 overflow-y-auto pr-3">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="sticky top-0 z-10 bg-navy-800">
              <tr className="text-xs text-content-secondary">
                <th className="px-3 pb-2 pl-0 font-medium">Status</th>
                <th className="px-3 pb-2 font-medium">MAC address</th>
                <th className="px-3 pb-2 font-medium">Started</th>
                <th className="px-3 pb-2 text-right font-medium">Duration</th>
                <th className="px-3 pb-2 text-left font-medium">Block</th>
                <th className="w-1 pb-2 pr-0 text-right font-medium">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((s) => {
                const isBlocked = blocked.has(s.id);
                return (
                  <tr
                    key={s.id}
                    className={`border-t border-navy-600/60 ${isBlocked ? "opacity-40" : ""}`}
                  >
                    <td className="px-3 py-2.5 pl-0">
                      {isBlocked ? (
                        <span className="inline-flex items-center rounded-md bg-accent-red/15 px-2 py-0.5 text-xs font-medium text-accent-red">
                          Blocked
                        </span>
                      ) : (
                        <StatusPill tone={s.status} />
                      )}
                    </td>
                    <td className="px-3 py-2.5 font-mono text-xs text-content-secondary">
                      {s.mac}
                    </td>
                    <td className="px-3 py-2.5 text-content-secondary">{s.sessionStart}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums">{s.duration}</td>
                    <td className="w-12 py-2.5 pr-0 text-right">
                      <button
                        onClick={() => toggleBlock(s.id, s.mac)}
                        title={isBlocked ? `Unblock ${s.mac}` : `Block ${s.mac}`}
                        aria-label={isBlocked ? `Unblock ${s.mac}` : `Block ${s.mac}`}
                        className={`rounded p-1 transition ${
                          isBlocked
                            ? "text-accent-green hover:bg-accent-green/15"
                            : "text-content-muted hover:bg-accent-red/15 hover:text-accent-red"
                        }`}
                      >
                        {isBlocked ? <ShieldOff size={14} /> : <Ban size={14} />}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}