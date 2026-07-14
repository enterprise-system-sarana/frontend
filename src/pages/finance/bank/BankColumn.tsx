import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import type { BankResponse } from "@/types/finance/Bank";
import { Button } from "@/components/ui/button";
import type { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, PencilIcon, Trash2 } from "lucide-react";
import { SortableHeader } from "@/utils/sort-table-header";
import { Badge } from "@/components/ui/badge";

interface BankColumnsProps {
    onEdit: (bank: BankResponse) => void;
    onDelete: (id: number) => void;
    canEdit: boolean;
    canDelete: boolean;
}

export const BankColumns = ({ onEdit, onDelete, canEdit, canDelete }: BankColumnsProps): ColumnDef<BankResponse>[] => [
    {
        accessorKey: "id",
        header: "Id",
        cell: ({ row }) => <p>{row.original.id}</p>,
    },
    {
        accessorKey: "name",
        header: ({ column }) => <SortableHeader column={column} title="Bank Name" />,
        cell: ({ row }) => <p className="font-medium">{row.original.name}</p>,
    },
    {
        accessorKey: "number",
        header: "Account Number",
        cell: ({ row }) => <p>{row.original.number || "-"}</p>,
    },
    {
        accessorKey: "amount",
        header: "Amount",
        cell: ({ row }) => <p>{row.original.amount || "0"}</p>,
    },
    {
        accessorKey: "isDefault",
        header: "Default",
        cell: ({ row }) => (
            <Badge variant={row.original.isDefault === "true" || row.original.isDefault === "ACTIVE" ? "default" : "outline"}>
                {row.original.isDefault === "true" ? "Yes" : "No"}
            </Badge>
        ),
    },
    {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
            <Badge variant={row.original.status === "ACTIVE" ? "success" : "destructive"}>
                {row.original.status}
            </Badge>
        ),
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
