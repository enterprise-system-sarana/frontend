import type { PurchaseResponse } from "@/types/purchases/Purchase";
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
  CheckSquare,
  MoreVertical,
  PencilIcon,
  Trash2,
} from "lucide-react";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatDate } from "@/utils/formatDate";

interface PurchaseColumnProps {
  onEdit: (purchase: PurchaseResponse) => void;
  onDelete: (id: number) => void;
  onApprove?: (id: number) => void;
  onComplete?: (id: number) => void;
  canEdit: boolean;
  canDelete: boolean;
}

const formatCurrency = (value: number) => `$${(value || 0).toFixed(2)}`;

export const PurchaseColumns = ({
  onEdit,
  onDelete,
  onApprove,
  onComplete,
  canEdit,
  canDelete,
}: PurchaseColumnProps): ColumnDef<PurchaseResponse>[] => [
  {
    accessorKey: "date",
    header: "Date",
    cell: ({ row }) => (
      <span className="text-[#697a8d]">
        {formatDate(row.original.date)}
      </span>
    ),
  },
  {
    accessorKey: "store",
    header: ({ column }) => <SortableHeader column={column} title="Store" />,
    cell: ({ row }) => <span className="font-semibold text-[#566a7f]">{row.original.storeName}</span>,
  },
  {
    accessorKey: "supplier",
    header: ({ column }) => <SortableHeader column={column} title="Supplier" />,
    cell: ({ row }) => <span className="font-semibold text-[#566a7f]">{row.original.supplierName}</span>,
  },
  {
    accessorKey: "reference",
    header: ({ column }) => (
      <SortableHeader column={column} title="Reference" />
    ),
    cell: ({ row }) => <span className="font-mono text-xs text-[#696cff]">{row.original.reference}</span>,
  },
  {
    accessorKey: "purchasesStatus",
    header: "Purchases Status",
    cell: ({ row }) => {
      const pStatus = row.original.purchasesStatus?.toUpperCase();
      let colorClass = "bg-[#696cff]/10 text-[#696cff] border-[#696cff]/20";
      if (pStatus === "APPROVED") colorClass = "bg-[#03c3ec]/10 text-[#03c3ec] border-[#03c3ec]/20";
      if (pStatus === "COMPLETED") colorClass = "bg-[#71dd37]/10 text-[#71dd37] border-[#71dd37]/20";
      return (
        <Badge variant="outline" className={`font-semibold ${colorClass}`}>
          {row.original.purchasesStatus}
        </Badge>
      );
    },
  },
  {
    accessorKey: "grandTotal",
    header: "Grand Total",
    cell: ({ row }) => <span className="font-semibold text-[#566a7f]">{formatCurrency(row.original.grandTotal)}</span>,
  },
  {
    accessorKey: "paid",
    header: "Paid",
    cell: ({ row }) => {
      const paid =
        row.original.paymentStatus?.toUpperCase() === "PAID"
          ? row.original.grandTotal
          : 0;
      return <span className="text-[#71dd37] font-medium">{formatCurrency(paid)}</span>;
    },
  },
  {
    accessorKey: "balance",
    header: "Balance",
    cell: ({ row }) => {
      const balance =
        row.original.paymentStatus?.toUpperCase() === "PAID"
          ? 0
          : row.original.grandTotal;
      return <span className="text-[#ff3e1d] font-medium">{formatCurrency(balance)}</span>;
    },
  },
  {
    accessorKey: "paymentStatus",
    header: "Payment Status",
    cell: ({ row }) => {
      const status = row.original.paymentStatus?.toUpperCase();
      const isPaid = status === "PAID";
      return (
        <Badge variant="outline" className={isPaid ? "bg-[#71dd37]/10 text-[#71dd37] border-[#71dd37]/20" : "bg-[#ffab00]/10 text-[#ffab00] border-[#ffab00]/20"}>
          {row.original.paymentStatus}
        </Badge>
      );
    },
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => <SortableHeader column={column} title="Created Date" />,
    cell: ({ row }) => (
      <span className="text-xs text-[#697a8d]">
        {formatDate(row.original.createdAt)}
      </span>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => <StatusBadge status={row.original.status as any} />,
  },
  {
    accessorKey: "Action",
    header: "Action",
    enableHiding: false,
    cell: ({ row }) => {
      if (!canEdit && !canDelete) {
        return <span className="text-[#a1acb8] text-sm">-</span>;
      }
      const currentStatus = row.original.purchasesStatus?.toUpperCase();

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0 text-[#697a8d] hover:text-[#566a7f] hover:bg-[#f5f5f9]">
              <span className="sr-only">Open menu</span>
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40 shadow-[0_3px_12px_rgba(67,89,113,0.15)] border-[#e7e7e8]">
            {onApprove && currentStatus === "ORDERED" && (
              <DropdownMenuItem
                className="cursor-pointer text-[#03c3ec] focus:text-[#03c3ec] focus:bg-[#03c3ec]/8"
                onClick={() => onApprove(row.original.id)}
              >
                <CheckCircle2 className="mr-2 h-4 w-4" /> Approve
              </DropdownMenuItem>
            )}

            {onComplete && currentStatus === "APPROVED" && (
              <DropdownMenuItem
                className="cursor-pointer text-[#71dd37] focus:text-[#71dd37] focus:bg-[#71dd37]/8"
                onClick={() => onComplete(row.original.id)}
              >
                <CheckSquare className="mr-2 h-4 w-4" /> Complete
              </DropdownMenuItem>
            )}
            {canEdit && (
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
