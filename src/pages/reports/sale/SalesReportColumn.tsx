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

export interface SaleReportRow {
  id?: number;
  reference?: string;
  no?: string;
  customerName?: string;
  storeName?: string;
  saleDate?: string;
  date?: string;
  totalAmount?: number;
  grandTotal?: number;
  paidAmount?: number;
  dueAmount?: number;
  totalProfit?: number;
  paymentStatus?: string;
  status?: string;
}

interface SalesReportColumnsProps {
  t?: (key: any, fallback?: string) => string;
}

export const SalesReportColumns = ({
  t,
}: SalesReportColumnsProps = {}): ColumnDef<SaleReportRow>[] => [
  {
    accessorKey: "reference",
    header: ({ column }) => (
      <SortableHeader column={column} title={t ? t("common.reference", "Reference") : "Reference"} />
    ),
    cell: ({ row }) => (
      <span className="tabular-nums text-xs text-primary">
        {row.original.no || row.original.reference || "-"}
      </span>
    ),
  },
  {
    accessorKey: "customerName",
    header: ({ column }) => (
      <SortableHeader column={column} title={t ? t("sale.customer", "Customer") : "Customer"} />
    ),
    cell: ({ row }) => (
      <span className="font-medium text-foreground">
        {row.original.customerName || "-"}
      </span>
    ),
  },
  {
    accessorKey: "storeName",
    header: ({ column }) => <SortableHeader column={column} title={t ? t("inventory.store", "Store") : "Store"} />,
    cell: ({ row }) => (
      <span className="font-medium text-foreground">
        {row.original.storeName || "-"}
      </span>
    ),
  },
  {
    accessorKey: "saleDate",
    header: ({ column }) => <SortableHeader column={column} title={t ? t("common.date", "Date") : "Date"} />,
    cell: ({ row }) => {
      const raw = row.original.saleDate || row.original.date;
      if (!raw) return <span className="text-muted-foreground text-xs">-</span>;
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
  {
    accessorKey: "totalAmount",
    header: ({ column }) => (
      <SortableHeader column={column} title={t ? t("common.total", "Total Amount") : "Total Amount"} />
    ),
    cell: ({ row }) => (
      <span className="font-medium text-foreground">
        {formatCurrency(row.original.totalAmount)}
      </span>
    ),
  },
  {
    accessorKey: "grandTotal",
    header: ({ column }) => (
      <SortableHeader column={column} title={t ? t("sale.grand_total", "Grand Total") : "Grand Total"} />
    ),
    cell: ({ row }) => (
      <span className="font-medium text-foreground">
        {formatCurrency(row.original.grandTotal)}
      </span>
    ),
  },
  {
    accessorKey: "paidAmount",
    header: ({ column }) => <SortableHeader column={column} title={t ? t("common.paid", "Paid") : "Paid"} />,
    cell: ({ row }) => (
      <span className="text-success font-medium">
        {formatCurrency(row.original.paidAmount)}
      </span>
    ),
  },
  {
    accessorKey: "totalProfit",
    header: ({ column }) => <SortableHeader column={column} title={t ? t("common.profit", "Profit") : "Profit"} />,
    cell: ({ row }) => (
      <span className="text-success font-medium">
        {formatCurrency(row.original.totalProfit)}
      </span>
    ),
  },
  {
    accessorKey: "dueAmount",
    header: ({ column }) => <SortableHeader column={column} title={t ? t("common.due", "Due") : "Due"} />,
    cell: ({ row }) => (
      <span className="text-destructive font-medium">
        {formatCurrency(row.original.dueAmount)}
      </span>
    ),
  },
  {
    accessorKey: "paymentStatus",
    header: t ? t("purchase.payment_status", "Payment Status") : "Payment Status",
    cell: ({ row }) => {
      const ps = row.original.paymentStatus?.toUpperCase();
      const isPaid = ps === "PAID";
      return (
        <Badge
          variant="outline"
          className={
            isPaid
              ? "bg-success/10 text-success border-success/20"
              : "bg-warning/10 text-warning-text border-warning/20"
          }
        >
          {row.original.paymentStatus || "-"}
        </Badge>
      );
    },
  },
  {
    accessorKey: "status",
    header: t ? t("common.status", "Status") : "Status",
    cell: ({ row }) => <StatusBadge status={row.original.status} />,
  },
];




