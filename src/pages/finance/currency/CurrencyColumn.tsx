import type { CurrencyResponse } from "@/types/finance/Currency";
import type { ColumnDef } from "@tanstack/react-table";
import { TableActions } from "@/components/ui/table-actions";
import { SortableHeader } from "@/utils/sort-table-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatDate } from "@/utils/formatDate";

interface CurrencyColumnsProps {
    onEdit: (currency: CurrencyResponse) => void;
    onDelete: (id: number) => void;
    canEdit: boolean;
    canDelete: boolean;
}

export const CurrencyColumns = ({ onEdit, onDelete, canEdit, canDelete }: CurrencyColumnsProps): ColumnDef<CurrencyResponse>[] => [

    {
        accessorKey: "code",
        header: ({ column }) => <SortableHeader column={column} title="Code" />,
        cell: ({ row }) => <span className="font-mono text-xs text-[#696cff] font-bold">{row.original.code}</span>,
    },
    {
        accessorKey: "name",
        header: ({ column }) => <SortableHeader column={column} title="Currency Name" />,
        cell: ({ row }) => <span className="font-semibold text-[#566a7f]">{row.original.name}</span>,
    },
    {
        accessorKey: "rate",
        header: "Exchange Rate",
        cell: ({ row }) => <span className="font-medium text-[#71dd37]">{row.original.rate}</span>,
    },
    {
        accessorKey: "symbol",
        header: "Symbol",
        cell: ({ row }) => <span className="font-mono text-sm font-semibold text-[#566a7f]">{row.original.symbol || "-"}</span>,
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
            if (!canEdit && !canDelete) {
                return <span className="text-[#a1acb8] text-sm">-</span>;
            }
            return (
                <TableActions
              onEdit={() => onEdit(row.original)}
              onDelete={() => onDelete(row.original.id)}
            />
            );
        },
    },
];
