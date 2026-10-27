import type { ColumnDef } from "@tanstack/react-table";
import { SortableHeader } from "@/utils/sort-table-header";
import { StatusBadge } from "@/components/ui/status-badge";
import type { PurchasePaymentReportResponse } from "@/types/reports/PaymentReport";

const formatCurrency = (value: number | string | undefined) => {
  const numeric = Number(value ?? 0);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(numeric);
};

export type PurchasePaymentRow = PurchasePaymentReportResponse;

interface PurchasePaymentReportColumnsProps {
  t?: (key: any, fallback?: string) => string;
  onViewPurchase?: (purchaseId: number) => void;
}

export const PurchasePaymentReportColumns = ({
  t,
  onViewPurchase,
}: PurchasePaymentReportColumnsProps = {}): ColumnDef<PurchasePaymentRow>[] => [
  {
    accessorKey: "paymentNo",
    header: ({ column }) => (
      <SortableHeader column={column} title={t ? t("payment.payment_no", "Payment #") : "Payment #"} />
    ),
    cell: ({ row }) => (
      <span className="font-mono text-xs font-bold text-foreground">
        {row.original.paymentNo || `#PPAY-${row.original.paymentId ?? "-"}`}
      </span>
    ),
  },
  {
    accessorKey: "paymentDate",
    header: ({ column }) => (
      <SortableHeader column={column} title={t ? t("common.date", "Date") : "Date"} />
    ),
    cell: ({ row }) => {
      const raw = row.original.paymentDate;
      if (!raw) return <span className="text-muted-foreground text-xs">-</span>;
      const date = new Date(raw);
      return (
        <span className="text-xs font-mono text-muted-foreground">
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
    accessorKey: "purchaseReferenceNo",
    header: ({ column }) => (
      <SortableHeader column={column} title={t ? t("purchase.reference", "Purchase Order") : "Purchase Order"} />
    ),
    cell: ({ row }) => {
      const ref = row.original.purchaseReferenceNo;
      const purchaseId = row.original.purchaseId;
      if (!ref) return <span className="text-muted-foreground text-xs">-</span>;
      return (
        <button
          type="button"
          onClick={() => purchaseId && onViewPurchase?.(purchaseId)}
          className="font-mono text-xs font-semibold text-primary hover:underline cursor-pointer"
        >
          {ref}
        </button>
      );
    },
  },
  {
    accessorKey: "supplierName",
    header: ({ column }) => (
      <SortableHeader column={column} title={t ? t("purchase.supplier", "Supplier") : "Supplier"} />
    ),
    cell: ({ row }) => (
      <span className="font-semibold text-xs text-[#566a7f] dark:text-muted-foreground">
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
      <span className="text-xs text-muted-foreground font-medium">
        {row.original.storeName || "-"}
      </span>
    ),
  },
  {
    accessorKey: "paymentMethods",
    header: ({ column }) => (
      <SortableHeader column={column} title={t ? t("payment.method", "Method / Bank") : "Method / Bank"} />
    ),
    cell: ({ row }) => {
      const method = row.original.paymentMethods || row.original.bankNames || "BANK TRANSFER";
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-violet-500/10 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-800">
          {method}
        </span>
      );
    },
  },
  {
    accessorKey: "totalAmount",
    header: ({ column }) => (
      <SortableHeader column={column} title={t ? t("purchase.grand_total", "Order Total") : "Order Total"} />
    ),
    cell: ({ row }) => (
      <span className="font-mono font-medium text-xs text-foreground">
        {formatCurrency(row.original.totalAmount)}
      </span>
    ),
  },
  {
    accessorKey: "receivedAmount",
    header: ({ column }) => (
      <SortableHeader column={column} title={t ? t("purchase.paid_amount", "Disbursed / Paid") : "Disbursed / Paid"} />
    ),
    cell: ({ row }) => (
      <span className="font-mono font-bold text-xs text-emerald-600 dark:text-emerald-400">
        {formatCurrency(row.original.receivedAmount)}
      </span>
    ),
  },
  {
    accessorKey: "dueAmount",
    header: ({ column }) => (
      <SortableHeader column={column} title={t ? t("purchase.due_amount", "Remaining Due") : "Remaining Due"} />
    ),
    cell: ({ row }) => {
      const due = Number(row.original.dueAmount ?? 0);
      return (
        <span className={`font-mono text-xs ${due > 0 ? "font-semibold text-rose-600 dark:text-rose-400" : "text-muted-foreground"}`}>
          {formatCurrency(due)}
        </span>
      );
    },
  },
  {
    accessorKey: "paymentStatus",
    header: ({ column }) => (
      <SortableHeader column={column} title={t ? t("common.status", "Status") : "Status"} />
    ),
    cell: ({ row }) => <StatusBadge status={row.original.paymentStatus || "PAID"} />,
  },
];
