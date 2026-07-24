import { Menu, ChevronDown, UserCog } from "lucide-react";

interface Props {
  title: string;
  greeting?: string;
  onToggleSidebar: () => void;
}

export default function Header({ title, greeting, onToggleSidebar }: Props) {
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

      <button className="flex items-center gap-2 rounded-full bg-navy-700 px-3 py-2 text-sm transition hover:bg-navy-600">
        <UserCog size={16} className="text-accent-cyan" aria-hidden="true" />
        <span className="font-medium">Admin</span>
        <ChevronDown size={14} className="text-content-secondary" aria-hidden="true" />
      </button>
    </header>
  );
}
