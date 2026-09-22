import { StatusBadge } from "@/components/ui/status-badge";
import type { ColumnDef } from "@tanstack/react-table";
import { TableActions } from "@/components/ui/table-actions";
import { SortableHeader } from "@/utils/sort-table-header";
import type { PaymentResponse } from "@/types/sales/Payment";
import { formatDate } from "@/utils/formatDate";

interface PaymentColumnsProps {
    onEdit: (payment: PaymentResponse) => void;
    onDelete: (id: number) => void;
}

const formatCurrency = (value: number) => `$${(Number(value) || 0).toFixed(2)}`;

export const PaymentColumns = ({ onEdit, onDelete }: PaymentColumnsProps): ColumnDef<PaymentResponse>[] => [

    {
        accessorKey: "paymentNo",
        header: ({ column }) => <SortableHeader column={column} title="Payment No" />,
        cell: ({ row }) => <span className="font-mono text-xs text-[#696cff]">{row.original.paymentNo}</span>
    },
    {
        accessorKey: "saleNo",
        header: "Sale",
        cell: ({ row }) => <span className="font-semibold text-[#566a7f]">{row.original.saleNo || row.original.saleId}</span>
    },
    {
        accessorKey: "paymentMethod",
        header: "Method",
        cell: ({ row }) => <span className="text-[#566a7f]">{row.original.paymentMethod}</span>
    },
    {
        accessorKey: "amount",
        header: "Amount",
        cell: ({ row }) => <span className="font-semibold text-[#566a7f]">{formatCurrency(row.original.amount)}</span>
    },
    {
        accessorKey: "paymentDate",
        header: ({ column }) => <SortableHeader column={column} title="Date" />,
        cell: ({ row }) => <span className="text-xs text-[#566a7f]">{formatDate(row.original.paymentDate)}</span>
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
