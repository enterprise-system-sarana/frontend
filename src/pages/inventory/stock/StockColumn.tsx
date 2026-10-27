import type { StockResponse } from "@/types/inventory/Stock";
import { SortableHeader } from "@/utils/sort-table-header";
import type { ColumnDef } from "@tanstack/react-table";
import type { TranslationKey } from "@/i18n/locales/en";

export interface StockColumnsProps {
    onEdit?: (stock: StockResponse) => void;
    onDelete?: (id: number) => void;
    canEdit?: boolean;
    canDelete?: boolean;
    t?: (key: TranslationKey, fallback?: string) => string;
}

export const StockColumns = (props?: StockColumnsProps): ColumnDef<StockResponse>[] => {
    const t = props?.t;
    return [
        {
            accessorKey: "productName",
            header: ({ column }) => <SortableHeader column={column} title={t ? t("nav.product") : "Product"} />,
            cell: ({ row }) => (
                <div className="flex flex-col">
                    <span className="font-semibold text-foreground text-sm">
                        {row.original.productName || "-"}
                    </span>
                </div>
            ),
        },
        {
            accessorKey: "storeName",
            header: ({ column }) => <SortableHeader column={column} title={t ? t("inventory.store") : "Store"} />,
            cell: ({ row }) => (
                <div className="flex flex-col">
                    <span className="font-medium text-foreground text-sm">
                        {row.original.storeName || "-"}
                    </span>
                </div>
            ),
        },
        {
            accessorKey: "quantity",
            header: ({ column }) => <SortableHeader column={column} title={t ? t("common.quantity") : "Quantity"} />,
            cell: ({ row }) => {
                const qty = row.original.quantity ?? 0;
                const alertQty = row.original.alertQuantity ?? 0;
                const isLowStock = qty <= alertQty;

                return (
                    <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${isLowStock
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
            header: ({ column }) => <SortableHeader column={column} title={t ? t("inventory.alert_quantity") : "Alert Quantity"} />,
            cell: ({ row }) => (
                <span className="font-medium text-muted-foreground text-sm">
                    {row.original.alertQuantity?.toLocaleString() ?? "-"}
                </span>
            ),
        },
        {
            accessorKey: "status",
            header: ({ column }) => <SortableHeader column={column} title={t ? t("common.status") : "Status"} />,
            cell: ({ row }) => {
                const statusStr = row.original.status?.toUpperCase();
                const isInStock = statusStr === "IN STOCK" || statusStr === "IN_STOCK";
                const label = isInStock && t ? t("pos.in_stock") : !isInStock && t ? t("pos.out_of_stock") : row.original.status;
                return (
                    <span className={`font-medium text-sm ${isInStock ? "text-emerald-500" : "text-red-500"}`}>
                        {label ?? "-"}
                    </span>
                );
            },
        },
        {
            accessorKey: "reorderLevel",
            header: ({ column }) => <SortableHeader column={column} title={t ? t("product.reorder_level") : "Reorder Level"} />,
            cell: ({ row }) => (
                <span className="font-medium text-muted-foreground text-sm">
                    {row.original.reorderLevel?.toLocaleString() ?? "-"}
                </span>
            ),
        },
    ];
};
