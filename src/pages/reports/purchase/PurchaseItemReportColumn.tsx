import type { ColumnDef } from "@tanstack/react-table";
import { SortableHeader } from "@/utils/sort-table-header";
import { StatusBadge } from "@/components/ui/status-badge";
import type { PurchaseItemReportResponse } from "@/types/reports/PurchaseReport";

const formatCurrency = (value: number | string | undefined) => {
  const numeric = Number(value ?? 0);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(numeric);
};

export type PurchaseItemRow = PurchaseItemReportResponse;

interface PurchaseItemReportColumnsProps {
  t?: (key: any, fallback?: string) => string;
  onViewPurchase?: (purchaseId: number) => void;
}

export const PurchaseItemReportColumns = ({
  t,
  onViewPurchase,
}: PurchaseItemReportColumnsProps = {}): ColumnDef<PurchaseItemRow>[] => [
  {
    accessorKey: "referenceNo",
    header: ({ column }) => (
      <SortableHeader column={column} title={t ? t("common.reference", "Reference") : "Reference"} />
    ),
    cell: ({ row }) => (
      <button
        type="button"
        onClick={() => row.original.purchaseId && onViewPurchase?.(row.original.purchaseId)}
        className="tabular-nums text-xs font-semibold text-primary hover:underline cursor-pointer"
      >
        {row.original.referenceNo || "-"}
      </button>
    ),
  },
  {
    accessorKey: "productName",
    header: ({ column }) => (
      <SortableHeader column={column} title={t ? t("product.name", "Product") : "Product"} />
    ),
    cell: ({ row }) => (
      <div className="flex flex-col">
        <span className="font-semibold text-foreground text-xs">
          {row.original.productName || "-"}
        </span>
        {row.original.productCode && (
          <span className="tabular-nums text-[12px] text-muted-foreground">
            {row.original.productCode}
          </span>
        )}
      </div>
    ),
  },
  {
    accessorKey: "supplierName",
    header: ({ column }) => (
      <SortableHeader column={column} title={t ? t("purchase.supplier", "Supplier") : "Supplier"} />
    ),
    cell: ({ row }) => (
      <span className="text-xs text-text-secondary dark:text-muted-foreground font-medium">
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
      <span className="text-xs text-text-secondary dark:text-muted-foreground font-medium">
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
        <span className="text-xs text-text-secondary dark:text-muted-foreground tabular-nums">
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
    accessorKey: "quantity",
    header: ({ column }) => (
      <SortableHeader column={column} title={t ? t("common.qty", "Qty") : "Qty"} />
    ),
    cell: ({ row }) => (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-muted text-foreground">
        {row.original.quantity ?? 0}
      </span>
    ),
  },
  {
    accessorKey: "unitCost",
    header: ({ column }) => (
      <SortableHeader column={column} title={t ? t("purchase.unit_cost", "Unit Cost") : "Unit Cost"} />
    ),
    cell: ({ row }) => (
      <span className="text-xs tabular-nums font-medium text-muted-foreground">
        {formatCurrency(row.original.unitCost ?? row.original.unitPrice)}
      </span>
    ),
  },
  {
    accessorKey: "subtotal",
    header: ({ column }) => (
      <SortableHeader column={column} title={t ? t("common.subtotal", "Subtotal") : "Subtotal"} />
    ),
    cell: ({ row }) => (
      <span className="text-xs tabular-nums font-bold text-foreground">
        {formatCurrency(
          row.original.subtotal != null
            ? row.original.subtotal
            : (Number(row.original.quantity) || 0) * (Number(row.original.unitCost) || 0)
        )}
      </span>
    ),
  },
  {
    accessorKey: "purchaseStatus",
    header: ({ column }) => (
      <SortableHeader column={column} title={t ? t("common.status", "Status") : "Status"} />
    ),
    cell: ({ row }) => <StatusBadge status={row.original.purchaseStatus || "RECEIVED"} />,
  },
  {
    accessorKey: "paymentStatus",
    header: ({ column }) => (
      <SortableHeader column={column} title={t ? t("purchase.payment_status", "Payment") : "Payment"} />
    ),
    cell: ({ row }) => <StatusBadge status={row.original.paymentStatus || "PAID"} />,
  },
];
