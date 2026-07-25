import { useMemo, useState } from "react";
import { Trash2, Search, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import StatusPill from "./StatusPill";
import { api, type Voucher } from "../api/client";
import { useApi } from "../hooks/useApi";

const PAGE_SIZE = 10;

const peso = (n: number) =>
  new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP", maximumFractionDigits: 0 }).format(n);

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleString("en-PH", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

export default function RecentVouchers() {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [deleting, setDeleting] = useState<string | null>(null);

  const { data, loading, error, refetch } = useApi<Voucher[]>(() => api.vouchers(), [], 10_000);

  const filtered = useMemo(
    () =>
      (data ?? []).filter((v) =>
        v.code.toLowerCase().includes(query.toLowerCase().trim())
      ),
    [data, query]
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, totalPages);
  const rows = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  async function handleDelete(v: Voucher) {
    if (!confirm(`Delete voucher ${v.code}? This removes it from MikroTik and the database.`)) return;
    setDeleting(v.id);
    try {
      await api.deleteVoucher(v.id);
      await refetch();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Couldn't delete. Try again.");
    } finally {
      setDeleting(null);
    }
  }

  return (
    <section className="rounded-xl bg-navy-800 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-medium">Recent vouchers</h2>
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-content-muted" aria-hidden="true" />
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1); // jump back to first page when the filter changes
            }}
            placeholder="Search code"
            aria-label="Search voucher code"
            className="w-48 rounded-lg bg-navy-700 py-1.5 pl-8 pr-3 text-xs text-content-primary placeholder:text-content-muted outline-none focus:ring-2 focus:ring-accent-cyan/50"
          />
        </div>
      </div>

      {loading ? (
        <p className="py-10 text-center text-sm text-content-muted">Loading vouchers…</p>
      ) : error ? (
        <p className="py-10 text-center text-sm text-accent-red">{error}</p>
      ) : filtered.length === 0 ? (
        <p className="py-10 text-center text-sm text-content-muted">
          {query ? `No voucher matches "${query}".` : "No vouchers issued yet."}
        </p>
      ) : (
        <>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-180 text-left text-sm whitespace-nowrap">
              <thead>
                <tr className="text-xs text-content-secondary">
                  <th className="px-3 pb-2 pl-0 font-medium">Date &amp; time</th>
                  <th className="px-3 pb-2 font-medium">Code</th>
                  <th className="w-24 px-3 pb-2 text-right font-medium">Price</th>
                  <th className="px-3 pb-2 font-medium">MAC address</th>
                  <th className="px-3 pb-2 font-medium">Minutes</th>
                  <th className="px-3 pb-2 font-medium">Status</th>
                  <th className="w-12 pb-2 pr-0" />
                </tr>
              </thead>
              <tbody>
                {rows.map((v) => (
                  <tr key={v.id} className="border-t border-navy-600/60">
                    <td className="px-3 py-2.5 pl-0 text-content-secondary">{fmtDate(v.createdAt)}</td>
                    <td className="px-3 py-2.5 font-mono font-medium">{v.code}</td>
                    <td className="w-24 px-3 py-2.5 text-right tabular-nums">{peso(v.pesos)}</td>
                    <td className="px-3 py-2.5 font-mono text-xs text-content-secondary">{v.mac ?? "—"}</td>
                    <td className="px-3 py-2.5 text-content-secondary">{v.minutes}m</td>
                    <td className="px-3 py-2.5"><StatusPill tone={v.status as any} /></td>
                    <td className="w-12 py-2.5 pr-0 text-right">
                      <button
                        onClick={() => handleDelete(v)}
                        disabled={deleting === v.id}
                        aria-label={`Delete voucher ${v.code}`}
                        className="rounded p-1 text-content-muted transition hover:bg-accent-red/15 hover:text-accent-red disabled:opacity-50"
                      >
                        {deleting === v.id ? (
                          <Loader2 size={14} className="animate-spin" aria-hidden="true" />
                        ) : (
                          <Trash2 size={14} />
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination — only shows when there's more than one page */}
          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between text-xs text-content-secondary">
              <span>
                Showing {(current - 1) * PAGE_SIZE + 1}–
                {Math.min(current * PAGE_SIZE, filtered.length)} of {filtered.length}
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={current === 1}
                  aria-label="Previous page"
                  className="flex items-center gap-1 rounded-lg px-2 py-1.5 transition hover:bg-navy-700 disabled:opacity-40"
                >
                  <ChevronLeft size={14} /> Back
                </button>
                <span className="px-2 tabular-nums">{current} / {totalPages}</span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={current === totalPages}
                  aria-label="Next page"
                  className="flex items-center gap-1 rounded-lg px-2 py-1.5 transition hover:bg-navy-700 disabled:opacity-40"
                >
                  Next <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </section>
  );
}