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
  t?: (key: any, fallback?: string) => string;
}

const formatCurrency = (value: number) => `$${(Number(value) || 0).toFixed(2)}`;

export const QuoteColumns = ({
  onEdit,
  onDelete,
  canEdit,
  canDelete,
  t: translate,
}: QuoteColumnProps): ColumnDef<QuoteResponse>[] => {
  const t = translate ?? ((_k: any, fallback?: string) => fallback ?? "");

  return [
    {
      accessorKey: "date",
      header: t("common.date", "Date"),
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {formatDate(row.original.date || row.original.createdAt)}
        </span>
      ),
    },
    {
      accessorKey: "no",
      header: ({ column }) => <SortableHeader column={column} title={t("quote.quote_no", "Quote No")} />,
      cell: ({ row }) => (
        <span className="font-medium text-foreground">{row.original.no || "-"}</span>
      ),
    },
    {
      accessorKey: "reference",
      header: ({ column }) => (
        <SortableHeader column={column} title={t("common.reference", "Reference")} />
      ),
      cell: ({ row }) => (
        <span className="tabular-nums text-xs text-primary">
          {row.original.reference}
        </span>
      ),
    },
    {
      accessorKey: "customer",
      header: ({ column }) => <SortableHeader column={column} title={t("customer.name", "Customer")} />,
      cell: ({ row }) => {
        const customerName =
          row.original.customerName ||
          (typeof row.original.customer === "object"
            ? row.original.customer?.name
            : row.original.customer) ||
          `Customer #${row.original.customerId || ""}`;
        return <span className="font-medium text-foreground">{customerName}</span>;
      },
    },
    {
      accessorKey: "status",
      header: t("quote.quote_status", "Quote Status"),
      cell: ({ row }) => {
        const qStatus = (row.original.status || "PENDING").toUpperCase();
        let colorClass = "bg-primary/10 text-primary border-primary/20";
        if (qStatus === "APPROVED" || qStatus === "ACCEPTED") {
          colorClass = "bg-primary/10 text-primary border-primary/20";
        } else if (qStatus === "COMPLETED" || qStatus === "ORDERED") {
          colorClass = "bg-success/10 text-success border-success/20";
        } else if (qStatus === "REJECTED" || qStatus === "CANCELLED") {
          colorClass = "bg-destructive/10 text-destructive border-destructive/20";
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
      header: t("common.grand_total", "Grand Total"),
      cell: ({ row }) => (
        <span className="font-medium text-foreground">
          {formatCurrency(row.original.grandTotal)}
        </span>
      ),
    },
    {
      accessorKey: "discount",
      header: t("quote.discount", "Discount"),
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {formatCurrency(row.original.discount)}
        </span>
      ),
    },
    {
      accessorKey: "paidAmount",
      header: t("sale.paid_amount", "Paid"),
      cell: ({ row }) => {
        const paid = row.original.paidAmount ?? 0;
        return <span className="text-success font-medium">{formatCurrency(paid)}</span>;
      },
    },
    {
      accessorKey: "paymentStatus",
      header: t("sale.payment_status", "Payment Status"),
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
                ? "bg-success/10 text-success border-success/20"
                : "bg-warning/10 text-warning-text border-warning/20"
            }
          >
            {row.original.paymentStatus || row.original.statusPayment || "PENDING"}
          </Badge>
        );
      },
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => <SortableHeader column={column} title={t("common.created_at", "Created Date")} />,
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">
          {formatDate(row.original.createdAt || row.original.date)}
        </span>
      ),
    },
    {
      accessorKey: "Action",
      header: t("common.action", "Action"),
      enableHiding: false,
      cell: ({ row }) => {
        if (!canEdit && !canDelete) {
          return <span className="text-text-disabled text-sm">-</span>;
        }

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="h-8 w-8 p-0 text-muted-foreground hover:text-text-secondary hover:bg-muted"
              >
                <span className="sr-only">Open menu</span>
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-40 shadow-[0_3px_12px_rgba(67,89,113,0.15)] border-border"
            >
              {canEdit && (
                <DropdownMenuItem
                  className="cursor-pointer text-muted-foreground focus:text-primary focus:bg-primary/8"
                  onClick={() => onEdit(row.original)}
                >
                  <PencilIcon className="mr-2 h-4 w-4" /> {t("common.edit", "Edit")}
                </DropdownMenuItem>
              )}
              {canDelete && (
                <DropdownMenuItem
                  className="cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/8"
                  onClick={() => onDelete(row.original.id)}
                >
                  <Trash2 className="mr-2 h-4 w-4" /> {t("common.delete", "Delete")}
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];
};
