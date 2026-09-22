import type { CategoryResponse } from "@/types/product/Category";
import { StatusBadge } from "@/components/ui/status-badge";
import type { ColumnDef } from "@tanstack/react-table";
import { TableActions } from "@/components/ui/table-actions";
import { SortableHeader } from "@/utils/sort-table-header";
import ImageCell from "@/components/file/ImageCell";
import { formatDate } from "@/utils/formatDate";

interface CategoryColumnsProps {
    onEdit: (category: CategoryResponse) => void;
    onDelete: (id: number) => void;
}

export const CategoryColumns = ({ onEdit, onDelete
}: CategoryColumnsProps): ColumnDef<CategoryResponse>[] => [

        {
            accessorKey: "code",
            header: ({ column }) => <SortableHeader column={column} title="Code" />,
            cell: ({ row }) => <span className="text-xs text-mono font-semibold text-[#566a7f]">{row.original.code}</span>
        },
        {
            accessorKey: "name",
            header: ({ column }) => <SortableHeader column={column} title="Name" />,
            cell: ({ row }) => <span className="font-semibold text-[#566a7f]">{row.original.name}</span>
        },
        {
            accessorKey: "imageUrl",
            header: "Image",
            cell: ({ row }) => (
                <ImageCell fileName={row.original.imageUrl} name={row.original.name} bucketName="category" />
            )
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
