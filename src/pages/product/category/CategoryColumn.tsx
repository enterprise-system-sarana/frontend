import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import type { CategoryResponse } from "@/types/product/Category";

import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";

import type { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, PencilIcon, Trash2 } from "lucide-react";
import { SortableHeader } from "@/utils/sort-table-header";


interface CategoryColumnsProps {
    onEdit: (category: CategoryResponse) => void;
    onDelete: (id: number) => void;
    canEdit: boolean;
    canDelete: boolean;
}

export const CategoryColumns = ({ onEdit, onDelete, canEdit, canDelete }: CategoryColumnsProps): ColumnDef<CategoryResponse>[] => [
    {
        accessorKey: "id",
        header: "Id",
        cell: ({ row }) => <p>{row.original.id}</p>
    },
    {
        accessorKey: "name",
        header: ({ column }) => <SortableHeader column={column} title="Code" />,
        cell: ({ row }) => <p>{row.original.name}</p>
    },
    {
        accessorKey: "code",
        header: ({ column }) => <SortableHeader column={column} title="Code" />,
        cell: ({ row }) => <p>{row.original.code}</p>
    },
    {
        accessorKey: "imageUrl",
        header: "Image",
        cell: ({ row }) => {
            const url = row.original.imageUrl;
            return url ? (
                <img src={url} alt={row.original.name} className="w-10 h-10 rounded-md object-cover border" />
            ) : (
                <div className="w-10 h-10 rounded-md bg-muted flex items-center justify-center text-[10px] text-muted-foreground border">
                    No img
                </div>
            );
        }
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
                return <span className="text-muted-foreground text-sm">-</span>;
            }
            return (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        {canEdit && (
                            <DropdownMenuItem className="cursor-pointer" onClick={() => onEdit(row.original)}><PencilIcon className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>
                        )}
                        {canDelete && (
                            <DropdownMenuItem className="cursor-pointer text-destructive" onClick={() => onDelete(row.original.id)}><Trash2 className="mr-2 h-4 w-4" />Delete</DropdownMenuItem>
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>
            );
        },
    }
]
