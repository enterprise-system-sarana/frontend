import type { BankResponse } from "@/types/finance/Bank";
import type { ColumnDef } from "@tanstack/react-table";
import { TableActions } from "@/components/ui/table-actions";
import { SortableHeader } from "@/utils/sort-table-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatDate } from "@/utils/formatDate";

interface BankColumnsProps {
    onEdit: (bank: BankResponse) => void;
    onDelete: (id: number) => void;
}

export const BankColumns = ({
    onEdit,
    onDelete,
}: BankColumnsProps): ColumnDef<BankResponse>[] => [

        {
            accessorKey: "name",
            header: ({ column }) => <SortableHeader column={column} title="Bank Name" />,
            cell: ({ row }) => <span className="font-semibold text-[#566a7f]">{row.original.name}</span>,
        },
        {
            accessorKey: "accountName",
            header: "Account Name",
            cell: ({ row }) => <span className="font-medium text-[#566a7f]">{row.original.accountName}</span>,
        },
        {
            accessorKey: "accountNumber",
            header: "Account Number",
            cell: ({ row }) => <span className="font-mono text-xs text-[#697a8d]">{row.original.accountNumber || "-"}</span>,
        },
        {
            accessorKey: "openingBalance",
            header: "Opening Balance",
            cell: ({ row }) => <span className="text-muted-foreground text-xs">${row.original.openingBalance || "0.00"}</span>,
        },
        {
            accessorKey: "currentBalance",
            header: "Current Balance",
            cell: ({ row }) => <span className="font-semibold text-emerald-600 dark:text-emerald-400">${row.original.currentBalance || "0.00"}</span>,
        },
        {
            accessorKey: "createdAt",
            header: ({ column }) => <SortableHeader column={column} title="Created Date" />,
            cell: ({ row }) => <span className="text-xs text-[#566a7f]">{formatDate(row.original.createdAt)}</span>,
        },
        {
            accessorKey: "status",
            header: "Status",
            cell: ({ row }) => <StatusBadge status={row.original.status} />,
        },
        {
            accessorKey: "Action",
            header: "Action",
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
