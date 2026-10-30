import { PaymentMethodBadge } from "@/components/ui/payment-method-badge";
import type { ColumnDef } from "@tanstack/react-table";
import { SortableHeader } from "@/utils/sort-table-header";
import { StatusBadge } from "@/components/ui/status-badge";
import type { SalePaymentReportResponse } from "@/types/reports/PaymentReport";

const formatCurrency = (value: number | string | undefined) => {
  const numeric = Number(value ?? 0);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(numeric);
};

export type SalePaymentRow = SalePaymentReportResponse;

interface SalePaymentReportColumnsProps {
  t?: (key: any, fallback?: string) => string;
  onViewSale?: (saleId: number) => void;
}

export const SalePaymentReportColumns = ({
  t,
  onViewSale,
}: SalePaymentReportColumnsProps = {}): ColumnDef<SalePaymentRow>[] => [
  {
    accessorKey: "paymentNo",
    header: ({ column }) => (
      <SortableHeader column={column} title={t ? t("payment.payment_no", "Payment #") : "Payment #"} />
    ),
    cell: ({ row }) => (
      <span className="tabular-nums text-xs font-bold text-foreground">
        {row.original.paymentNo || `#PAY-${row.original.paymentId ?? "-"}`}
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
        <span className="text-xs tabular-nums text-muted-foreground">
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
    accessorKey: "saleReference",
    header: ({ column }) => (
      <SortableHeader column={column} title={t ? t("sale.invoice", "Sale Reference") : "Sale Reference"} />
    ),
    cell: ({ row }) => {
      const ref = row.original.saleReference || row.original.saleNo;
      const saleId = row.original.saleId;
      if (!ref) return <span className="text-muted-foreground text-xs">-</span>;
      return (
        <button
          type="button"
          onClick={() => saleId && onViewSale?.(saleId)}
          className="tabular-nums text-xs font-semibold text-primary hover:underline cursor-pointer"
        >
          {ref}
        </button>
      );
    },
  },
  {
    accessorKey: "customerName",
    header: ({ column }) => (
      <SortableHeader column={column} title={t ? t("sale.customer", "Customer") : "Customer"} />
    ),
    cell: ({ row }) => (
      <span className="font-medium text-xs text-text-secondary dark:text-muted-foreground">
        {row.original.customerName || "Walk-in Customer"}
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
    accessorKey: "cashierName",
    header: ({ column }) => (
      <SortableHeader column={column} title={t ? t("common.cashier", "Cashier") : "Cashier"} />
    ),
    cell: ({ row }) => (
      <span className="text-xs text-muted-foreground">
        {row.original.cashierName || "-"}
      </span>
    ),
  },
  {
    accessorKey: "paymentMethods",
    header: ({ column }) => (
      <SortableHeader column={column} title={t ? t("payment.method", "Method / Bank") : "Method / Bank"} />
    ),
    cell: ({ row }) => {
      const method = row.original.paymentMethods || row.original.bankNames || "CASH";
      return <PaymentMethodBadge method={method} />;
    },
  },
  {
    accessorKey: "totalAmount",
    header: ({ column }) => (
      <SortableHeader column={column} title={t ? t("payment.bill_amount", "Bill Amount") : "Bill Amount"} />
    ),
    cell: ({ row }) => (
      <span className="tabular-nums font-medium text-xs text-foreground">
        {formatCurrency(row.original.totalAmount)}
      </span>
    ),
  },
  {
    accessorKey: "receivedAmount",
    header: ({ column }) => (
      <SortableHeader column={column} title={t ? t("payment.received_amount", "Received") : "Received"} />
    ),
    cell: ({ row }) => (
      <span className="tabular-nums font-bold text-xs text-success">
        {formatCurrency(row.original.receivedAmount)}
      </span>
    ),
  },
  {
    accessorKey: "returnAmount",
    header: ({ column }) => (
      <SortableHeader column={column} title={t ? t("payment.change", "Change") : "Change"} />
    ),
    cell: ({ row }) => {
      const ret = Number(row.original.returnAmount ?? 0);
      return (
        <span className="tabular-nums text-xs text-muted-foreground">
          {ret > 0 ? formatCurrency(ret) : "-"}
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
