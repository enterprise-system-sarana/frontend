import type { ColumnDef } from "@tanstack/react-table";
import { SortableHeader } from "@/utils/sort-table-header";
import type { BankReportResponse } from "@/types/reports/BankReport";
import { ArrowDownLeft, ArrowUpRight, Building2, Receipt, ShoppingCart, WalletCards } from "lucide-react";

const formatCurrency = (value: number | string | undefined) => {
  const numeric = Number(value ?? 0);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(numeric);
};

export type BankReportRow = BankReportResponse;

interface BankReportColumnsProps {
  t?: (key: any, fallback?: string) => string;
}

export const BankReportColumns = ({
  t,
}: BankReportColumnsProps = {}): ColumnDef<BankReportRow>[] => [
  {
    accessorKey: "transactionDate",
    header: ({ column }) => (
      <SortableHeader column={column} title={t ? t("common.date", "Date & Time") : "Date & Time"} />
    ),
    cell: ({ row }) => {
      const raw = row.original.transactionDate;
      if (!raw) return <span className="text-muted-foreground text-xs">-</span>;
      const date = new Date(raw);
      return (
        <div className="flex flex-col">
          <span className="text-xs font-semibold tabular-nums text-foreground">
            {date.toLocaleDateString("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
          </span>
          <span className="text-[11px] tabular-nums text-muted-foreground">
            {date.toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: "bankName",
    header: ({ column }) => (
      <SortableHeader column={column} title={t ? t("finance.bank", "Bank Account") : "Bank Account"} />
    ),
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Building2 className="size-3.5" />
        </div>
        <div className="flex flex-col">
          <span className="text-xs font-bold text-foreground">{row.original.bankName}</span>
          <span className="text-[11px] text-muted-foreground tabular-nums">
            {row.original.accountName} {row.original.accountNumber ? `(${row.original.accountNumber})` : ""}
          </span>
        </div>
      </div>
    ),
  },
  {
    accessorKey: "transactionReference",
    header: ({ column }) => (
      <SortableHeader column={column} title={t ? t("common.reference", "Reference #") : "Reference #"} />
    ),
    cell: ({ row }) => (
      <span className="text-xs font-mono font-medium text-foreground bg-muted/60 px-2 py-0.5 rounded border border-border/60">
        {row.original.transactionReference || `#TX-${row.original.transactionId}`}
      </span>
    ),
  },
  {
    accessorKey: "flowType",
    header: t ? t("common.type", "Type / Flow") : "Type / Flow",
    cell: ({ row }) => {
      const flow = row.original.flowType;
      const type = row.original.transactionType;

      if (flow === "IN" || type === "SALE") {
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
            <ArrowDownLeft className="size-3 text-emerald-600" />
            + IN ({type})
          </span>
        );
      }

      if (type === "PURCHASE") {
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-600 border border-amber-500/20">
            <ArrowUpRight className="size-3 text-amber-600" />
            - OUT (PURCHASE)
          </span>
        );
      }

      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-500/10 text-rose-600 border border-rose-500/20">
          <ArrowUpRight className="size-3 text-rose-600" />
          - OUT ({type})
        </span>
      );
    },
  },
  {
    accessorKey: "relatedDoc",
    header: t ? t("common.source", "Source Document") : "Source Document",
    cell: ({ row }) => {
      const { saleNo, saleReference, purchaseReferenceNo, expenseReference } = row.original;
      if (saleNo || saleReference) {
        return (
          <div className="flex items-center gap-1.5 text-xs text-foreground font-medium">
            <ShoppingCart className="size-3.5 text-primary" />
            <span>Sale #{saleNo || saleReference}</span>
          </div>
        );
      }
      if (purchaseReferenceNo) {
        return (
          <div className="flex items-center gap-1.5 text-xs text-foreground font-medium">
            <Receipt className="size-3.5 text-amber-500" />
            <span>PO #{purchaseReferenceNo}</span>
          </div>
        );
      }
      if (expenseReference) {
        return (
          <div className="flex items-center gap-1.5 text-xs text-foreground font-medium">
            <WalletCards className="size-3.5 text-purple-500" />
            <span>EXP #{expenseReference}</span>
          </div>
        );
      }
      return <span className="text-muted-foreground text-xs">-</span>;
    },
  },
  {
    accessorKey: "amount",
    header: ({ column }) => (
      <SortableHeader column={column} title={t ? t("common.amount", "Amount") : "Amount"} />
    ),
    cell: ({ row }) => {
      const flow = row.original.flowType;
      const isIncome = flow === "IN" || row.original.transactionType === "SALE";
      return (
        <span
          className={`tabular-nums text-xs font-bold ${
            isIncome ? "text-emerald-600" : "text-rose-600"
          }`}
        >
          {isIncome ? "+" : "-"}
          {formatCurrency(row.original.amount)}
        </span>
      );
    },
  },
  {
    accessorKey: "bankCurrentBalance",
    header: t ? t("finance.current_balance", "Bank Balance") : "Bank Balance",
    cell: ({ row }) => (
      <span className="tabular-nums text-xs font-semibold text-primary">
        {formatCurrency(row.original.bankCurrentBalance)}
      </span>
    ),
  },
  {
    accessorKey: "description",
    header: t ? t("common.description", "Description") : "Description",
    cell: ({ row }) => (
      <span className="text-xs text-muted-foreground line-clamp-1 max-w-[200px]" title={row.original.description}>
        {row.original.description || "-"}
      </span>
    ),
  },
];

