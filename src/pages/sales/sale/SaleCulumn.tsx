import type { SaleResponse } from "@/types/sales/Sale";
import { SortableHeader } from "@/utils/sort-table-header";
import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  RotateCcw,
  Wallet,
} from "lucide-react";
import { StatusBadge } from "@/components/ui/status-badge";
import { TableActions } from "@/components/ui/table-actions";
import { formatDate } from "@/utils/formatDate";
import type { TranslationKey } from "@/i18n/locales/en";

interface SaleColumnProps {
  onView?: (sale: SaleResponse) => void;
  onEdit?: (sale: SaleResponse) => void;
  onDelete?: (id: number) => void;
  onComplete?: (id: number) => void;
  onCancel?: (id: number) => void;
  onReturn?: (id: number) => void;
  onPayment?: (sale: SaleResponse) => void;
  canEdit: boolean;
  canDelete: boolean;
  t?: (key: TranslationKey, fallback?: string) => string;
}

const formatCurrency = (value: number) => `$${(value || 0).toFixed(2)}`;
const safeText = (value: string | null | undefined) => value ?? "N/A";

export const SaleColumns = ({
  onView,
  onEdit,
  onDelete,
  onComplete,
  onCancel,
  onReturn,
  onPayment,
  canEdit,
  canDelete,
  t,
}: SaleColumnProps): ColumnDef<SaleResponse>[] => [
    // {
    //   accessorKey: "id",
    //   header: ({ column }) => <SortableHeader column={column} title="ID" />,
    //   cell: ({ row }) => (
    //     <span className="font-medium text-foreground">
    //       {safeText(row.original.id.toString())}
    //     </span>
    //   ),
    // },
    {
      accessorKey: "customer",
      header: ({ column }) => <SortableHeader column={column} title={t ? t("sale.customer") : "Customer"} />,
      cell: ({ row }) => (
        <span className="font-medium text-foreground">
          {safeText(row.original.customerName)}
        </span>
      ),
    },
    {
      accessorKey: "reference",
      header: ({ column }) => <SortableHeader column={column} title={t ? t("common.reference") : "Reference"} />,
      cell: ({ row }) => (
        <span
          onClick={() => onView?.(row.original)}
          className={`tabular-nums text-xs ${onView ? "text-primary hover:underline cursor-pointer font-semibold" : "text-primary"
            }`}
        >
          {row.original.reference}
        </span>
      ),
    },
    // {
    //   accessorKey: "no",
    //   header: ({ column }) => <SortableHeader column={column} title={t ? t("common.id") : "No"} />,
    //   cell: ({ row }) => (
    //     <span className="tabular-nums text-xs text-primary">
    //       {row.index + 1}
    //     </span>
    //   ),
    // },
    {
      accessorKey: "store",
      header: ({ column }) => <SortableHeader column={column} title={t ? t("inventory.store") : "Store"} />,
      cell: ({ row }) => (
        <span className="font-medium text-foreground">
          {safeText(row.original.storeName)}
        </span>
      ),
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => <SortableHeader column={column} title={t ? t("common.date") : "Date"} />,
      cell: ({ row }) => <span className="text-xs text-text-secondary">{formatDate(row.original.createdAt)}</span>
    },

    // {
    //   accessorKey: "bank",
    //   header: ({ column }) => <SortableHeader column={column} title="Bank" />,
    //   cell: ({ row }) => (
    //     <span className="font-medium text-foreground">
    //       {safeText(row.original.bankName)}
    //     </span>
    //   ),
    // },
    {
      accessorKey: "grandTotal",
      header: t ? t("common.total") : "Total",
      cell: ({ row }) => (
        <span className="font-medium text-foreground">
          {formatCurrency(row.original.grandTotal)}
        </span>
      ),
    },
    {
      accessorKey: "paidAmount",
      header: t ? t("common.paid") : "Paid",
      cell: ({ row }) => (
        <span className="text-success font-medium">
          {formatCurrency(row.original.paidAmount)}
        </span>
      ),
    },
    {
      accessorKey: "dueAmount",
      header: t ? t("common.due") : "Due",
      cell: ({ row }) => (
        <span className="text-destructive font-medium">
          {formatCurrency(row.original.dueAmount)}
        </span>
      ),
    },
    {
      accessorKey: "paymentStatus",
      header: t ? t("common.payment") : "Payment",
      cell: ({ row }) => {
        const status = row.original.paymentStatus?.toUpperCase();
        const isPaid = status === "PAID";
        const label = status === "PAID" && t ? t("common.paid") : status === "PARTIAL" && t ? t("common.partial") : status === "PENDING" && t ? t("common.pending") : row.original.paymentStatus;
        return (
          <Badge
            variant="outline"
            className={
              isPaid
                ? "bg-success/10 text-success border-success/20"
                : "bg-warning/10 text-warning-text border-warning/20"
            }
          >
            {label}
          </Badge>
        );
      },
    },
    {
      accessorKey: "status",
      header: t ? t("common.status") : "Status",
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      accessorKey: "Action",
      header: t ? t("common.action") : "Action",
      enableHiding: false,
      cell: ({ row }) => {
        const currentStatus = row.original.status?.toUpperCase();
        const isPendingLike = currentStatus === "PENDING" || currentStatus === "ACT" || currentStatus === "ACTIVE";
        const isReturnable = currentStatus === "COMPLETED" || currentStatus === "PARTIAL_RETURNED";

        const hasActions =
          Boolean(onView) ||
          (onComplete && isPendingLike) ||
          (onCancel && isPendingLike) ||
          (onReturn && isReturnable) ||
          canEdit ||
          canDelete;

        if (!hasActions) {
          return <span className="text-text-disabled text-sm">-</span>;
        }

        return (
          <div className="flex items-center gap-1">
            <TableActions
              onView={onView ? () => onView(row.original) : undefined}
              onEdit={canEdit && onEdit ? () => onEdit(row.original) : undefined}
              onDelete={canDelete && onDelete ? () => onDelete(row.original.id) : undefined}
            />
            {onPayment && row.original.dueAmount > 0 && (
              <Button
                variant="ghost"
                size="icon"
                title={t ? t("common.payment") : "Payment"}
                className="h-8 w-8 text-primary hover:bg-primary-hover rounded-lg"
                onClick={() => onPayment(row.original)}
              >
                <Wallet className="h-4 w-4" />
              </Button>
            )}
            {onReturn && isReturnable && (
              <Button
                variant="ghost"
                size="icon"
                title={t ? t("sale.return") : "Return Sale"}
                className="h-8 w-8 text-warning-text hover:bg-warning/10 rounded-lg"
                onClick={() => onReturn(row.original.id)}
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            )}
          </div>
        );
      },
    },
  ];

