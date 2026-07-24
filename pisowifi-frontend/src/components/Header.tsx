import { useEffect, useRef, useState } from "react";
import { Menu, ChevronDown, UserCog, LogOut, KeyRound } from "lucide-react";
import { useAuth } from "../context/AuthContext";

interface Props {
  title: string;
  greeting?: string;
  onToggleSidebar: () => void;
}


export default function Header({ title, greeting, onToggleSidebar }: Props) {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on outside click and on Escape.
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <header className="flex items-start justify-between gap-4 px-6 pt-6 pb-4">
      <div className="flex items-start gap-3">
        <button
          onClick={onToggleSidebar}
          aria-label="Toggle sidebar"
          className="mt-0.5 rounded-lg p-1.5 text-content-secondary transition hover:bg-navy-700 hover:text-content-primary"
        >
          <Menu size={20} />
        </button>
        <div>
          <h1 className="text-xl font-semibold">{title}</h1>
          {greeting && <p className="mt-0.5 text-sm text-content-secondary">{greeting}</p>}
        </div>
      </div>

      <div ref={menuRef} className="relative">
        <button
          onClick={() => setOpen((v) => !v)}
          aria-haspopup="menu"
          aria-expanded={open}
          className="flex items-center gap-2 rounded-full bg-navy-700 px-3 py-2 text-sm transition hover:bg-navy-600"
        >
          <UserCog size={16} className="text-accent-cyan" aria-hidden="true" />
          <span className="font-medium">{user?.name ?? "Admin"}</span>
          <ChevronDown
            size={14}
            className={`text-content-secondary transition ${open ? "rotate-180" : ""}`}
            aria-hidden="true"
          />
        </button>

        {open && (
          <div
            role="menu"
            className="absolute right-0 z-20 mt-2 w-52 overflow-hidden rounded-xl bg-navy-700 py-1 shadow-xl"
          >
            <div className="px-4 py-2.5">
              <p className="text-sm font-medium">{user?.name}</p>
              <p className="text-xs capitalize text-content-muted">{user?.role}</p>
            </div>

            <div className="my-1 h-px bg-navy-600" />

            <button
              role="menuitem"
              className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm text-content-secondary transition hover:bg-navy-600 hover:text-content-primary"
            >
              <KeyRound size={14} aria-hidden="true" />
              Change password
            </button>

            <button
              role="menuitem"
              onClick={logout}
              className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm text-accent-red transition hover:bg-accent-red/15"
            >
              <LogOut size={14} aria-hidden="true" />
              Log out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
