import { cn } from "@/lib/utils";

/** Formats a number as USD, e.g. 1234.5 → "$1,234.50". */
export const formatMoney = (value: number | string | null | undefined, symbol = "$") => {
  const amount = Number(value ?? 0);
  return `${symbol}${(Number.isFinite(amount) ? amount : 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

const toneClass = {
  default: "text-foreground",
  muted: "text-muted-foreground",
  success: "text-success",
  warning: "text-[#9a5b00] dark:text-amber-300",
  danger: "text-destructive",
} as const;

export type MoneyTone = keyof typeof toneClass;

interface MoneyProps {
  /** Pre-formatted text, or a number formatted with `formatMoney`. */
  value: number | string | null | undefined;
  tone?: MoneyTone;
  className?: string;
}

/** Amount with tabular figures so columns of numbers line up. */
export function Money({ value, tone = "default", className }: MoneyProps) {
  const text = typeof value === "string" && Number.isNaN(Number(value)) ? value : formatMoney(value);
  return (
    <span className={cn("font-semibold tabular-nums whitespace-nowrap", toneClass[tone], className)}>
      {text}
    </span>
  );
}

export default Money;
