import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { StockResponse } from "@/types/inventory/Stock";
import { SortableHeader } from "@/utils/sort-table-header";
import type { ColumnDef } from "@tanstack/react-table";
import { MoreVertical, PencilIcon, Trash2 } from "lucide-react";
import { formatDate } from "@/utils/formatDate";

export interface StockColumnsProps {
    onEdit?: (stock: StockResponse) => void;
    onDelete?: (id: number) => void;
    canEdit?: boolean;
    canDelete?: boolean;
}

export const StockColumns = ({
    onEdit,
    onDelete,
    canEdit = true,
    canDelete = true,
}: StockColumnsProps): ColumnDef<StockResponse>[] => [
    {
        accessorKey: "id",
        header: "Id",
        cell: ({ row }) => (
            <span className="font-semibold text-muted-foreground">#{row.original.id}</span>
        ),
    },
    {
        accessorKey: "productName",
        header: ({ column }) => <SortableHeader column={column} title="Product" />,
        cell: ({ row }) => (
            <div className="flex flex-col">
                <span className="font-semibold text-foreground text-sm">
                    {row.original.productName || "-"}
                </span>
                <span className="text-[11px] text-muted-foreground font-mono">
                    Product ID: #{row.original.productId}
                </span>
            </div>
        ),
    },
    {
        accessorKey: "storeName",
        header: ({ column }) => <SortableHeader column={column} title="Store" />,
        cell: ({ row }) => (
            <div className="flex flex-col">
                <span className="font-medium text-foreground text-sm">
                    {row.original.storeName || "-"}
                </span>
                <span className="text-[11px] text-muted-foreground font-mono">
                    Store ID: #{row.original.storeId}
                </span>
            </div>
        ),
    },
    {
        accessorKey: "quantity",
        header: ({ column }) => <SortableHeader column={column} title="Quantity" />,
        cell: ({ row }) => {
            const qty = row.original.quantity ?? 0;
            const alertQty = row.original.alertQuantity ?? 0;
            const isLowStock = qty <= alertQty;

            return (
                <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        isLowStock
                            ? "bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20"
                            : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                    }`}
                >
                    {qty.toLocaleString()}
                </span>
            );
        },
    },
    {
        accessorKey: "alertQuantity",
        header: ({ column }) => <SortableHeader column={column} title="Alert Quantity" />,
        cell: ({ row }) => (
            <span className="font-medium text-muted-foreground text-sm">
                {row.original.alertQuantity?.toLocaleString() ?? "-"}
            </span>
        ),
    },
    {
        accessorKey: "reorderLevel",
        header: ({ column }) => <SortableHeader column={column} title="Reorder Level" />,
        cell: ({ row }) => (
            <span className="font-medium text-muted-foreground text-sm">
                {row.original.reorderLevel?.toLocaleString() ?? "-"}
            </span>
        ),
    },
    {
        accessorKey: "createdAt",
        header: ({ column }) => <SortableHeader column={column} title="Created Date" />,
        cell: ({ row }) => (
            <span className="text-xs text-muted-foreground">
                {formatDate(row.original.createdAt)}
            </span>
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
                        <Button
                            variant="ghost"
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground hover:bg-muted/80 rounded-lg"
                        >
                            <span className="sr-only">Open menu</span>
                            <MoreVertical className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        align="end"
                        className="w-40 shadow-lg border-border/60 rounded-xl"
                    >
                        {canEdit && onEdit && (
                            <DropdownMenuItem
                                className="cursor-pointer text-muted-foreground focus:text-primary focus:bg-primary/10 rounded-lg"
                                onClick={() => onEdit(row.original)}
                            >
                                <PencilIcon className="mr-2 h-4 w-4" /> Edit
                            </DropdownMenuItem>
                        )}
                        {canDelete && onDelete && (
                            <DropdownMenuItem
                                className="cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10 rounded-lg"
                                onClick={() => onDelete(row.original.id)}
                            >
                                <Trash2 className="mr-2 h-4 w-4" /> Delete
                            </DropdownMenuItem>
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>
            );
        },
    },
];
