import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import type { ColumnDef } from "@tanstack/react-table";
import { MoreVertical, PencilIcon, Trash2 } from "lucide-react";
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
        accessorKey: "id",
        header: "Id",
        cell: ({ row }) => <span className="font-semibold text-[#566a7f]">#{row.original.id}</span>
    },
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
    // {
    //     accessorKey: "note",
    //     header: "Note",
    //     cell: ({ row }) => <span className="text-[#566a7f] max-w-[160px] truncate block">{row.original.note || row.original.description || "-"}</span>
    // },
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
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0 text-[#697a8d] hover:text-[#566a7f] hover:bg-[#f5f5f9]">
                            <span className="sr-only">Open menu</span>
                            <MoreVertical className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40 shadow-[0_3px_12px_rgba(67,89,113,0.15)] border-[#e7e7e8]">
                        <DropdownMenuItem className="cursor-pointer text-[#697a8d] focus:text-[#696cff] focus:bg-[#696cff]/8" onClick={() => onEdit(row.original)}>
                            <PencilIcon className="mr-2 h-4 w-4" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem className="cursor-pointer text-[#ff3e1d] focus:text-[#ff3e1d] focus:bg-[#ff3e1d]/8" onClick={() => onDelete(row.original.id)}>
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            );
        },
    }
];
