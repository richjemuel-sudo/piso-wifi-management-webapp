type Tone = "online" | "paused" | "active" | "used" | "expired";

const styles: Record<Tone, string> = {
  online:  "bg-accent-green/15 text-accent-green",
  active:  "bg-accent-green/15 text-accent-green",
  paused:  "bg-accent-yellow/15 text-accent-yellow",
  used:    "bg-accent-cyan/15 text-accent-cyan",
  expired: "bg-content-muted/15 text-content-muted",
};

const labels: Record<Tone, string> = {
  online: "Online", paused: "Paused", active: "Active",
  used: "Used", expired: "Expired",
};

export default function StatusPill({ tone }: { tone: Tone }) {
  return (
    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${styles[tone]}`}>
      {labels[tone]}
    </span>
  );
}
