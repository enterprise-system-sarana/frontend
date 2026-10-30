import { Banknote, Building2, CreditCard, FileText, QrCode, Wallet, type LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { statusToneClass, type StatusTone } from "@/components/ui/status-badge";
import { useLanguage } from "@/i18n/LanguageContext";
import { cn } from "@/lib/utils";

interface MethodStyle {
  labelKey: string;
  fallback: string;
  tone: StatusTone;
  icon: LucideIcon;
}

const METHOD_STYLES = {
  cash: { labelKey: "payment.badge_cash", fallback: "Cash", tone: "success", icon: Banknote },
  bank: { labelKey: "payment.badge_bank", fallback: "Bank Transfer", tone: "info", icon: Building2 },
  qr: { labelKey: "payment.badge_qr", fallback: "KHQR", tone: "purple", icon: QrCode },
  card: { labelKey: "payment.badge_card", fallback: "Card", tone: "cyan", icon: CreditCard },
  cheque: { labelKey: "payment.badge_cheque", fallback: "Cheque", tone: "warning", icon: FileText },
} satisfies Record<string, MethodStyle>;

/** Matches backend codes (CASH, BANK_TRANSFER, KHQR...); anything else, such as a bank name, keeps its own text. */
export function getMethodStyle(method?: string | null): MethodStyle | null {
  const value = String(method ?? "").toUpperCase();
  if (value.includes("CASH")) return METHOD_STYLES.cash;
  if (value.includes("QR")) return METHOD_STYLES.qr;
  if (value.includes("CARD") || value.includes("CREDIT") || value.includes("DEBIT")) return METHOD_STYLES.card;
  if (value.includes("CHEQUE") || value.includes("CHECK")) return METHOD_STYLES.cheque;
  if (value.includes("BANK") || value.includes("TRANSFER")) return METHOD_STYLES.bank;
  return null;
}

/** Icon tile colour for method rows that show the icon apart from a badge. */
export function getMethodToneClass(method?: string | null) {
  return statusToneClass[getMethodStyle(method)?.tone ?? "info"];
}

export function getMethodIcon(method?: string | null): LucideIcon {
  return getMethodStyle(method)?.icon ?? Wallet;
}

function MethodBadge({ method, className }: { method: string; className?: string }) {
  const { t } = useLanguage();
  const style = getMethodStyle(method);
  const Icon = style?.icon ?? Wallet;

  return (
    <Badge
      variant="outline"
      className={cn(
        "h-6 gap-1.5 rounded-full border-transparent px-2.5 font-medium whitespace-nowrap",
        statusToneClass[style?.tone ?? "neutral"],
        className,
      )}
    >
      <Icon className="size-3.5" strokeWidth={1.75} aria-hidden="true" />
      {style ? t(style.labelKey, style.fallback) : method}
    </Badge>
  );
}

/** Colour-coded payment method; a comma-separated value (split payment) renders one badge per method. */
export function PaymentMethodBadge({ method, className }: { method?: string | null; className?: string }) {
  const methods = Array.from(
    new Set(
      String(method ?? "")
        .split(/[,/|]/)
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  );

  if (methods.length === 0) return <span className="text-muted-foreground">—</span>;

  return (
    <div className={cn("flex flex-wrap items-center gap-1", className)}>
      {methods.map((item) => (
        <MethodBadge key={item} method={item} />
      ))}
    </div>
  );
}
