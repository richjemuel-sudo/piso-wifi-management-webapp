import StatusPill from "./StatusPill";
import { mockSessions } from "../data/mockData";

export default function ActiveSessions() {
  const sessions = mockSessions;

  return (
    <section className="flex flex-col rounded-xl bg-navy-800 p-5">
      <h2 className="flex items-center gap-2 text-sm font-medium">
        <span className="h-2 w-2 rounded-full bg-accent-green" aria-hidden="true" />
        Active sessions ({sessions.length})
      </h2>

      {sessions.length === 0 ? (
        <p className="flex-1 py-12 text-center text-sm text-content-muted">No one connected right now.</p>
      ) : (
        <div className="scrollbar-thin mt-4 max-h-64 overflow-y-auto">
          <table className="w-full text-left text-sm">
            <thead className="sticky top-0 bg-navy-800">
              <tr className="text-xs text-content-secondary">
                <th className="pb-2 font-medium">Status</th>
                <th className="pb-2 font-medium">MAC address</th>
                <th className="pb-2 font-medium">Started</th>
                <th className="pb-2 text-right font-medium">Duration</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((s) => (
                <tr key={s.id} className="border-t border-navy-600/60">
                  <td className="py-2"><StatusPill tone={s.status} /></td>
                  <td className="py-2 font-mono text-xs text-content-secondary">{s.mac}</td>
                  <td className="py-2 text-content-secondary">{s.sessionStart}</td>
                  <td className="py-2 text-right tabular-nums">{s.duration}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
