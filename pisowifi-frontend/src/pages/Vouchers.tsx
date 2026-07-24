import { Plus } from "lucide-react";
import RecentVouchers from "../components/RecentVouchers";

export default function Vouchers() {
  return (
    <div className="flex flex-col gap-4">
      <section className="rounded-xl bg-navy-800 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-medium">Rate settings</h2>
            <p className="mt-0.5 text-xs text-content-muted">How much time each peso buys</p>
          </div>
          <button className="flex items-center gap-2 rounded-lg bg-accent-cyan/15 px-3 py-2 text-xs font-medium text-accent-cyan transition hover:bg-accent-cyan/25">
            <Plus size={14} aria-hidden="true" />
            Issue voucher
          </button>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs text-content-secondary">Minutes per peso</span>
            <input
              type="number" defaultValue={5} min={1}
              className="rounded-lg bg-navy-700 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent-cyan/50"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs text-content-secondary">Bandwidth limit (Mbps)</span>
            <input
              type="number" defaultValue={5} min={1}
              className="rounded-lg bg-navy-700 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent-cyan/50"
            />
          </label>
        </div>
      </section>

      <RecentVouchers />
    </div>
  );
}
