import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/** Colour sets from the Figma KPI cards (icon tile gradient, gauge colour, corner tint). */
const tones = {
  blue: { soft: "bg-primary-light text-primary", tile: "from-[#3980c4] to-[#0b4a82]", glow: "rgba(11,74,130,0.28)", gauge: "stroke-primary", text: "text-primary", tint: "11,74,130" },
  green: { soft: "bg-[#d3f2de] text-[#166534] dark:bg-emerald-500/15 dark:text-emerald-300", tile: "from-[#299452] to-[#14803d]", glow: "rgba(20,128,61,0.28)", gauge: "stroke-[#15803d] dark:stroke-emerald-300", text: "text-[#15803d] dark:text-emerald-300", tint: "20,128,61" },
  amber: { soft: "bg-[#fdecc0] text-[#9a5b00] dark:bg-amber-500/15 dark:text-amber-300", tile: "from-[#f7b733] to-[#d98c00]", glow: "rgba(217,140,0,0.28)", gauge: "stroke-[#f5a300] dark:stroke-amber-300", text: "text-[#9a5b00] dark:text-amber-300", tint: "245,163,0" },
  red: { soft: "bg-[#fee1de] text-[#9b0512] dark:bg-red-500/15 dark:text-red-300", tile: "from-[#e0384a] to-[#c10517]", glow: "rgba(193,5,23,0.28)", gauge: "stroke-[#c10517] dark:stroke-red-300", text: "text-[#c10517] dark:text-red-300", tint: "193,5,23" },
  cyan: { soft: "bg-[#e5f6fa] text-[#0a6e89] dark:bg-cyan-500/15 dark:text-cyan-300", tile: "from-[#2a9cbb] to-[#0a6e89]", glow: "rgba(10,110,137,0.28)", gauge: "stroke-[#0a6e89] dark:stroke-cyan-300", text: "text-[#0a6e89] dark:text-cyan-300", tint: "10,110,137" },
  purple: { soft: "bg-[#e6dfff] text-[#5b3fd6] dark:bg-violet-500/15 dark:text-violet-300", tile: "from-[#8a6ff0] to-[#5b3fd6]", glow: "rgba(91,63,214,0.28)", gauge: "stroke-[#5b3fd6] dark:stroke-violet-300", text: "text-[#5b3fd6] dark:text-violet-300", tint: "91,63,214" },
} as const;

export type KpiTone = keyof typeof tones;

export interface KpiSplit {
  label: string;
  value: number;
  color: string;
}

interface KpiCardProps {
  icon: LucideIcon;
  title: ReactNode;
  subtitle?: ReactNode;
  value: ReactNode;
  /** Small text beside (featured) or under (default) the value, e.g. "of total". */
  caption?: ReactNode;
  tone?: KpiTone;
  /** 0–100; renders the semi-circle gauge on default cards. */
  percent?: number;
  /** Featured (brand gradient) card with a split bar + legend. */
  featured?: boolean;
  splits?: KpiSplit[];
  className?: string;
}

function KpiGauge({ percent, strokeClass, textClass }: { percent: number; strokeClass: string; textClass: string }) {
  const clamped = Math.max(0, Math.min(100, percent));
  return (
    <div className="relative h-12 w-[84px] shrink-0" role="img" aria-label={`${clamped.toFixed(0)}%`}>
      <svg viewBox="0 0 84 48" className="size-full" aria-hidden="true">
        <path d="M 8 44 A 34 34 0 0 1 76 44" fill="none" stroke="var(--border)" strokeWidth="8" strokeLinecap="round" />
        {clamped > 0 && (
          <path
            d="M 8 44 A 34 34 0 0 1 76 44"
            fill="none"
            className={strokeClass}
            strokeWidth="8"
            strokeLinecap="round"
            pathLength={100}
            strokeDasharray={`${clamped} 100`}
          />
        )}
      </svg>
      <span className={cn("absolute inset-x-0 bottom-0 text-center text-[14px] leading-4 font-semibold", textClass)}>
        {Math.round(clamped)}%
      </span>
    </div>
  );
}

export function KpiCard({
  icon: Icon,
  title,
  subtitle,
  value,
  caption,
  tone = "blue",
  percent,
  featured = false,
  splits,
  className,
}: KpiCardProps) {
  const t = tones[tone];

  if (featured) {
    const total = splits?.reduce((sum, split) => sum + Math.max(0, split.value), 0) ?? 0;
    return (
      <div
        className={cn(
          "flex min-h-[148px] flex-col justify-between gap-4 overflow-hidden rounded-2xl p-5 text-white",
          "bg-[linear-gradient(150deg,var(--featured-from)_0%,var(--featured-via)_55%,var(--featured-to)_100%)] shadow-[0_6px_16px_-6px_color-mix(in_srgb,var(--featured-via)_35%,transparent)]",
          className
        )}
      >
        <div className="flex items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/14">
            <Icon className="size-5" strokeWidth={1.75} />
          </div>
          <p className="truncate text-base font-medium">{title}</p>
        </div>

        <div className="flex items-baseline justify-between gap-3">
          <p className="text-[28px] leading-9 font-semibold tracking-[-0.01em]">{value}</p>
          {caption && <p className="truncate text-right text-[14px] text-white/75">{caption}</p>}
        </div>

        {splits && splits.length > 0 && (
          <div className="space-y-2.5">
            <div className="flex gap-0.5">
              {splits.map((split) => (
                <div
                  key={split.label}
                  className="h-1.5 min-w-1.5 rounded-[3px]"
                  style={{ backgroundColor: split.color, flexGrow: total > 0 ? Math.max(0, split.value) : 1, flexBasis: 0 }}
                />
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              {splits.map((split) => (
                <span key={split.label} className="flex items-center gap-1.5 text-xs text-white/80">
                  <span className="size-1.5 rounded-full" style={{ backgroundColor: split.color }} />
                  {split.label}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex min-h-[148px] flex-col justify-between gap-4 overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-card",
        className
      )}
    >
      <div className="flex items-center gap-3">
        <div
          className={cn("flex size-10 shrink-0 items-center justify-center rounded-xl", t.soft)}
        >
          <Icon className="size-5" strokeWidth={1.75} />
        </div>
        <div className="min-w-0">
          <p className="truncate text-base leading-6 font-semibold text-foreground">{title}</p>
          {subtitle && <p className="truncate text-[14px] leading-5 text-muted-foreground">{subtitle}</p>}
        </div>
      </div>

      <div className="flex items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-[28px] leading-9 font-bold tracking-[-0.01em] text-foreground">{value}</p>
          {caption && <p className="truncate text-[14px] text-muted-foreground">{caption}</p>}
        </div>
        {percent !== undefined && <KpiGauge percent={percent} strokeClass={t.gauge} textClass={t.text} />}
      </div>
    </div>
  );
}

/** Responsive row for KpiCards — same spacing and breakpoints on every page. */
export function KpiGrid({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("grid gap-4 sm:grid-cols-2 xl:grid-cols-[repeat(auto-fit,minmax(240px,1fr))]", className)}>
      {children}
    </div>
  );
}

export default KpiCard;
