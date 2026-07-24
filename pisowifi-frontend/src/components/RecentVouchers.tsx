import { useState } from "react";
import { Trash2, Search } from "lucide-react";
import StatusPill from "./StatusPill";
import { mockVouchers, peso } from "../data/mockData";

export default function RecentVouchers() {
  const [query, setQuery] = useState("");

  const rows = mockVouchers.filter((v) =>
    v.code.toLowerCase().includes(query.toLowerCase().trim())
  );

  return (
    <section className="rounded-xl bg-navy-800 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-medium">Recent vouchers</h2>
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-content-muted" aria-hidden="true" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search code"
            aria-label="Search voucher code"
            className="w-48 rounded-lg bg-navy-700 py-1.5 pl-8 pr-3 text-xs text-content-primary placeholder:text-content-muted outline-none focus:ring-2 focus:ring-accent-cyan/50"
          />
        </div>
      </div>

      {rows.length === 0 ? (
        <p className="py-10 text-center text-sm text-content-muted">
          {query ? `No voucher matches "${query}".` : "No vouchers issued yet."}
        </p>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-xs text-content-secondary">
                <th className="pb-2 font-medium">Date &amp; time</th>
                <th className="pb-2 font-medium">Code</th>
                <th className="pb-2 text-right font-medium">Price</th>
                <th className="pb-2 font-medium">MAC address</th>
                <th className="pb-2 font-medium">Session</th>
                <th className="pb-2 font-medium">Status</th>
                <th className="pb-2" />
              </tr>
            </thead>
            <tbody>
              {rows.map((v) => (
                <tr key={v.id} className="border-t border-navy-600/60">
                  <td className="py-2.5 text-content-secondary">{v.createdAt}</td>
                  <td className="py-2.5 font-mono font-medium">{v.code}</td>
                  <td className="py-2.5 text-right tabular-nums">{peso(v.pesos)}</td>
                  <td className="py-2.5 font-mono text-xs text-content-secondary">{v.mac}</td>
                  <td className="py-2.5 text-content-secondary">{v.session}</td>
                  <td className="py-2.5"><StatusPill tone={v.status} /></td>
                  <td className="py-2.5 text-right">
                    <button
                      aria-label={`Delete voucher ${v.code}`}
                      className="rounded p-1 text-content-muted transition hover:bg-accent-red/15 hover:text-accent-red"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