// Separate column set for return actions, useful in return-specific views
export const SaleColumnsReturn = ({
  onReturn,
}: Pick<SaleColumnProps, 'onReturn'>): ColumnDef<SaleResponse>[] => [
    {
      accessorKey: "id",
      header: ({ column }) => <SortableHeader column={column} title="ID" />,
      cell: ({ row }) => (
        <span className="font-medium text-foreground">
          {safeText(row.original.id.toString())}
        </span>
      ),
    },
    {
      accessorKey: "reference",
      header: ({ column }) => <SortableHeader column={column} title="Reference" />,
      cell: ({ row }) => (
        <span className="tabular-nums text-xs text-primary">
          {row.original.reference}
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      accessorKey: "Return",
      header: "Return",
      enableHiding: false,
      cell: ({ row }) => {
        const isCompleted =
          row.original.status?.toUpperCase() === "COMPLETED";
        const isPartialReturned =
          row.original.status?.toUpperCase() === "PARTIAL_RETURNED";
        if (!onReturn || (!isCompleted && !isPartialReturned)) {
          return <span className="text-text-disabled text-sm">-</span>;
        }
        return (
          <Button
            variant="ghost"
            size="icon"
            title="Return"
            className="h-8 w-8 text-primary hover:bg-primary/10 rounded-lg"
            onClick={() => onReturn(row.original.id)}
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        );
      },
    },
  ];
