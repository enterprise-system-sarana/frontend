import { StatusBadge } from "@/components/ui/status-badge";
import type { ColumnDef } from "@tanstack/react-table";
import { TableActions } from "@/components/ui/table-actions";
import { SortableHeader } from "@/utils/sort-table-header";
import type { VariantValueResponse } from "@/types/product/VariantValue";
import { formatDate } from "@/utils/formatDate";

import type { TranslationKey } from "@/i18n/locales/en";

interface VariantValueColumnsProps {
    onEdit: (variantValue: VariantValueResponse) => void;
    onDelete: (id: number) => void;
    t?: (key: TranslationKey, fallback?: string) => string;
}

export const VariantValueColumns = ({ onEdit, onDelete, t }: VariantValueColumnsProps): ColumnDef<VariantValueResponse>[] => [

    {
        accessorKey: "name",
        header: ({ column }) => <SortableHeader column={column} title={t ? t("common.name") : "Name"} />,
        cell: ({ row }) => <span className="font-medium text-foreground">{row.original.name}</span>,
    },
    {
        accessorKey: "code",
        header: ({ column }) => <SortableHeader column={column} title={t ? t("common.code") : "Code"} />,
        cell: ({ row }) => <span className="font-medium text-foreground">{row.original.code}</span>,
    },
    {
        accessorKey: "variantTypeName",
        header: ({ column }) => <SortableHeader column={column} title={t ? t("variant.type") : "Variant Type"} />,
        cell: ({ row }) => <span className="font-medium text-foreground">{row.original.variantTypeName}</span>,
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
            return (
                <TableActions
              onEdit={() => onEdit(row.original)}
              onDelete={() => onDelete(row.original.id)}
            />
            );
        },
    },
];
