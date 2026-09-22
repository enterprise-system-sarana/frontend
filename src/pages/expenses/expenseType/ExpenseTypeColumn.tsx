import { StatusBadge } from "@/components/ui/status-badge";
import type { ColumnDef } from "@tanstack/react-table";
import { TableActions } from "@/components/ui/table-actions";
import { SortableHeader } from "@/utils/sort-table-header";
import type { ExpenseTypeResponse } from "@/types/expense/expense.type";
import { formatDate } from "@/utils/formatDate";

interface ExpenseTypeColumnsProps {
    onEdit: (expenseType: ExpenseTypeResponse) => void;
    onDelete: (id: number) => void;
}

export const ExpenseTypeColumns = ({ onEdit, onDelete }: ExpenseTypeColumnsProps): ColumnDef<ExpenseTypeResponse>[] => [

    {
        accessorKey: "code",
        header: ({ column }) => <SortableHeader column={column} title="Code" />,
        cell: ({ row }) => <span className="font-semibold text-[#566a7f]">{row.original.code}</span>
    },
    {
        accessorKey: "name",
        header: ({ column }) => <SortableHeader column={column} title="Name" />,
        cell: ({ row }) => <span className="font-semibold text-[#566a7f]">{row.original.name}</span>
    },
    {
        accessorKey: "description",
        header: ({ column }) => <SortableHeader column={column} title="Description" />,
        cell: ({ row }) => <span className="font-semibold text-[#566a7f]">{row.original.description}</span>
    },
    {
        accessorKey: "createdAt",
        header: "Created Date",
        cell: ({ row }) => <span className="font-semibold text-[#566a7f]">{formatDate(row.original.createdAt)}</span>
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
