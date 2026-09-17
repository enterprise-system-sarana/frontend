import type { QuoteResponse } from "@/types/quote/Quote";
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
  MoreVertical,
  PencilIcon,
  Trash2,
} from "lucide-react";
import { formatDate } from "@/utils/formatDate";

interface QuoteColumnProps {
  onEdit: (quote: QuoteResponse) => void;
  onDelete: (id: number) => void;
  canEdit: boolean;
  canDelete: boolean;
}

const formatCurrency = (value: number) => `$${(Number(value) || 0).toFixed(2)}`;

export const QuoteColumns = ({
  onEdit,
  onDelete,
  canEdit,
  canDelete,
}: QuoteColumnProps): ColumnDef<QuoteResponse>[] => [
  {
    accessorKey: "date",
    header: "Date",
    cell: ({ row }) => (
      <span className="text-[#697a8d]">
        {formatDate(row.original.date || row.original.createdAt)}
      </span>
    ),
  },
  {
    accessorKey: "no",
    header: ({ column }) => <SortableHeader column={column} title="Quote No" />,
    cell: ({ row }) => (
      <span className="font-semibold text-[#566a7f]">{row.original.no || "-"}</span>
    ),
  },
  {
    accessorKey: "reference",
    header: ({ column }) => (
      <SortableHeader column={column} title="Reference" />
    ),
    cell: ({ row }) => (
      <span className="font-mono text-xs text-[#696cff]">
        {row.original.reference}
      </span>
    ),
  },
  {
    accessorKey: "customer",
    header: ({ column }) => <SortableHeader column={column} title="Customer" />,
    cell: ({ row }) => {
      const customerName =
        row.original.customerName ||
        (typeof row.original.customer === "object"
          ? row.original.customer?.name
          : row.original.customer) ||
        `Customer #${row.original.customerId || ""}`;
      return <span className="font-semibold text-[#566a7f]">{customerName}</span>;
    },
  },
  {
    accessorKey: "status",
    header: "Quote Status",
    cell: ({ row }) => {
      const qStatus = (row.original.status || "PENDING").toUpperCase();
      let colorClass = "bg-[#696cff]/10 text-[#696cff] border-[#696cff]/20";
      if (qStatus === "APPROVED" || qStatus === "ACCEPTED") {
        colorClass = "bg-[#03c3ec]/10 text-[#03c3ec] border-[#03c3ec]/20";
      } else if (qStatus === "COMPLETED" || qStatus === "ORDERED") {
        colorClass = "bg-[#71dd37]/10 text-[#71dd37] border-[#71dd37]/20";
      } else if (qStatus === "REJECTED" || qStatus === "CANCELLED") {
        colorClass = "bg-[#ff3e1d]/10 text-[#ff3e1d] border-[#ff3e1d]/20";
      }
      return (
        <Badge variant="outline" className={`font-semibold ${colorClass}`}>
          {row.original.status || "PENDING"}
        </Badge>
      );
    },
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
    accessorKey: "discount",
    header: "Discount",
    cell: ({ row }) => (
      <span className="text-[#697a8d]">
        {formatCurrency(row.original.discount)}
      </span>
    ),
  },
  {
    accessorKey: "paidAmount",
    header: "Paid",
    cell: ({ row }) => {
      const paid = row.original.paidAmount ?? 0;
      return <span className="text-[#71dd37] font-medium">{formatCurrency(paid)}</span>;
    },
  },
  {
    accessorKey: "paymentStatus",
    header: "Payment Status",
    cell: ({ row }) => {
      const status = (
        row.original.paymentStatus ||
        row.original.statusPayment ||
        "PENDING"
      ).toUpperCase();
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
          {row.original.paymentStatus || row.original.statusPayment || "PENDING"}
        </Badge>
      );
    },
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => <SortableHeader column={column} title="Created Date" />,
    cell: ({ row }) => (
      <span className="text-xs text-[#697a8d]">
        {formatDate(row.original.createdAt || row.original.date)}
      </span>
    ),
  },
  {
    accessorKey: "Action",
    header: "Action",
    enableHiding: false,
    cell: ({ row }) => {
      if (!canEdit && !canDelete) {
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
