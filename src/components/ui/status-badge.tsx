import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/i18n/LanguageContext";

const statusConfig: Record<string, { labelKey?: "common.active" | "common.inactive" | "common.delete"; defaultLabel: string; className: string }> = {
    ACT: {
        labelKey: "common.active",
        defaultLabel: "Active",
        className:
            "bg-emerald-500/15 text-emerald-600 border-emerald-500/25 hover:bg-emerald-500/25 dark:text-emerald-400 font-medium rounded-lg",
    },
    ACTIVE: {
        labelKey: "common.active",
        defaultLabel: "Active",
        className:
            "bg-emerald-500/15 text-emerald-600 border-emerald-500/25 hover:bg-emerald-500/25 dark:text-emerald-400 font-medium rounded-lg",
    },
    INA: {
        labelKey: "common.inactive",
        defaultLabel: "Inactive",
        className:
            "bg-amber-500/15 text-amber-600 border-amber-500/25 hover:bg-amber-500/25 dark:text-amber-400 font-medium rounded-lg",
    },
    INACTIVE: {
        labelKey: "common.inactive",
        defaultLabel: "Inactive",
        className:
            "bg-amber-500/15 text-amber-600 border-amber-500/25 hover:bg-amber-500/25 dark:text-amber-400 font-medium rounded-lg",
    },
    DEL: {
        labelKey: "common.delete",
        defaultLabel: "Deleted",
        className:
            "bg-red-500/15 text-red-600 border-red-500/25 hover:bg-red-500/25 dark:text-red-400 font-medium rounded-lg",
    },
    DELETE: {
        labelKey: "common.delete",
        defaultLabel: "Deleted",
        className:
            "bg-red-500/15 text-red-600 border-red-500/25 hover:bg-red-500/25 dark:text-red-400 font-medium rounded-lg",
    },
    COMPLETED: {
        labelKey: undefined,
        defaultLabel: "Completed",
        className:
            "bg-emerald-500/15 text-emerald-600 border-emerald-500/25 hover:bg-emerald-500/25 dark:text-emerald-400 font-medium rounded-lg",
    },
    PENDING: {
        labelKey: undefined,
        defaultLabel: "Pending",
        className:
            "bg-amber-500/15 text-amber-600 border-amber-500/25 hover:bg-amber-500/25 dark:text-amber-400 font-medium rounded-lg",
    },
    CANCELLED: {
        labelKey: undefined,
        defaultLabel: "Cancelled",
        className:
            "bg-red-500/15 text-red-600 border-red-500/25 hover:bg-red-500/25 dark:text-red-400 font-medium rounded-lg",
    },
    RETURNED: {
        labelKey: undefined,
        defaultLabel: "Returned",
        className:
            "bg-purple-500/15 text-purple-600 border-purple-500/25 hover:bg-purple-500/25 dark:text-purple-400 font-medium rounded-lg",
    },
    PAID: {
        labelKey: undefined,
        defaultLabel: "Paid",
        className:
            "bg-emerald-500/15 text-emerald-600 border-emerald-500/25 hover:bg-emerald-500/25 dark:text-emerald-400 font-medium rounded-lg",
    },
    PARTIAL: {
        labelKey: undefined,
        defaultLabel: "Partial",
        className:
            "bg-blue-500/15 text-blue-600 border-blue-500/25 hover:bg-blue-500/25 dark:text-blue-400 font-medium rounded-lg",
    },
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
    const badgeClass = config?.className || "bg-muted text-muted-foreground border-border font-medium rounded-lg";

    return (
        <Badge variant="outline" className={cn(badgeClass, className)}>
            {label}
        </Badge>
    );
}
