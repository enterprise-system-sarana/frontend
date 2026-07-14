import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import type { RoleResponse } from "@/types/users/Role";
import { Button } from "@/components/ui/button";
import type { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, PencilIcon, Trash2 } from "lucide-react";

interface RoleColumnsProps {
    onEdit: (role: RoleResponse) => void;
    onDelete: (id: number) => void;
    canEdit: boolean;
    canDelete: boolean;
}

export const RoleColumns = ({ onEdit, onDelete, canEdit, canDelete }: RoleColumnsProps): ColumnDef<RoleResponse>[] => [
    {
        accessorKey: "id",
        header: "Id",
        cell: ({ row }) => <p>{row.original.id}</p>,
    },
    {
        accessorKey: "code",
        header: "Code",
        cell: ({ row }) => <p>{row.original.code}</p>,
    },
    {
        accessorKey: "name",
        header: "Name",
        cell: ({ row }) => <p>{row.original.name}</p>,
    },
    {
        accessorKey: "description",
        header: "Description",
        cell: ({ row }) => <p className="truncate max-w-48">{row.original.description}</p>,
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
                            <DropdownMenuItem className="cursor-pointer" onClick={() => onEdit(row.original)}>
                                <PencilIcon className="mr-2 h-4 w-4" /> Edit
                            </DropdownMenuItem>
                        )}

                        {canDelete && (
                            <DropdownMenuItem className="cursor-pointer text-destructive" onClick={() => onDelete(row.original.id)}>
                                <Trash2 className="mr-2 h-4 w-4" /> Delete
                            </DropdownMenuItem>
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>
            );
        },
    },
];
