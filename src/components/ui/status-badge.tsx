import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/i18n/LanguageContext";
import type { TranslationKey } from "@/i18n/locales/en";

/** Soft status pills (100 fill / 700 text) — calm enough for dense tables. */
export const statusToneClass = {
    success: "bg-[#d3f2de] text-[#166534] dark:bg-emerald-500/15 dark:text-emerald-300",
    warning: "bg-[#fdecc0] text-[#9a5b00] dark:bg-amber-500/15 dark:text-amber-300",
    danger: "bg-[#fee1de] text-[#9b0512] dark:bg-red-500/15 dark:text-red-300",
    info: "bg-primary-light text-primary dark:bg-sky-500/15 dark:text-sky-300",
    purple: "bg-[#e6dfff] text-[#5b3fd6] dark:bg-violet-500/15 dark:text-violet-300",
    cyan: "bg-[#e5f6fa] text-[#0a6e89] dark:bg-cyan-500/15 dark:text-cyan-300",
    neutral: "bg-muted text-text-secondary",
} as const;

export type StatusTone = keyof typeof statusToneClass;

const statusConfig: Record<string, { labelKey?: TranslationKey; defaultLabel: string; tone: StatusTone }> = {
    ACT: { labelKey: "common.active", defaultLabel: "Active", tone: "success" },
    ACTIVE: { labelKey: "common.active", defaultLabel: "Active", tone: "success" },
    INA: { labelKey: "common.inactive", defaultLabel: "Inactive", tone: "warning" },
    INACTIVE: { labelKey: "common.inactive", defaultLabel: "Inactive", tone: "warning" },
    DEL: { labelKey: "common.deleted", defaultLabel: "Deleted", tone: "danger" },
    DELETE: { labelKey: "common.deleted", defaultLabel: "Deleted", tone: "danger" },
    COMPLETED: { labelKey: "common.completed", defaultLabel: "Completed", tone: "success" },
    PENDING: { labelKey: "common.pending", defaultLabel: "Pending", tone: "warning" },
    CANCELLED: { labelKey: "common.cancelled", defaultLabel: "Cancelled", tone: "danger" },
    RETURNED: { labelKey: "common.returned", defaultLabel: "Returned", tone: "purple" },
    PARTIAL_RETURNED: { labelKey: "common.partial_returned", defaultLabel: "Partial Returned", tone: "cyan" },
    PAID: { labelKey: "common.paid", defaultLabel: "Paid", tone: "success" },
    PARTIAL: { labelKey: "common.partial", defaultLabel: "Partial", tone: "info" },
    OPEN: { labelKey: "common.open", defaultLabel: "Open", tone: "success" },
    CLOSED: { labelKey: "common.closed", defaultLabel: "Closed", tone: "neutral" },
    IN_STOCK: { labelKey: "pos.in_stock" as TranslationKey, defaultLabel: "In Stock", tone: "success" },
    LOW_STOCK: { labelKey: "pos.low_stock" as TranslationKey, defaultLabel: "Low Stock", tone: "warning" },
    OUT_OF_STOCK: { labelKey: "pos.out_of_stock" as TranslationKey, defaultLabel: "Out of Stock", tone: "danger" },
};

interface StatusBadgeProps {
    status?: string | null;
    className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
    const { t } = useLanguage();
    if (!status) return <span className="text-muted-foreground text-xs">-</span>;

    const normalizedStatus = status.toString().toUpperCase();
    const config = statusConfig[normalizedStatus];

    const label = config?.labelKey ? t(config.labelKey, config.defaultLabel) : status;
    const tone = config?.tone ?? "neutral";

    return (
        <Badge variant="outline" className={cn("h-6 gap-1.5 rounded-full border-transparent px-2.5 font-medium", statusToneClass[tone], className)}>
            <span aria-hidden="true" className="size-1.5 rounded-full bg-current" />
            {label}
        </Badge>
    );
}
