import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Label/value grid for detail pop-ups (e.g. reference, date, processed by). */
export function DetailGrid({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <dl className={cn("grid grid-cols-2 gap-x-6 gap-y-4 rounded-xl border border-border bg-muted/40 p-4", className)}>
      {children}
    </dl>
  );
}

export function DetailItem({ label, children, className }: { label: ReactNode; children: ReactNode; className?: string }) {
  return (
    <div className={cn("min-w-0 space-y-1", className)}>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="truncate text-sm font-medium text-foreground">{children}</dd>
    </div>
  );
}

/** Section title inside a pop-up body. */
export function DetailSection({ title, children, className }: { title: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cn("space-y-2.5", className)}>
      <h4 className="text-sm font-semibold text-foreground">{title}</h4>
      {children}
    </section>
  );
}

/** One line of a totals summary; `emphasis` renders the bold grand-total style. */
export function SummaryRow({
  label,
  children,
  emphasis = false,
}: {
  label: ReactNode;
  children: ReactNode;
  emphasis?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-4 text-sm",
        emphasis ? "border-t border-border pt-3 text-base font-semibold text-foreground" : "text-muted-foreground"
      )}
    >
      <span>{label}</span>
      <span className="text-foreground">{children}</span>
    </div>
  );
}
