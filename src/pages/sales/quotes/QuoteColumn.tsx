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
  PackageCheck,
  Check,
} from "lucide-react";
import { formatDate } from "@/utils/formatDate";

interface QuoteColumnProps {
  onEdit: (quote: QuoteResponse) => void;
  onDelete: (id: number) => void;
  onGoodsArrived?: (quote: QuoteResponse) => void;
  canEdit: boolean;
  canDelete: boolean;
  t?: (key: any, fallback?: string) => string;
}

const formatCurrency = (value: number) => `$${(Number(value) || 0).toFixed(2)}`;

export const QuoteColumns = ({
  onEdit,
  onDelete,
  onGoodsArrived,
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
        <span className="font-semibold text-foreground">{row.original.no || "-"}</span>
      ),
    },
    {
      accessorKey: "reference",
      header: ({ column }) => (
        <SortableHeader column={column} title={t("common.reference", "Reference")} />
      ),
      cell: ({ row }) => (
        <span className="tabular-nums text-xs text-primary font-mono">
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
        let label = row.original.status || "PENDING";

        if (qStatus === "COMPLETED" || qStatus === "ORDERED") {
          colorClass = "bg-success/10 text-success border-success/20";
          label = "Completed";
        } else if (qStatus === "ARRIVED") {
          colorClass = "bg-emerald-500/10 text-emerald-600 border-emerald-500/20";
          label = "Arrived";
        } else if (qStatus === "PENDING") {
          colorClass = "bg-amber-500/10 text-amber-600 border-amber-500/20";
          label = "Booking";
        } else if (qStatus === "REJECTED" || qStatus === "CANCELLED") {
          colorClass = "bg-destructive/10 text-destructive border-destructive/20";
          label = "Cancelled";
        }

        return (
          <Badge variant="outline" className={`font-semibold ${colorClass}`}>
            {label}
          </Badge>
        );
      },
    },
    {
      accessorKey: "grandTotal",
      header: t("common.grand_total", "Grand Total"),
      cell: ({ row }) => (
        <span className="font-semibold text-foreground">
          {formatCurrency(row.original.grandTotal)}
        </span>
      ),
    },
    {
      accessorKey: "paidAmount",
      header: t("quote.deposit", "Deposit"),
      cell: ({ row }) => {
        const paid = Number(row.original.paidAmount) || 0;
        return (
          <span className="text-emerald-600 dark:text-emerald-400 font-semibold tabular-nums">
            {formatCurrency(paid)}
          </span>
        );
      },
    },
    {
      accessorKey: "dueAmount",
      header: t("quote.due_amount", "Due Balance"),
      cell: ({ row }) => {
        const grand = Number(row.original.grandTotal) || 0;
        const paid = Number(row.original.paidAmount) || 0;
        const due = Math.max(0, grand - paid);
        return (
          <span
            className={`font-semibold tabular-nums text-xs ${
              due > 0 ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground"
            }`}
          >
            {formatCurrency(due)}
          </span>
        );
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
        const isPartial = status === "PARTIAL";

        return (
          <Badge
            variant="outline"
            className={
              isPaid
                ? "bg-success/10 text-success border-success/20 font-semibold"
                : isPartial
                  ? "bg-amber-500/10 text-amber-600 border-amber-500/20 font-semibold"
                  : "bg-muted text-muted-foreground border-border font-semibold"
            }
          >
            {isPaid ? "PAID" : isPartial ? "PARTIAL" : "UNPAID"}
          </Badge>
        );
      },
    },
    {
      id: "goodsArrived",
      header: t("quote.goods_arrived", "Goods Arrived"),
      cell: ({ row }) => {
        const isCompleted = (row.original.status || "").toUpperCase() === "COMPLETED";

        if (isCompleted) {
          return (
            <Badge
              variant="outline"
              className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-xs font-medium gap-1"
            >
              <Check className="size-3" />
              {t("common.completed", "Completed")}
            </Badge>
          );
        }

        if (!onGoodsArrived) return null;

        return (
          <Button
            size="sm"
            onClick={() => onGoodsArrived(row.original)}
            className="h-8 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs rounded-lg gap-1.5 shadow-xs transition-colors cursor-pointer"
            title={t(
              "quote.arrived_desc",
              "Stock has arrived! Convert this booking to a sale to assign serials and complete payment."
            )}
          >
            <PackageCheck className="size-3.5" />
            <span>{t("quote.goods_arrived", "Goods Arrived")}</span>
          </Button>
        );
      },
    },
    {
      accessorKey: "Action",
      header: t("common.action", "Action"),
      enableHiding: false,
      cell: ({ row }) => {
        if (!canEdit && !canDelete) {
          return <span className="text-text-disabled text-sm">-</span>;
        }

        const isCompleted = (row.original.status || "").toUpperCase() === "COMPLETED";

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
              className="w-48 shadow-[0_3px_12px_rgba(67,89,113,0.15)] border-border"
            >
              {!isCompleted && onGoodsArrived && (
                <DropdownMenuItem
                  className="cursor-pointer text-emerald-600 focus:text-emerald-700 focus:bg-emerald-50 font-medium"
                  onClick={() => onGoodsArrived(row.original)}
                >
                  <PackageCheck className="mr-2 h-4 w-4" /> {t("quote.goods_arrived", "Goods Arrived")}
                </DropdownMenuItem>
              )}
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
