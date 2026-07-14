import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import type { CurrencyResponse } from "@/types/finance/Currency";
import { Button } from "@/components/ui/button";
import type { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, PencilIcon, Trash2 } from "lucide-react";
import { SortableHeader } from "@/utils/sort-table-header";
import { Badge } from "@/components/ui/badge";

interface CurrencyColumnsProps {
    onEdit: (currency: CurrencyResponse) => void;
    onDelete: (id: number) => void;
    canEdit: boolean;
    canDelete: boolean;
}

export const CurrencyColumns = ({ onEdit, onDelete, canEdit, canDelete }: CurrencyColumnsProps): ColumnDef<CurrencyResponse>[] => [
    {
        accessorKey: "id",
        header: "Id",
        cell: ({ row }) => <p>{row.original.id}</p>,
    },
    {
        accessorKey: "code",
        header: ({ column }) => <SortableHeader column={column} title="Code" />,
        cell: ({ row }) => <p className="font-semibold">{row.original.code}</p>,
    },
    {
        accessorKey: "name",
        header: ({ column }) => <SortableHeader column={column} title="Currency Name" />,
        cell: ({ row }) => <p>{row.original.name}</p>,
    },
    {
        accessorKey: "operation",
        header: "Operation",
        cell: ({ row }) => <p>{row.original.operation || "-"}</p>,
    },
    {
        accessorKey: "rate",
        header: "Exchange Rate",
        cell: ({ row }) => <p>{row.original.rate}</p>,
    },
    {
        accessorKey: "symbol",
        header: "Symbol",
        cell: ({ row }) => <p className="font-mono">{row.original.symbol || "-"}</p>,
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
