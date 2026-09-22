import type { ColumnDef } from "@tanstack/react-table";
import { SortableHeader } from "@/utils/sort-table-header";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";

const formatCurrency = (value: number | string | undefined) => {
  const numeric = Number(value ?? 0);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(numeric);
};

export interface SaleItemRow {
  saleId?: number;
  saleReference?: string;
  saleDate?: string;
  storeId?: number;
  storeName?: string;
  productId?: number;
  productName?: string;
  quantity?: number;
  price?: number;
  itemDiscount?: number;
  subTotal?: number;
  status?: string;
  paymentStatus?: string;
  serialNumbers?: (string | number)[];
}

export const SalesItemReportColumns = (): ColumnDef<SaleItemRow>[] => [
  {
    accessorKey: "saleReference",
    header: ({ column }) => (
      <SortableHeader column={column} title="Sale Reference" />
    ),
    cell: ({ row }) => (
      <span className="font-mono text-xs text-[#696cff]">
        {row.original.saleReference || "-"}
      </span>
    ),
  },
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
    accessorKey: "saleDate",
    header: ({ column }) => <SortableHeader column={column} title="Date" />,
    cell: ({ row }) => {
      const raw = row.original.saleDate;
      if (!raw || raw === "-") return <span className="text-muted-foreground text-xs">-</span>;
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
    accessorKey: "quantity",
    header: ({ column }) => <SortableHeader column={column} title="Qty" />,
    cell: ({ row }) => (
      <span className="font-semibold text-[#566a7f]">
        {row.original.quantity ?? 0}
      </span>
    ),
  },
  {
    accessorKey: "price",
    header: ({ column }) => (
      <SortableHeader column={column} title="Unit Price" />
    ),
    cell: ({ row }) => (
      <span className="font-semibold text-[#566a7f]">
        {formatCurrency(row.original.price)}
      </span>
    ),
  },
  {
    accessorKey: "itemDiscount",
    header: ({ column }) => (
      <SortableHeader column={column} title="Discount" />
    ),
    cell: ({ row }) => (
      <span className="text-[#ff3e1d] font-medium">
        {formatCurrency(row.original.itemDiscount)}
      </span>
    ),
  },
  {
    accessorKey: "subTotal",
    header: ({ column }) => (
      <SortableHeader column={column} title="Subtotal" />
    ),
    cell: ({ row }) => (
      <span className="text-[#71dd37] font-medium">
        {formatCurrency(row.original.subTotal)}
      </span>
    ),
  },
  {
    accessorKey: "status",
    header: "Sale Status",
    cell: ({ row }) => <StatusBadge status={row.original.status} />,
  },
  {
    accessorKey: "paymentStatus",
    header: "Payment",
    cell: ({ row }) => {
      const ps = row.original.paymentStatus?.toUpperCase();
      const isPaid = ps === "PAID";
      return (
        <Badge
          variant="outline"
          className={
            isPaid
              ? "bg-[#71dd37]/10 text-[#71dd37] border-[#71dd37]/20"
              : "bg-[#ffab00]/10 text-[#ffab00] border-[#ffab00]/20"
          }
        >
          {row.original.paymentStatus || "-"}
        </Badge>
      );
    },
  },
  {
    accessorKey: "serialNumbers",
    header: "Serial IDs",
    cell: ({ row }) => {
      const ids = row.original.serialNumbers;
      return ids && ids.length > 0 ? (
        <span className="font-mono text-xs text-[#566a7f]">
          {ids.join(", ")}
        </span>
      ) : (
        <span className="text-muted-foreground text-xs">-</span>
      );
    },
  },
];
