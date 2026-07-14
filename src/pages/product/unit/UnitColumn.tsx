import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, PencilIcon, Trash2 } from "lucide-react";
import { StatusBadge } from "@/components/ui/status-badge";
import type { UnitResponse } from "@/types/product/Unit";
import type { ColumnDef } from "@tanstack/react-table";
import { SortableHeader } from "@/utils/sort-table-header";

interface UnitColumnsProps {
    onEdit: (unit: UnitResponse) => void;
    onDelete: (id: number) => void;
    canEdit: boolean;
    canDelete: boolean;
}

export const unitColumn = ({ onEdit, onDelete, canEdit, canDelete }: UnitColumnsProps): ColumnDef<UnitResponse>[] => [{
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
    accessorKey: "code",
    header: ({ column }) => <SortableHeader column={column} title="Code" />,
    cell: ({ row }) => <p>{row.original.code}</p>
},
{
    accessorKey: "baseUnit",
    header: ({ column }) => <SortableHeader column={column} title="BaseUnit" />,
    cell: ({ row }) => <p>{row.original.baseUnit}</p>
},
{
    accessorKey: "operation",
    header: "Operation",
    cell: ({ row }) => <p>{row.original.operation}</p>
},
{
    accessorKey: "operationValue",
    header: "Operation Value",
    cell: ({ row }) => <p>{row.original.operationValue}</p>
},

{
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => <StatusBadge status={row.original.status} />
},
{
    accessorKey: "Action",
    header: "Action",
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