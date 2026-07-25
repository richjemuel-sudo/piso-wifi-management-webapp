import { BarChart3, Coins, Users, ShieldCheck } from "lucide-react";
import StatCard from "../components/StatCard";
import DailySalesChart from "../components/DailySalesChart";
import ActiveSessions from "../components/ActiveSessions";
import RecentVouchers from "../components/RecentVouchers";
import { api } from "../api/client";
import { useApi } from "../hooks/useApi";

const peso = (n: number) =>
  new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP", maximumFractionDigits: 0 }).format(n);

export default function Home() {
  const { data } = useApi(() => api.summary(), [], 10_000);

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total sales" value={data ? peso(data.totalPesos) : "—"} sublabel="All time" icon={BarChart3} />
        <StatCard label="Daily sales" value={data ? peso(data.todayPesos) : "—"} sublabel="Today" icon={Coins} tone="cyan" />
        <StatCard label="Active clients" value={data ? String(data.activeClients) : "—"} sublabel="Connected now" icon={Users} />
        <StatCard label="Device status" value="Online" sublabel="Seen 12s ago" icon={ShieldCheck} tone="green" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <DailySalesChart />
        <ActiveSessions />
      </div>

      <RecentVouchers />
    </div>
  );
}
