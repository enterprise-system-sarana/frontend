import { StatusBadge } from "@/components/ui/status-badge";
import type { ColumnDef } from "@tanstack/react-table";
import { TableActions } from "@/components/ui/table-actions";
import { SortableHeader } from "@/utils/sort-table-header";
import type { VariantTypeResponse } from "@/types/product/VariantType";
import { formatDate } from "@/utils/formatDate";

import type { TranslationKey } from "@/i18n/locales/en";

interface VariantTypeColumnsProps {
    onView: (variantType: VariantTypeResponse) => void;
    onEdit: (variantType: VariantTypeResponse) => void;
    onDelete: (id: number) => void;
    onRestore?: (variantType: VariantTypeResponse) => void;
    t?: (key: TranslationKey, fallback?: string) => string;
}

export const VariantTypeColumns = ({
    onView,
    onEdit,
    onDelete,
    onRestore,
    t,
}: VariantTypeColumnsProps): ColumnDef<VariantTypeResponse>[] => [

    {
        accessorKey: "name",
        header: ({ column }) => <SortableHeader column={column} title={t ? t("common.name") : "Name"} />,
        cell: ({ row }) => <span className="font-medium text-foreground">{row.original.name}</span>,
    },
    {
        accessorKey: "code",
        header: ({ column }) => <SortableHeader column={column} title={t ? t("common.code") : "Code"} />,
        cell: ({ row }) => (
            <span className="tabular-nums text-xs font-medium text-text-secondary">
                {row.original.code || "-"}
            </span>
        ),
    },
    {
        accessorKey: "values",
        header: t ? t("variant.values") : "Values",
        cell: ({ row }) => {
            const values = row.original.values || [];
            if (values.length === 0) {
                return <span className="text-muted-foreground text-xs italic">{t ? t("variant.no_values") : "No values"}</span>;
            }
            return (
                <div className="flex flex-wrap items-center gap-1 max-w-[280px]">
                    {values.map((v) => (
                        <span
                            key={v.id}
                            className="inline-flex items-center px-2 py-0.5 rounded-md text-[12px] font-medium bg-primary/10 text-primary border border-primary/20"
                        >
                            {v.name}
                        </span>
                    ))}
                </div>
            );
        },
    },
    {
        accessorKey: "createdAt",
        header: ({ column }) => <SortableHeader column={column} title={t ? t("common.created_at") : "Created Date"} />,
        cell: ({ row }) => <span className="text-xs text-text-secondary">{formatDate(row.original.createdAt)}</span>,
    },
    {
        accessorKey: "status",
        header: t ? t("common.status") : "Status",
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
        accessorKey: "Action",
        header: t ? t("common.action") : "Action",
        enableHiding: false,
        cell: ({ row }) => {
            const isInactive = row.original.status === "INA" || row.original.status === "INACTIVE";
            return (
                <TableActions
                    onView={() => onView(row.original)}
                    onEdit={() => onEdit(row.original)}
                    onDelete={() => onDelete(row.original.id)}
                    onRestore={isInactive && onRestore ? () => onRestore(row.original) : undefined}
                    t={t}
                />
            );
        },
    },
];

export const VariantTypeColumn = VariantTypeColumns;
