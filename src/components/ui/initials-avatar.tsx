import { cn } from "@/lib/utils";

/** Soft avatar palettes from the Figma tables (100 fill / 700 text). */
const palettes = [
  "bg-[#dbebfa] text-[#0b4a82] dark:bg-sky-500/15 dark:text-sky-300",
  "bg-[#d3f2de] text-[#166534] dark:bg-emerald-500/15 dark:text-emerald-300",
  "bg-[#fdecc0] text-[#9a5b00] dark:bg-amber-500/15 dark:text-amber-300",
  "bg-[#e5f6fa] text-[#0a6e89] dark:bg-cyan-500/15 dark:text-cyan-300",
  "bg-[#e6dfff] text-[#5b3fd6] dark:bg-violet-500/15 dark:text-violet-300",
  "bg-[#fee1de] text-[#9b0512] dark:bg-red-500/15 dark:text-red-300",
];

const initialsOf = (name: string) =>
  name
    .trim()
    .split(/[\s._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "?";

/** Round avatar with initials; the colour is stable per name. */
export function InitialsAvatar({ name, className }: { name: string; className?: string }) {
  const hash = [...name].reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
        palettes[hash % palettes.length],
        className
      )}
    >
      {initialsOf(name)}
    </span>
  );
}

/** Avatar + name (+ optional secondary line) for table cells. */
export function PersonCell({ name, subtitle }: { name: string; subtitle?: string }) {
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <InitialsAvatar name={name} />
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-foreground">{name}</p>
        {subtitle && <p className="truncate text-xs text-muted-foreground">{subtitle}</p>}
      </div>
    </div>
  );
}
