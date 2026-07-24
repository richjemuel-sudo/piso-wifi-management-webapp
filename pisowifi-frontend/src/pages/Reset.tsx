import { AlertTriangle } from "lucide-react";

const actions = [
  { title: "Clear expired vouchers", desc: "Remove used and expired codes from the database and MikroTik." },
  { title: "Disconnect all sessions", desc: "Kick every connected client. Active vouchers keep their remaining time." },
  { title: "Reset sales data", desc: "Wipe all voucher records. This cannot be undone." },
];

export default function Reset() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start gap-3 rounded-xl border border-accent-yellow/30 bg-accent-yellow/10 p-4">
        <AlertTriangle size={18} className="mt-0.5 shrink-0 text-accent-yellow" aria-hidden="true" />
        <p className="text-sm text-content-secondary">
          These actions affect live data. Double-check before running any of them.
        </p>
      </div>

      {actions.map((a) => (
        <section key={a.title} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-navy-800 p-5">
          <div>
            <h2 className="text-sm font-medium">{a.title}</h2>
            <p className="mt-0.5 text-xs text-content-muted">{a.desc}</p>
          </div>
          <button className="rounded-lg bg-accent-red/15 px-4 py-2 text-xs font-medium text-accent-red transition hover:bg-accent-red/25">
            Run
          </button>
        </section>
      ))}
    </div>
  );
}
