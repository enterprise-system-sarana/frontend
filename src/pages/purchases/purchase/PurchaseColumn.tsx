import type { PurchaseResponse } from "@/types/purchases/Purchase";
import { SortableHeader } from "@/utils/sort-table-header";
import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { TableActions } from "@/components/ui/table-actions";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatDate } from "@/utils/formatDate";

import { Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";

import type { TranslationKey } from "@/i18n/locales/en";

interface PurchaseColumnProps {
  onView: (purchase: PurchaseResponse) => void;
  onEdit: (purchase: PurchaseResponse) => void;
  onDelete: (id: number) => void;
  onPayment?: (purchase: PurchaseResponse) => void;
  canEdit: boolean;
  canDelete: boolean;
  t?: (key: TranslationKey, fallback?: string) => string;
}

const formatCurrency = (value: number) => `$${(value || 0).toFixed(2)}`;
const safeText = (value: string | null | undefined) => value ?? "N/A";

export const PurchaseColumns = ({
  onView,
  onEdit,
  onDelete,
  onPayment,
  canEdit,
  canDelete,
  t,
}: PurchaseColumnProps): ColumnDef<PurchaseResponse>[] => [

    {
      accessorKey: "referenceNo",
      header: ({ column }) => (
        <SortableHeader column={column} title={t ? t("purchase.reference") : "Reference"} />
      ),
      cell: ({ row }) => {
        const match = (row.original.note || "").match(/\[Importance:\s*(LOW|NORMAL|HIGH|URGENT)\]/i);
        const imp = match ? match[1].toUpperCase() : null;
        return (
          <div className="flex flex-col gap-0.5">
            <span className="font-mono text-xs text-[#696cff]">
              {row.original.referenceNo}
            </span>
            {imp && (
              <span
                className={`w-fit inline-flex items-center rounded-full px-1.5 py-0.2 text-[9px] font-bold ${
                  imp === "URGENT"
                    ? "bg-rose-500/15 text-rose-600 border border-rose-500/25"
                    : imp === "HIGH"
                    ? "bg-amber-500/15 text-amber-600 border border-amber-500/25"
                    : imp === "LOW"
                    ? "bg-slate-500/15 text-slate-600 border border-slate-500/25"
                    : "bg-blue-500/15 text-blue-600 border border-blue-500/25"
                }`}
              >
                {imp}
              </span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "purchaseDate",
      header: ({ column }) => <SortableHeader column={column} title={t ? t("purchase.date") : "Date"} />,
      cell: ({ row }) => (
        <span className="text-[#6cacf4]">
          {formatDate(row.original.purchaseDate)}
        </span>
      ),
    },
    {
      accessorKey: "store",
      header: ({ column }) => <SortableHeader column={column} title={t ? t("purchase.store") : "Store"} />,
      cell: ({ row }) => (
        <span className="font-semibold text-[#566a7f]">
          {safeText(row.original.storeName)}
        </span>
      ),
    },
    {
      accessorKey: "supplier",
      header: ({ column }) => <SortableHeader column={column} title={t ? t("purchase.supplier") : "Supplier"} />,
      cell: ({ row }) => (
        <span className="font-semibold text-[#566a7f]">
          {safeText(row.original.supplierName)}
        </span>
      ),
    },
    {
      accessorKey: "Bank",
      header: ({ column }) => <SortableHeader column={column} title={t ? t("finance.bank") : "Bank"} />,
      cell: ({ row }) => (
        <span className="font-semibold text-[#566a7f]">
          {safeText(row.original.bankName)}
        </span>
      ),
    },

    {
      accessorKey: "grandTotal",
      header: t ? t("sale.grand_total") : "Grand Total",
      cell: ({ row }) => (
        <span className="font-semibold text-[#566a7f]">
          {formatCurrency(row.original.grandTotal)}
        </span>
      ),
    },
    {
      accessorKey: "paidAmount",
      header: t ? t("purchase.paid_amount") : "Paid",
      cell: ({ row }) => {
        const paid = row.original.paidAmount;
        return (
          <span className="text-[#71dd37] font-medium">
            {formatCurrency(paid)}
          </span>
        );
      },
    },
    {
      accessorKey: "dueAmount",
      header: t ? t("purchase.due_amount") : "Due",
      cell: ({ row }) => {
        const due = row.original.dueAmount ?? 0;
        return (
          <span className="text-[#ff3e1d] font-medium">
            {formatCurrency(due)}
          </span>
        );
      },
    },
    {
      accessorKey: "paymentStatus",
      header: t ? t("purchase.payment_status") : "Payment",
      cell: ({ row }) => {
        const status = row.original.paymentStatus?.toUpperCase();
        const isPaid = status === "PAID";
        const label = status === "PAID" && t ? t("common.paid") : status === "PARTIAL" && t ? t("common.partial") : status === "PENDING" && t ? t("common.pending") : row.original.paymentStatus;
        return (
          <Badge
            variant="outline"
            className={
              isPaid
                ? "bg-[#71dd37]/10 text-[#71dd37] border-[#71dd37]/20"
                : "bg-[#ffab00]/10 text-[#ffab00] border-[#ffab00]/20"
            }
          >
            {label}
          </Badge>
        );
      },
    },
    {
      accessorKey: "status",
      header: t ? t("purchase.status") : "Status",
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      accessorKey: "Action",
      header: t ? t("common.action") : "Action",
      enableHiding: false,
      cell: ({ row }) => {
        const due = row.original.dueAmount ?? 0;
        const hasActions = canEdit || canDelete || Boolean(onView) || (Boolean(onPayment) && due > 0);

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
            {onPayment && due > 0 && (
              <Button
                variant="ghost"
                size="icon"
                title={t ? t("common.payment") : "Payment"}
                className="h-8 w-8 text-[#10b981] hover:bg-[#10b981]/10 rounded-lg cursor-pointer"
                onClick={() => onPayment(row.original)}
              >
                <Wallet className="h-4 w-4" />
              </Button>
            )}
          </div>
        );
      },
    },
  ];
