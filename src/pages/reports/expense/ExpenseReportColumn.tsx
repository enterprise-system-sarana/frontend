import type { ColumnDef } from "@tanstack/react-table";
import { SortableHeader } from "@/utils/sort-table-header";
import { StatusBadge } from "@/components/ui/status-badge";

const formatCurrency = (value: number | string | undefined) => {
  const numeric = Number(value ?? 0);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(numeric);
};

export interface ExpenseReportRow {
  id?: number;
  reference?: string;
  storeName?: string;
  storeId?: number;
  expenseTypeName?: string;
  expenseTypeId?: number;
  bankName?: string;
  bankId?: number;
  description?: string;
  status?: string;
  amount?: number;
  note?: string;
  createdAt?: string;
}

interface ExpenseReportColumnsProps {
  t?: (key: any, fallback?: string) => string;
}

export const ExpenseReportColumns = ({
  t,
}: ExpenseReportColumnsProps = {}): ColumnDef<ExpenseReportRow>[] => [
  {
    accessorKey: "reference",
    header: ({ column }) => (
      <SortableHeader column={column} title={t ? t("common.reference", "Reference") : "Reference"} />
    ),
    cell: ({ row }) => (
      <span className="font-mono text-xs text-[#696cff]">
        {row.original.reference || "-"}
      </span>
    ),
  },
  {
    accessorKey: "storeName",
    header: ({ column }) => <SortableHeader column={column} title={t ? t("inventory.store", "Store") : "Store"} />,
    cell: ({ row }) => (
      <span className="font-semibold text-[#566a7f]">
        {row.original.storeName || "-"}
      </span>
    ),
  },
  {
    accessorKey: "expenseTypeName",
    header: ({ column }) => (
      <SortableHeader column={column} title={t ? t("nav.expense_type", "Expense Type") : "Expense Type"} />
    ),
    cell: ({ row }) => (
      <span className="font-semibold text-[#566a7f]">
        {row.original.expenseTypeName || "-"}
      </span>
    ),
  },
  {
    accessorKey: "bankName",
    header: ({ column }) => <SortableHeader column={column} title={t ? t("nav.bank", "Bank") : "Bank"} />,
    cell: ({ row }) => (
      <span className="font-semibold text-[#566a7f]">
        {row.original.bankName || "-"}
      </span>
    ),
  },
  {
    accessorKey: "description",
    header: ({ column }) => (
      <SortableHeader column={column} title={t ? t("common.description", "Description") : "Description"} />
    ),
    cell: ({ row }) => (
      <span className="text-xs text-[#566a7f] max-w-[200px] truncate block">
        {row.original.description || "-"}
      </span>
    ),
  },
  {
    accessorKey: "status",
    header: t ? t("common.status", "Status") : "Status",
    cell: ({ row }) => <StatusBadge status={row.original.status} />,
  },
  {
    accessorKey: "amount",
    header: ({ column }) => <SortableHeader column={column} title={t ? t("common.amount", "Amount") : "Amount"} />,
    cell: ({ row }) => (
      <span className="text-[#ff3e1d] font-medium">
        {formatCurrency(row.original.amount)}
      </span>
    ),
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => (
      <SortableHeader column={column} title={t ? t("common.created_at", "Created At") : "Created At"} />
    ),
    cell: ({ row }) => {
      const raw = row.original.createdAt;
      if (!raw) return <span className="text-muted-foreground text-xs">-</span>;
      const date = new Date(raw);
      return (
        <span className="text-xs text-[#566a7f]">
          {date.toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
          })}
        </span>
      );
    },
  },
];
