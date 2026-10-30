import type { ColumnDef } from "@tanstack/react-table";
import { SortableHeader } from "@/utils/sort-table-header";
import { StatusBadge } from "@/components/ui/status-badge";

const formatCurrency = (value: number | string | undefined) => {
  const numeric = Number(value ?? 0);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(numeric);
};

export interface ProductSerialReportRow {
  id?: number;
  productId?: number;
  productName?: string;
  barcode?: string;
  storeName?: string;
  storeId?: number;
  status?: string;
  price?: number;
  cost?: number;
  quantity?: number;
  alertQuantity?: number;
  purchaseId?: number;
  createdAt?: string;
}

export const ProductSerialReportColumns = (
  props?: { t?: (key: any, fallback?: string) => string }
): ColumnDef<ProductSerialReportRow>[] => {
  const t = props?.t ?? ((_k: any, fallback?: string) => fallback ?? "");

  return [
    {
      accessorKey: "productName",
      header: ({ column }) => (
        <SortableHeader column={column} title={t("product.name", "Product")} />
      ),
      cell: ({ row }) => (
        <span className="font-medium text-foreground">
          {row.original.productName || "-"}
        </span>
      ),
    },
    {
      accessorKey: "barcode",
      header: ({ column }) => (
        <SortableHeader column={column} title={t("product.barcode", "Barcode")} />
      ),
      cell: ({ row }) => (
        <span className="tabular-nums text-xs text-primary">
          {row.original.barcode || "-"}
        </span>
      ),
    },
    {
      accessorKey: "storeName",
      header: ({ column }) => (
        <SortableHeader column={column} title={t("store.name", "Store")} />
      ),
      cell: ({ row }) => (
        <span className="font-medium text-foreground">
          {row.original.storeName || "-"}
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: t("common.status", "Status"),
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      accessorKey: "price",
      header: ({ column }) => (
        <SortableHeader column={column} title={t("product.price", "Price")} />
      ),
      cell: ({ row }) => (
        <span className="text-success font-medium">
          {formatCurrency(row.original.price)}
        </span>
      ),
    },
    {
      accessorKey: "cost",
      header: ({ column }) => (
        <SortableHeader column={column} title={t("product.cost", "Cost")} />
      ),
      cell: ({ row }) => (
        <span className="text-destructive font-medium">
          {formatCurrency(row.original.cost)}
        </span>
      ),
    },
    {
      accessorKey: "quantity",
      header: ({ column }) => (
        <SortableHeader column={column} title={t("product.quantity", "Qty")} />
      ),
      cell: ({ row }) => (
        <span className="font-medium text-foreground">
          {row.original.quantity ?? 0}
        </span>
      ),
    },
    {
      accessorKey: "alertQuantity",
      header: ({ column }) => (
        <SortableHeader column={column} title={t("report.alert_qty", "Alert Qty")} />
      ),
      cell: ({ row }) => {
        const qty = row.original.quantity ?? 0;
        const alertQty = row.original.alertQuantity ?? 0;
        const isLow = alertQty > 0 && qty <= alertQty;
        return (
          <span
            className={
              isLow
                ? "text-destructive font-semibold"
                : "font-medium text-foreground"
            }
          >
            {alertQty}
          </span>
        );
      },
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => (
        <SortableHeader column={column} title={t("common.created_at", "Created At")} />
      ),
      cell: ({ row }) => {
        const raw = row.original.createdAt;
        if (!raw)
          return <span className="text-muted-foreground text-xs">-</span>;
        const date = new Date(raw);
        return (
          <span className="text-xs text-text-secondary">
            {date.toLocaleDateString("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
          </span>
        );
      },
    },
  ];
};
