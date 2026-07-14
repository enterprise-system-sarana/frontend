import { Badge } from "@/components/ui/badge";
import { Status } from "@/types/enum/status";
import { cn } from "@/lib/utils";

const statusConfig: Record<Status, { label: string; className: string }> = {
    [Status.Active]: {
        label: "Active",
        className:
            "bg-emerald-500/15 text-emerald-600 border-emerald-500/25 hover:bg-emerald-500/25 dark:text-emerald-400",
    },
    [Status.Inactive]: {
        label: "Inactive",
        className:
            "bg-red-500/15 text-red-600 border-red-500/25 hover:bg-red-500/25 dark:text-red-400",
    },
};

interface StatusBadgeProps {
    status: Status;
    className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
    const config = statusConfig[status];

    return (
        <Badge variant="outline" className={cn(config.className, className)}>
            {config.label}
        </Badge>
    );
}
