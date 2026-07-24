import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";

const titles: Record<string, string> = {
  "/": "Dashboard",
  "/sessions": "User & Session",
  "/sales": "Sales",
  "/vouchers": "Vouchers and Rates",
  "/network": "Network and Hardware",
  "/reset": "Reset",
};

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { pathname } = useLocation();
  const title = titles[pathname] ?? "Dashboard";

  return (
    <div className="flex min-h-screen bg-navy-900">
      <Sidebar open={sidebarOpen} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header
          title={title}
          greeting={pathname === "/" ? "Welcome, Rich!" : undefined}
          onToggleSidebar={() => setSidebarOpen((v) => !v)}
        />
        <main className="flex-1 px-6 pb-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
