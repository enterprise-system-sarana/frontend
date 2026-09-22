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
  paymentStatus?: string;
  status?: string;
}

export const SalesReportColumns = (): ColumnDef<SaleReportRow>[] => [
  {
    accessorKey: "reference",
    header: ({ column }) => (
      <SortableHeader column={column} title="Reference" />
    ),
    cell: ({ row }) => (
      <span className="font-mono text-xs text-[#696cff]">
        {row.original.no || row.original.reference || "-"}
      </span>
    ),
  },
  {
    accessorKey: "customerName",
    header: ({ column }) => (
      <SortableHeader column={column} title="Customer" />
    ),
    cell: ({ row }) => (
      <span className="font-semibold text-[#566a7f]">
        {row.original.customerName || "-"}
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
    accessorKey: "saleDate",
    header: ({ column }) => <SortableHeader column={column} title="Date" />,
    cell: ({ row }) => {
      const raw = row.original.saleDate || row.original.date;
      if (!raw) return <span className="text-muted-foreground text-xs">-</span>;
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
    accessorKey: "totalAmount",
    header: ({ column }) => (
      <SortableHeader column={column} title="Total Amount" />
    ),
    cell: ({ row }) => (
      <span className="font-semibold text-[#566a7f]">
        {formatCurrency(row.original.totalAmount)}
      </span>
    ),
  },
  {
    accessorKey: "grandTotal",
    header: ({ column }) => (
      <SortableHeader column={column} title="Grand Total" />
    ),
    cell: ({ row }) => (
      <span className="font-semibold text-[#566a7f]">
        {formatCurrency(row.original.grandTotal)}
      </span>
    ),
  },
  {
    accessorKey: "paidAmount",
    header: ({ column }) => <SortableHeader column={column} title="Paid" />,
    cell: ({ row }) => (
      <span className="text-[#71dd37] font-medium">
        {formatCurrency(row.original.paidAmount)}
      </span>
    ),
  },
  {
    accessorKey: "dueAmount",
    header: ({ column }) => <SortableHeader column={column} title="Due" />,
    cell: ({ row }) => (
      <span className="text-[#ff3e1d] font-medium">
        {formatCurrency(row.original.dueAmount)}
      </span>
    ),
  },
  {
    accessorKey: "paymentStatus",
    header: "Payment Status",
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
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => <StatusBadge status={row.original.status} />,
  },
];
