import type { ColumnDef } from "@tanstack/react-table";
import { SortableHeader } from "@/utils/sort-table-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { Eye, FileText } from "lucide-react";
import type { PurchaseItemDetail } from "@/types/reports/PurchaseReport";

const formatCurrency = (value: number | string | undefined) => {
  const numeric = Number(value ?? 0);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(numeric);
};

export type PurchaseReportRow = PurchaseItemDetail;

interface PurchaseReportColumnsProps {
  t?: (key: any, fallback?: string) => string;
  onViewDetail?: (purchaseId: number) => void;
  onViewInvoice?: (purchaseId: number) => void;
}

export const PurchaseReportColumns = ({
  t,
  onViewDetail,
  onViewInvoice,
}: PurchaseReportColumnsProps = {}): ColumnDef<PurchaseReportRow>[] => [
  {
    accessorKey: "referenceNo",
    header: ({ column }) => (
      <SortableHeader column={column} title={t ? t("common.reference", "Reference") : "Reference"} />
    ),
    cell: ({ row }) => (
      <button
        type="button"
        onClick={() => row.original.purchaseId && onViewDetail?.(row.original.purchaseId)}
        className="font-mono text-xs font-semibold text-primary hover:underline cursor-pointer"
      >
        {row.original.referenceNo || "-"}
      </button>
    ),
  },
  {
    accessorKey: "supplierName",
    header: ({ column }) => (
      <SortableHeader column={column} title={t ? t("purchase.supplier", "Supplier") : "Supplier"} />
    ),
    cell: ({ row }) => (
      <span className="font-semibold text-[#566a7f] dark:text-muted-foreground">
        {row.original.supplierName || "-"}
      </span>
    ),
  },
  {
    accessorKey: "storeName",
    header: ({ column }) => (
      <SortableHeader column={column} title={t ? t("inventory.store", "Store") : "Store"} />
    ),
    cell: ({ row }) => (
      <span className="font-medium text-[#566a7f] dark:text-muted-foreground">
        {row.original.storeName || "-"}
      </span>
    ),
  },
  {
    accessorKey: "purchaseDate",
    header: ({ column }) => (
      <SortableHeader column={column} title={t ? t("common.date", "Date") : "Date"} />
    ),
    cell: ({ row }) => {
      const raw = row.original.purchaseDate;
      if (!raw) return <span className="text-muted-foreground text-xs">-</span>;
      const date = new Date(raw);
      return (
        <span className="text-xs text-[#566a7f] dark:text-muted-foreground">
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
    accessorKey: "grandTotal",
    header: ({ column }) => (
      <SortableHeader column={column} title={t ? t("common.total", "Grand Total") : "Grand Total"} />
    ),
    cell: ({ row }) => (
      <span className="font-bold text-foreground">
        {formatCurrency(row.original.grandTotal ?? row.original.total)}
      </span>
    ),
  },
  {
    accessorKey: "paidAmount",
    header: ({ column }) => (
      <SortableHeader column={column} title={t ? t("purchase.paid_amount", "Paid Amount") : "Paid Amount"} />
    ),
    cell: ({ row }) => (
      <span className="font-semibold text-emerald-600 dark:text-emerald-400">
        {formatCurrency(row.original.paidAmount)}
      </span>
    ),
  },
  {
    accessorKey: "dueAmount",
    header: ({ column }) => (
      <SortableHeader column={column} title={t ? t("purchase.due_amount", "Due Amount") : "Due Amount"} />
    ),
    cell: ({ row }) => {
      const due = Number(row.original.dueAmount ?? 0);
      return (
        <span className={due > 0 ? "font-semibold text-rose-600 dark:text-rose-400" : "font-medium text-muted-foreground"}>
          {formatCurrency(due)}
        </span>
      );
    },
  },
  {
    accessorKey: "totalQuantity",
    header: ({ column }) => (
      <SortableHeader column={column} title={t ? t("common.qty", "Qty") : "Qty"} />
    ),
    cell: ({ row }) => (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-muted text-foreground">
        {row.original.totalQuantity ?? 0}
      </span>
    ),
  },
  {
    accessorKey: "status",
    header: ({ column }) => (
      <SortableHeader column={column} title={t ? t("common.status", "Status") : "Status"} />
    ),
    cell: ({ row }) => <StatusBadge status={row.original.status || "PENDING"} />,
  },
  {
    accessorKey: "paymentStatus",
    header: ({ column }) => (
      <SortableHeader column={column} title={t ? t("purchase.payment_status", "Payment") : "Payment"} />
    ),
    cell: ({ row }) => <StatusBadge status={row.original.paymentStatus || "UNPAID"} />,
  },
  {
    id: "actions",
    header: t ? t("common.actions", "Actions") : "Actions",
    cell: ({ row }) => {
      const purchaseId = row.original.purchaseId;
      if (!purchaseId) return null;
      return (
        <div className="flex items-center gap-1.5">
          <Button
            variant="ghost"
            size="icon"
            className="size-8 text-muted-foreground hover:text-primary"
            onClick={() => onViewDetail?.(purchaseId)}
            title="View Details"
          >
            <Eye className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-8 text-muted-foreground hover:text-primary"
            onClick={() => onViewInvoice?.(purchaseId)}
            title="View Invoice"
          >
            <FileText className="size-4" />
          </Button>
        </div>
      );
    },
  },
];
