import { BarChart3, Coins, Ticket } from "lucide-react";
import StatCard from "../components/StatCard";
import DailySalesChart from "../components/DailySalesChart";
import { api } from "../api/client";
import { useApi } from "../hooks/useApi";

const peso = (n: number) =>
  new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP", maximumFractionDigits: 0 }).format(n);

export default function Sales() {
  const { data } = useApi(() => api.sales("weekly"), [], 15_000);

  const total = data?.totalPesos ?? 0;
  const vouchers = data?.totalVouchers ?? 0;
  const avg = data ? Math.round(total / 7) : 0;

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total this week" value={peso(total)} sublabel="7 days" icon={BarChart3} tone="cyan" />
        <StatCard label="Daily average" value={peso(avg)} sublabel="Per day" icon={Coins} />
        <StatCard label="Vouchers issued" value={String(vouchers)} sublabel="7 days" icon={Ticket} />
      </div>
      <DailySalesChart />
    </div>
  );
}