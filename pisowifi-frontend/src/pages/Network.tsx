import { Cpu, Router, Wifi } from "lucide-react";
import StatCard from "../components/StatCard";

export default function Network() {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="NodeMCU" value="Online" sublabel="Seen 12s ago" icon={Cpu} tone="green" />
        <StatCard label="MikroTik" value="Connected" sublabel="192.168.50.101" icon={Router} tone="green" />
        <StatCard label="WiFi signal" value="Strong" sublabel="-52 dBm" icon={Wifi} />
      </div>

      <section className="rounded-xl bg-navy-800 p-5">
        <h2 className="text-sm font-medium">Connection settings</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs text-content-secondary">MikroTik host</span>
            <input
              defaultValue="192.168.50.101"
              className="rounded-lg bg-navy-700 px-3 py-2 font-mono text-sm outline-none focus:ring-2 focus:ring-accent-cyan/50"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs text-content-secondary">API port</span>
            <input
              defaultValue="8728"
              className="rounded-lg bg-navy-700 px-3 py-2 font-mono text-sm outline-none focus:ring-2 focus:ring-accent-cyan/50"
            />
          </label>
        </div>
      </section>
    </div>
  );
}
