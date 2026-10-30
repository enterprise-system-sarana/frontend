import type { BankResponse } from "@/types/finance/Bank";
import type { ColumnDef } from "@tanstack/react-table";
import { TableActions } from "@/components/ui/table-actions";
import { SortableHeader } from "@/utils/sort-table-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatDate } from "@/utils/formatDate";
import type { TranslationKey } from "@/i18n/locales/en";

interface BankColumnsProps {
    onEdit: (bank: BankResponse) => void;
    onDelete: (id: number) => void;
    t?: (key: TranslationKey, fallback?: string) => string;
}

export const BankColumns = ({
    onEdit,
    onDelete,
    t,
}: BankColumnsProps): ColumnDef<BankResponse>[] => [

        {
            accessorKey: "name",
            header: ({ column }) => <SortableHeader column={column} title={t ? t("finance.bank") : "Bank Name"} />,
            cell: ({ row }) => <span className="font-medium text-foreground">{row.original.name}</span>,
        },
        {
            accessorKey: "accountName",
            header: t ? t("finance.account_name") : "Account Name",
            cell: ({ row }) => <span className="font-medium text-text-secondary">{row.original.accountName}</span>,
        },
        {
            accessorKey: "accountNumber",
            header: t ? t("finance.account_number") : "Account Number",
            cell: ({ row }) => <span className="tabular-nums text-xs text-muted-foreground">{row.original.accountNumber || "-"}</span>,
        },
        {
            accessorKey: "openingBalance",
            header: t ? t("finance.opening_balance") : "Opening Balance",
            cell: ({ row }) => <span className="text-muted-foreground text-xs">${row.original.openingBalance || "0.00"}</span>,
        },
        {
            accessorKey: "currentBalance",
            header: t ? t("finance.current_balance") : "Current Balance",
            cell: ({ row }) => <span className="font-semibold text-success">${row.original.currentBalance || "0.00"}</span>,
        },
        {
            accessorKey: "createdAt",
            header: ({ column }) => <SortableHeader column={column} title={t ? t("common.created_date") : "Created Date"} />,
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
