import { StatusBadge } from "@/components/ui/status-badge";
import type { ColumnDef } from "@tanstack/react-table";
import { TableActions } from "@/components/ui/table-actions";
import { SortableHeader } from "@/utils/sort-table-header";
import type { ExpenseTypeResponse } from "@/types/expense/expense.type";
import { formatDate } from "@/utils/formatDate";

import type { TranslationKey } from "@/i18n/locales/en";

interface ExpenseTypeColumnsProps {
    onEdit: (expenseType: ExpenseTypeResponse) => void;
    onDelete: (id: number) => void;
    t?: (key: TranslationKey, fallback?: string) => string;
}

export const ExpenseTypeColumns = ({ onEdit, onDelete, t }: ExpenseTypeColumnsProps): ColumnDef<ExpenseTypeResponse>[] => [

    {
        accessorKey: "code",
        header: ({ column }) => <SortableHeader column={column} title={t ? t("common.code") : "Code"} />,
        cell: ({ row }) => <span className="font-medium text-foreground">{row.original.code}</span>
    },
    {
        accessorKey: "name",
        header: ({ column }) => <SortableHeader column={column} title={t ? t("common.name") : "Name"} />,
        cell: ({ row }) => <span className="font-medium text-foreground">{row.original.name}</span>
    },
    {
        accessorKey: "description",
        header: ({ column }) => <SortableHeader column={column} title={t ? t("common.description") : "Description"} />,
        cell: ({ row }) => <span className="font-medium text-foreground">{row.original.description}</span>
    },
    {
        accessorKey: "createdAt",
        header: t ? t("common.created_date") : "Created Date",
        cell: ({ row }) => <span className="font-medium text-foreground">{formatDate(row.original.createdAt)}</span>
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
    }
];
