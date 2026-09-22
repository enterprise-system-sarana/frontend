import type { StockResponse } from "@/types/inventory/Stock";
import { SortableHeader } from "@/utils/sort-table-header";
import type { ColumnDef } from "@tanstack/react-table";
import { TableActions } from "@/components/ui/table-actions";
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
        accessorKey: "status",
        header: ({ column }) => <SortableHeader column={column} title="Status" />,
        cell: ({ row }) => (
            <span className={`font-medium text-muted-foreground text-sm ${row.original.status === "IN STOCK" ? "text-emerald-500" : "text-red-500"}`}>
                {row.original.status?.toLocaleString() ?? "-"}
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
                <TableActions
              onEdit={() => onEdit(row.original)}
              onDelete={() => onDelete(row.original.id)}
            />
            );
        },
    },
];
