import { BarChart3, Coins, Ticket } from "lucide-react";
import StatCard from "../components/StatCard";
import DailySalesChart from "../components/DailySalesChart";
import { mockSales, peso } from "../data/mockData";

export default function Sales() {
  const total = mockSales.reduce((s, p) => s + p.pesos, 0);
  const vouchers = mockSales.reduce((s, p) => s + p.vouchers, 0);
  const avg = Math.round(total / mockSales.length);

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
