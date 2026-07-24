import { NavLink } from "react-router-dom";
import { Home, Users, TrendingUp, Ticket, Router, RotateCcw } from "lucide-react";

const links = [
  { to: "/",         label: "Home",                 icon: Home },
  { to: "/sessions", label: "User & Session",       icon: Users },
  { to: "/sales",    label: "Sales",                icon: TrendingUp },
  { to: "/vouchers", label: "Vouchers and Rates",   icon: Ticket },
  { to: "/network",  label: "Network and Hardware", icon: Router },
  { to: "/reset",    label: "Reset",                icon: RotateCcw },
];

export default function Sidebar({ open }: { open: boolean }) {
  return (
    <aside
      className={`${open ? "w-60" : "w-16"} shrink-0 bg-navy-800 transition-all duration-200`}
    >
      <nav className="flex flex-col gap-1 p-3 pt-6">
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition ${
                isActive
                  ? "bg-accent-cyan/15 text-accent-cyan"
                  : "text-content-secondary hover:bg-navy-700 hover:text-content-primary"
              }`
            }
            title={open ? undefined : label}
          >
            <Icon size={18} className="shrink-0" aria-hidden="true" />
            {open && <span className="truncate">{label}</span>}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
