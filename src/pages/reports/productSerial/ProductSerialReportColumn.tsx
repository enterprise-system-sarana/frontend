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

export const ProductSerialReportColumns =
  (): ColumnDef<ProductSerialReportRow>[] => [
    {
      accessorKey: "productName",
      header: ({ column }) => (
        <SortableHeader column={column} title="Product" />
      ),
      cell: ({ row }) => (
        <span className="font-semibold text-[#566a7f]">
          {row.original.productName || "-"}
        </span>
      ),
    },
    {
      accessorKey: "barcode",
      header: ({ column }) => (
        <SortableHeader column={column} title="Barcode" />
      ),
      cell: ({ row }) => (
        <span className="font-mono text-xs text-[#696cff]">
          {row.original.barcode || "-"}
        </span>
      ),
    },
    {
      accessorKey: "storeName",
      header: ({ column }) => <SortableHeader column={column} title="Store" />,
      cell: ({ row }) => (
        <span className="font-semibold text-[#566a7f]">
          {row.original.storeName || "-"}
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      accessorKey: "price",
      header: ({ column }) => <SortableHeader column={column} title="Price" />,
      cell: ({ row }) => (
        <span className="text-[#71dd37] font-medium">
          {formatCurrency(row.original.price)}
        </span>
      ),
    },
    {
      accessorKey: "cost",
      header: ({ column }) => <SortableHeader column={column} title="Cost" />,
      cell: ({ row }) => (
        <span className="text-[#ff3e1d] font-medium">
          {formatCurrency(row.original.cost)}
        </span>
      ),
    },
    {
      accessorKey: "quantity",
      header: ({ column }) => <SortableHeader column={column} title="Qty" />,
      cell: ({ row }) => (
        <span className="font-semibold text-[#566a7f]">
          {row.original.quantity ?? 0}
        </span>
      ),
    },
    {
      accessorKey: "alertQuantity",
      header: ({ column }) => (
        <SortableHeader column={column} title="Alert Qty" />
      ),
      cell: ({ row }) => {
        const qty = row.original.quantity ?? 0;
        const alertQty = row.original.alertQuantity ?? 0;
        const isLow = alertQty > 0 && qty <= alertQty;
        return (
          <span
            className={
              isLow
                ? "text-[#ff3e1d] font-semibold"
                : "font-semibold text-[#566a7f]"
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
        <SortableHeader column={column} title="Created At" />
      ),
      cell: ({ row }) => {
        const raw = row.original.createdAt;
        if (!raw)
          return <span className="text-muted-foreground text-xs">-</span>;
        const date = new Date(raw);
        return (
          <span className="text-xs text-[#566a7f]">
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
