import { StatusBadge } from "@/components/ui/status-badge";
import type { ColumnDef } from "@tanstack/react-table";
import { TableActions } from "@/components/ui/table-actions";
import { SortableHeader } from "@/utils/sort-table-header";
import type { VariantValueResponse } from "@/types/product/VariantValue";
import { formatDate } from "@/utils/formatDate";

interface VariantValueColumnsProps {
    onEdit: (variantValue: VariantValueResponse) => void;
    onDelete: (id: number) => void;
}

export const VariantValueColumns = ({ onEdit, onDelete }: VariantValueColumnsProps): ColumnDef<VariantValueResponse>[] => [

    {
        accessorKey: "name",
        header: ({ column }) => <SortableHeader column={column} title="Name" />,
        cell: ({ row }) => <span className="font-semibold text-[#566a7f]">{row.original.name}</span>,
    },
    {
        accessorKey: "code",
        header: ({ column }) => <SortableHeader column={column} title="Code" />,
        cell: ({ row }) => <span className="font-semibold text-[#566a7f]">{row.original.code}</span>,
    },
    {
        accessorKey: "variantTypeName",
        header: ({ column }) => <SortableHeader column={column} title="Variant Type" />,
        cell: ({ row }) => <span className="font-semibold text-[#566a7f]">{row.original.variantTypeName}</span>,
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
