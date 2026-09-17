import type { SaleResponse } from "@/types/sales/Sale";
import { SortableHeader } from "@/utils/sort-table-header";
import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  CheckCircle2,
  MoreVertical,
  PencilIcon,
  RotateCcw,
  Trash2,
  XCircle,
} from "lucide-react";
import { StatusBadge } from "@/components/ui/status-badge";

interface SaleColumnProps {
  onEdit: (sale: SaleResponse) => void;
  onDelete: (id: number) => void;
  onComplete?: (id: number) => void;
  onCancel?: (id: number) => void;
  onReturn?: (id: number) => void;
  canEdit: boolean;
  canDelete: boolean;
}

const formatCurrency = (value: number) => `$${(value || 0).toFixed(2)}`;
const safeText = (value: string | null | undefined) => value ?? "N/A";

export const SaleColumns = ({
  onEdit,
  onDelete,
  onComplete,
  onCancel,
  onReturn,
  canEdit,
  canDelete,
}: SaleColumnProps): ColumnDef<SaleResponse>[] => [
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
      accessorKey: "store",
      header: ({ column }) => <SortableHeader column={column} title="Store" />,
      cell: ({ row }) => (
        <span className="font-semibold text-[#566a7f]">
          {safeText(row.original.storeName)}
        </span>
      ),
    },
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
      accessorKey: "bank",
      header: ({ column }) => <SortableHeader column={column} title="Bank" />,
      cell: ({ row }) => (
        <span className="font-semibold text-[#566a7f]">
          {safeText(row.original.bankName)}
        </span>
      ),
    },
    {
      accessorKey: "grandTotal",
      header: "Grand Total",
      cell: ({ row }) => (
        <span className="font-semibold text-[#566a7f]">
          {formatCurrency(row.original.grandTotal)}
        </span>
      ),
    },
    {
      accessorKey: "paidAmount",
      header: "Paid Amount",
      cell: ({ row }) => (
        <span className="text-[#71dd37] font-medium">
          {formatCurrency(row.original.paidAmount)}
        </span>
      ),
    },
    {
      accessorKey: "dueAmount",
      header: "Due Balance",
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

        const hasActions =
          (onComplete && isPendingLike) ||
          (onCancel && isPendingLike) ||
          (onReturn && isCompleted) ||
          (canEdit && isPendingLike) ||
          canDelete;

        if (!hasActions) {
          return <span className="text-[#a1acb8] text-sm">-</span>;
        }

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="h-8 w-8 p-0 text-[#697a8d] hover:text-[#566a7f] hover:bg-[#f5f5f9]"
              >
                <span className="sr-only">Open menu</span>
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-40 shadow-[0_3px_12px_rgba(67,89,113,0.15)] border-[#e7e7e8]"
            >
              {onComplete && isPendingLike && (
                <DropdownMenuItem
                  className="cursor-pointer text-[#71dd37] focus:text-[#71dd37] focus:bg-[#71dd37]/8"
                  onClick={() => onComplete(row.original.id)}
                >
                  <CheckCircle2 className="mr-2 h-4 w-4" /> Complete
                </DropdownMenuItem>
              )}

              {onCancel && isPendingLike && (
                <DropdownMenuItem
                  className="cursor-pointer text-[#ffab00] focus:text-[#ffab00] focus:bg-[#ffab00]/8"
                  onClick={() => onCancel(row.original.id)}
                >
                  <XCircle className="mr-2 h-4 w-4" /> Cancel
                </DropdownMenuItem>
              )}

              {onReturn && isCompleted && (
                <DropdownMenuItem
                  className="cursor-pointer text-[#03c3ec] focus:text-[#03c3ec] focus:bg-[#03c3ec]/8"
                  onClick={() => onReturn(row.original.id)}
                >
                  <RotateCcw className="mr-2 h-4 w-4" /> Return
                </DropdownMenuItem>
              )}

              {canEdit && isPendingLike && (
                <DropdownMenuItem
                  className="cursor-pointer text-[#697a8d] focus:text-[#696cff] focus:bg-[#696cff]/8"
                  onClick={() => onEdit(row.original)}
                >
                  <PencilIcon className="mr-2 h-4 w-4" /> Edit
                </DropdownMenuItem>
              )}

              {canDelete && (
                <DropdownMenuItem
                  className="cursor-pointer text-[#ff3e1d] focus:text-[#ff3e1d] focus:bg-[#ff3e1d]/8"
                  onClick={() => onDelete(row.original.id)}
                >
                  <Trash2 className="mr-2 h-4 w-4" /> Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
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
        if (!onReturn || !isCompleted) {
          return <span className="text-[#a1acb8] text-sm">-</span>;
        }
        return (
          <Button
            variant="ghost"
            className="h-8 w-8 p-0 text-[#03c3ec] hover:bg-[#03c3ec]/8"
            onClick={() => onReturn(row.original.id)}
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        );
      },
    },
  ];