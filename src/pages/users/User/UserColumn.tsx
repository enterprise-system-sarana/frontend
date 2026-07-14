import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import type { UserResponse } from "@/types/users/Users";
import { Button } from "@/components/ui/button";
import type { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, PencilIcon, Trash2 } from "lucide-react";
import { StatusBadge } from "@/components/ui/status-badge";
import { Status } from "@/types/enum/status";

interface UserColumnsProps {
    onEdit: (user: UserResponse) => void;
    onDelete: (id: number) => void;
    canEdit: boolean;
    canDelete: boolean;
}

export const UserColumns = ({ onEdit, onDelete, canEdit, canDelete }: UserColumnsProps): ColumnDef<UserResponse>[] => [
    {
        accessorKey: "id",
        header: "Id",
        cell: ({ row }) => <p>{row.original.id}</p>,
    },
    {
        accessorKey: "username",
        header: "Username",
        cell: ({ row }) => <p>{row.original.username}</p>,
    },
    {
        accessorKey: "email",
        header: "Email",
        cell: ({ row }) => <p>{row.original.email}</p>,
    },
    {
        accessorKey: "isActive",
        header: "Status",
        cell: ({ row }) => <StatusBadge status={row.original.isActive ? Status.Active : Status.Inactive} />,
    },
    {
        accessorKey: "roles",
        header: "Roles",
        cell: ({ row }) => <p >{row.original.roles?.join(", ")}</p>,
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
