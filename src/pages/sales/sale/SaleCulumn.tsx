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

interface SaleColumnProps {
  onView?: (sale: SaleResponse) => void;
  onEdit: (sale: SaleResponse) => void;
  onDelete: (id: number) => void;
  onComplete?: (id: number) => void;
  onCancel?: (id: number) => void;
  onReturn?: (id: number) => void;
  onPayment?: (sale: SaleResponse) => void;
  canEdit: boolean;
  canDelete: boolean;
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
}: SaleColumnProps): ColumnDef<SaleResponse>[] => [
    // {
    //   accessorKey: "id",
    //   header: ({ column }) => <SortableHeader column={column} title="ID" />,
    //   cell: ({ row }) => (
    //     <span className="font-semibold text-[#566a7f]">
    //       {safeText(row.original.id.toString())}
    //     </span>
    //   ),
    // },
    {
      accessorKey: "customer",
      header: ({ column }) => <SortableHeader column={column} title="Customer" />,
      cell: ({ row }) => (
        <span className="font-semibold text-[#566a7f]">
          {safeText(row.original.customerName)}
        </span>
      ),
    },
    {
      accessorKey: "reference",
      header: ({ column }) => <SortableHeader column={column} title="Reference" />,
      cell: ({ row }) => (
        <span
          onClick={() => onView?.(row.original)}
          className={`font-mono text-xs ${onView ? "text-[#696cff] hover:underline cursor-pointer font-semibold" : "text-[#696cff]"
            }`}
        >
          {row.original.reference}
        </span>
      ),
    },
    {
      accessorKey: "no",
      header: ({ column }) => <SortableHeader column={column} title="No" />,
      cell: ({ row }) => (
        <span className="font-mono text-xs text-[#696cff]">
          {row.index + 1}
        </span>
      ),
    },
    {
      accessorKey: "store",
      header: ({ column }) => <SortableHeader column={column} title="Store" />,
      cell: ({ row }) => (
        <span className="font-semibold text-[#566a7f]">
          {safeText(row.original.storeName)}
        </span>
      ),
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => <SortableHeader column={column} title="Date" />,
      cell: ({ row }) => <span className="text-xs text-[#566a7f]">{formatDate(row.original.createdAt)}</span>
    },

    // {
    //   accessorKey: "bank",
    //   header: ({ column }) => <SortableHeader column={column} title="Bank" />,
    //   cell: ({ row }) => (
    //     <span className="font-semibold text-[#566a7f]">
    //       {safeText(row.original.bankName)}
    //     </span>
    //   ),
    // },
    {
      accessorKey: "grandTotal",
      header: "Total",
      cell: ({ row }) => (
        <span className="font-semibold text-[#566a7f]">
          {formatCurrency(row.original.grandTotal)}
        </span>
      ),
    },
    {
      accessorKey: "paidAmount",
      header: "Paid",
      cell: ({ row }) => (
        <span className="text-[#71dd37] font-medium">
          {formatCurrency(row.original.paidAmount)}
        </span>
      ),
    },
    {
      accessorKey: "dueAmount",
      header: "Due",
      cell: ({ row }) => (
        <span className="text-[#ff3e1d] font-medium">
          {formatCurrency(row.original.dueAmount)}
        </span>
      ),
    },
    {
      accessorKey: "paymentStatus",
      header: "Payment",
      cell: ({ row }) => {
        const status = row.original.paymentStatus?.toUpperCase();
        const isPaid = status === "PAID";
        return (
          <Badge
            variant="outline"
            className={
              isPaid
                ? "bg-[#71dd37]/10 text-[#71dd37] border-[#71dd37]/20"
                : "bg-[#ffab00]/10 text-[#ffab00] border-[#ffab00]/20"
            }
          >
            {row.original.paymentStatus}
          </Badge>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      accessorKey: "Action",
      header: "Action",
      enableHiding: false,
      cell: ({ row }) => {
        const currentStatus = row.original.status?.toUpperCase();
        const isPendingLike = currentStatus === "PENDING" || currentStatus === "ACT" || currentStatus === "ACTIVE";
        const isCompleted = currentStatus === "COMPLETED";
        const isReturnable = currentStatus === "COMPLETED" || currentStatus === "PARTIAL_RETURNED";

        const hasActions =
          (onComplete && isPendingLike) ||
          (onCancel && isPendingLike) ||
          (onReturn && isReturnable) ||
          canEdit ||
          canDelete;

        if (!hasActions) {
          return <span className="text-[#a1acb8] text-sm">-</span>;
        }

        return (
          <div className="flex items-center gap-1">
            <TableActions
              onView={onView ? () => onView(row.original) : undefined}
              onEdit={canEdit ? () => onEdit(row.original) : undefined}
              onDelete={canDelete ? () => onDelete(row.original.id) : undefined}
            />
            {onPayment && row.original.dueAmount > 0 && (
              <Button
                variant="ghost"
                size="icon"
                title="Payment"
                className="h-8 w-8 text-[#696cff] hover:bg-[#696cff]/10 rounded-lg"
                onClick={() => onPayment(row.original)}
              >
                <Wallet className="h-4 w-4" />
              </Button>
            )}
            {onReturn && isReturnable && (
              <Button
                variant="ghost"
                size="icon"
                title="Return Sale"
                className="h-8 w-8 text-amber-500 hover:bg-amber-500/10 rounded-lg"
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
        <span className="font-semibold text-[#566a7f]">
          {safeText(row.original.id.toString())}
        </span>
      ),
    },
    {
      accessorKey: "reference",
      header: ({ column }) => <SortableHeader column={column} title="Reference" />,
      cell: ({ row }) => (
        <span className="font-mono text-xs text-[#696cff]">
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
          return <span className="text-[#a1acb8] text-sm">-</span>;
        }
        return (
          <Button
            variant="ghost"
            size="icon"
            title="Return"
            className="h-8 w-8 text-[#03c3ec] hover:bg-[#03c3ec]/10 rounded-lg"
            onClick={() => onReturn(row.original.id)}
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        );
      },
    },
  ];