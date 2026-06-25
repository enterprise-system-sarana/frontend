import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import type { CategoryResponse } from "@/types/product/Category";

import { Button } from "@/components/ui/button";


import type { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, PencilIcon, Trash2 } from "lucide-react";

interface CategoryColumnsProps {
    onEdit: (category: CategoryResponse) => void;
    onDelete: (id: number) => void;
}

export const CategoryColumns = ({ onEdit, onDelete }: CategoryColumnsProps): ColumnDef<CategoryResponse>[] => [
    {
        accessorKey: "id",
        header: "Id",
        cell: ({ row }) => <p>{row.original.id}</p>
    },
    {
        accessorKey: "name",
        header: "Name",
        cell: ({ row }) => <p>{row.original.name}</p>
    },
    {
        accessorKey: "description",
        header: "Description",
        cell: ({ row }) => <p className="truncate max-w-48">{row.original.description}</p>
    },
    {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => <p>{row.original.status}</p>
    },
    {
        accessorKey: "Action",
        header: "Action",
        enableHiding: false,
        cell: ({ row }) => (
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem className="cursor-pointer" onClick={() => onEdit(row.original)}><PencilIcon className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>
                    <DropdownMenuItem className="cursor-pointer" onClick={() => onDelete(row.original.id)}><Trash2 className="mr-2 h-4 w-4" />Delete</DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        ),
    }
]
