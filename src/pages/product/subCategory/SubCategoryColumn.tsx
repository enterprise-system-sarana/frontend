import type { SubCategoryResponse } from "@/types/product/SubCategory";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, PencilIcon, Trash2 } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import { StatusBadge } from "@/components/ui/status-badge";
import { SortableHeader } from "@/utils/sort-table-header";


interface SubCategoryColumnsProps {
    onEdit: (category: SubCategoryResponse) => void;
    onDelete: (id: number) => void;
    canEdit: boolean;
    canDelete: boolean;
}

export const subCategoryColumns = ({ onEdit, onDelete, canEdit, canDelete }: SubCategoryColumnsProps): ColumnDef<SubCategoryResponse>[] => [
    {
        accessorKey: "id",
        header: "Id",
        cell: ({ row }) => <p>{row.original.id}</p>
    },
    {
        accessorKey: "name",
        header: ({ column }) => <SortableHeader column={column} title="Name" />,
        cell: ({ row }) => <p>{row.original.name}</p>
    },
    {
        accessorKey: "categoryName",
        header: ({ column }) => <SortableHeader column={column} title="CategoryName" />,
        cell: ({ row }) => <p>{row.original.categoryName}</p>
    },
    {
        accessorKey: "status"
        , header: "Status",
        cell: ({ row }) => <StatusBadge status={row.original.status} />
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