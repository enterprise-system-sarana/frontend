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
  MoreHorizontal,
  PencilIcon,
  Trash2,
} from "lucide-react";

interface PurchaseColumnProps {
  onEdit: (purchase: PurchaseResponse) => void;
  onDelete: (id: number) => void;
  onApprove?: (id: number) => void;
  onComplete?: (id: number) => void;
  canEdit: boolean;
  canDelete: boolean;
}

const formatCurrency = (value: number) => `$${value.toFixed(2)}`;

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
      <p>
        {row.original.date
          ? new Date(row.original.date).toLocaleString()
          : new Date().toLocaleString()}
      </p>
    ),
  },
  {
    accessorKey: "store",
    header: ({ column }) => <SortableHeader column={column} title="Store" />,
    cell: ({ row }) => <p>{row.original.storeName}</p>,
  },
  {
    accessorKey: "supplier",
    header: ({ column }) => <SortableHeader column={column} title="Supplier" />,
    cell: ({ row }) => <p>{row.original.supplierName}</p>,
  },
  {
    accessorKey: "reference",
    header: ({ column }) => (
      <SortableHeader column={column} title="Reference" />
    ),
    cell: ({ row }) => <p>{row.original.reference}</p>,
  },
  {
    accessorKey: "purchasesStatus",
    header: "Purchases Status",
    cell: ({ row }) => <p>{row.original.purchasesStatus}</p>,
  },
  {
    accessorKey: "grandTotal",
    header: "Grand Total",
    cell: ({ row }) => <p>{formatCurrency(row.original.grandTotal)}</p>,
  },
  {
    accessorKey: "paid",
    header: "Paid",
    cell: ({ row }) => {
      const paid =
        row.original.paymentStatus?.toUpperCase() === "PAID"
          ? row.original.grandTotal
          : 0;
      return <p>{formatCurrency(paid)}</p>;
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
      return <p>{formatCurrency(balance)}</p>;
    },
  },
  {
    accessorKey: "paymentStatus",
    header: "Payment Status",
    cell: ({ row }) => <p>{row.original.paymentStatus}</p>,
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.original.status?.toLowerCase();
      const variantClass =
        status === "active"
          ? "bg-emerald-500/15 text-emerald-600 border-emerald-500/25"
          : "bg-red-500/15 text-red-600 border-red-500/25";

      return (
        <Badge variant="outline" className={variantClass}>
          {row.original.status}
        </Badge>
      );
    },
  },
  {
    accessorKey: "note",
    header: "Note",
    cell: ({ row }) => (
      <p className="max-w-55 truncate">{row.original.note || "-"}</p>
    ),
  },
  {
    accessorKey: "Action",
    header: "Action",
    enableHiding: false,
    cell: ({ row }) => {
      if (!canEdit && !canDelete) {
        return <span className="text-muted-foreground text-sm">-</span>;
      }
      const currentStatus = row.original.purchasesStatus?.toUpperCase();

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {onApprove && currentStatus === "ORDERED" && (
              <DropdownMenuItem
                className="cursor-pointer text-blue-600"
                onClick={() => onApprove(row.original.id)}
              >
                <CheckCircle2 className="mr-2 h-4 w-4" /> Approve
              </DropdownMenuItem>
            )}

            {onComplete && currentStatus === "APPROVED" && (
              <DropdownMenuItem
                className="cursor-pointer text-emerald-600"
                onClick={() => onComplete(row.original.id)}
              >
                <CheckSquare className="mr-2 h-4 w-4" /> Complete
              </DropdownMenuItem>
            )}
            {canEdit && (
              <DropdownMenuItem
                className="cursor-pointer"
                onClick={() => onEdit(row.original)}
              >
                <PencilIcon className="mr-2 h-4 w-4" /> Edit
              </DropdownMenuItem>
            )}
            {canDelete && (
              <DropdownMenuItem
                className="cursor-pointer text-destructive"
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
