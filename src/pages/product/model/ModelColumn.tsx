import { StatusBadge } from "@/components/ui/status-badge";
import type { ColumnDef } from "@tanstack/react-table";
import { TableActions } from "@/components/ui/table-actions";
import { SortableHeader } from "@/utils/sort-table-header";
import type { ModelResponse } from "@/types/product/Model";
import { formatDate } from "@/utils/formatDate";

interface ModelColumnsProps {
    onEdit: (model: ModelResponse) => void;
    onDelete: (id: number) => void;
}

export const ModelColumns = ({ onEdit, onDelete
}: ModelColumnsProps): ColumnDef<ModelResponse>[] => [

        {
            accessorKey: "name",
            header: ({ column }) => <SortableHeader column={column} title="Name" />,
            cell: ({ row }) => <span className="font-semibold text-[#566a7f]">{row.original.name}</span>
        },

        {
            accessorKey: "brandName",
            header: ({ column }) => <SortableHeader column={column} title="Brand" />,
            cell: ({ row }) => <span className="font-semibold text-[#566a7f]">{row.original.brandName}</span>
        },

        {
            accessorKey: "categoryName",
            header: ({ column }) => <SortableHeader column={column} title="Category" />,
            cell: ({ row }) => <span className="font-semibold text-[#566a7f]">{row.original.categoryName}</span>
        },
        {
            accessorKey: "createdAt",
            header: ({ column }) => <SortableHeader column={column} title="Created Date" />,
            cell: ({ row }) => <span className="text-xs text-[#566a7f]">{formatDate(row.original.createdAt)}</span>
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
