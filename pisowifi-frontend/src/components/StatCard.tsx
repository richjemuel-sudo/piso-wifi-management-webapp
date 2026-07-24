import type { LucideIcon } from "lucide-react";

interface Props {
  label: string;
  value: string;
  sublabel?: string;
  icon: LucideIcon;
  /** cyan = the one highlighted metric; green/yellow/red = live status; neutral = everything else */
  tone?: "neutral" | "cyan" | "green" | "yellow" | "red";
}

const valueTone = {
  neutral: "text-content-primary",
  cyan: "text-accent-cyan",
  green: "text-accent-green",
  yellow: "text-accent-yellow",
  red: "text-accent-red",
};

const chipTone = {
  neutral: "bg-content-secondary/12 text-content-secondary",
  cyan: "bg-accent-cyan/15 text-accent-cyan",
  green: "bg-accent-green/15 text-accent-green",
  yellow: "bg-accent-yellow/15 text-accent-yellow",
  red: "bg-accent-red/15 text-accent-red",
};

export default function StatCard({ label, value, sublabel, icon: Icon, tone = "neutral" }: Props) {
  return (
    <div className="rounded-xl bg-navy-800 p-4">
      <div className="flex items-start justify-between gap-2">
        <span className="text-xs font-medium text-content-secondary">{label}</span>
        <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${chipTone[tone]}`}>
          <Icon size={16} aria-hidden="true" />
        </span>
      </div>
      <p className={`mt-3 text-2xl font-semibold tracking-tight ${valueTone[tone]}`}>{value}</p>
      {sublabel && <p className="mt-0.5 text-xs text-content-muted">{sublabel}</p>}
    </div>
  );
}
