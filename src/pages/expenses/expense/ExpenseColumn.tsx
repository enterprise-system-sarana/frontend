import { StatusBadge } from "@/components/ui/status-badge";
import type { ColumnDef } from "@tanstack/react-table";
import { TableActions } from "@/components/ui/table-actions";
import { SortableHeader } from "@/utils/sort-table-header";
import type { ExpenseResponse } from "@/types/expense/expense";
import { formatDate } from "@/utils/formatDate";

interface ExpenseColumnsProps {
    onEdit: (expense: ExpenseResponse) => void;
    onDelete: (id: number) => void;
}

const formatCurrency = (amount: number | undefined) => {
    if (amount === undefined || amount === null || isNaN(amount)) return "$0.00";
    return `$${Number(amount).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export const ExpenseColumns = ({ onEdit, onDelete }: ExpenseColumnsProps): ColumnDef<ExpenseResponse>[] => [

    {
        accessorKey: "reference",
        header: ({ column }) => <SortableHeader column={column} title="Reference" />,
        cell: ({ row }) => <span className="font-semibold text-[#566a7f] font-mono text-xs">{row.original.reference || "-"}</span>
    },
    {
        accessorKey: "expenseTypeName",
        header: ({ column }) => <SortableHeader column={column} title="Expense Type" />,
        cell: ({ row }) => (
            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
                {row.original.expenseTypeName || "-"}
            </span>
        )
    },
    {
        accessorKey: "amount",
        header: ({ column }) => <SortableHeader column={column} title="Amount" />,
        cell: ({ row }) => (
            <span className="font-bold text-foreground">
                {formatCurrency(row.original.amount)}
            </span>
        )
    },
    {
        accessorKey: "storeName",
        header: ({ column }) => <SortableHeader column={column} title="Store" />,
        cell: ({ row }) => <span className="text-[#566a7f]">{row.original.storeName || "-"}</span>
    },
    {
        accessorKey: "bankName",
        header: ({ column }) => <SortableHeader column={column} title="Bank" />,
        cell: ({ row }) => <span className="text-[#566a7f]">{row.original.bankName || "-"}</span>
    },
    {
        accessorKey: "createdAt",
        header: "Date",
        cell: ({ row }) => <span className="text-[#566a7f] text-xs">{formatDate(row.original.createdAt)}</span>
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
    }
];
