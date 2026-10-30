import { useMemo, useState } from "react";
import {
  DataTable,
  exportTableToCsv,
  exportTableToPdf,
  printTable,
} from "@/components/ui/data-table";
import { PageHeader } from "@/components/ui/page-header";
import { AccessDenied } from "@/components/ui/access-denied";
import { usePermission } from "@/utils/UsePermission";
import { PERMISSION } from "@/constants/Permission";
import { useReport } from "@/hooks/reports/useReport";
import { useStore } from "@/hooks/inventory/useStore";
import { useBank } from "@/hooks/finance/useBank";
import { useExpenseType } from "@/hooks/expense/useExpenseType";
import { PageFilter } from "@/utils/PageFilter";
import { useSearch } from "@/utils/useSearch";
import { ExpenseReportColumns } from "./ExpenseReportColumn";
import { useLanguage } from "@/i18n/LanguageContext";
import { KpiCard, KpiGrid } from "@/components/ui/kpi-card";
import { CheckCircle2, Clock, Receipt, Wallet } from "lucide-react";

const formatCurrency = (value: number | string | undefined) => {
  const numeric = Number(value ?? 0);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(numeric);
};

const ExpenseReportPage = () => {
  const { t } = useLanguage();
  const { Can } = usePermission();
  const canRead = Can(PERMISSION.REPORT.READ);

  const [page, setPage] = useState(1);
  const [size, setSize] = useState(10);
  const [search, setSearch] = useState("");
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [storeId, setStoreId] = useState<string>("all");
  const [bankId, setBankId] = useState<string>("all");
  const [expenseTypeId, setExpenseTypeId] = useState<string>("all");
  const [status, setStatus] = useState<string>("all");

  const { data: storeData } = useStore.useGetAllStore({ page: 1, size: 1000 });
  const { data: bankData } = useBank.useGetAllBank({ page: 1, size: 1000 });
  const { data: expenseTypeData } = useExpenseType.useGetAllExpenseType({ page: 1, size: 1000 });

  const stores = storeData?.payload?.data ?? [];
  const banks = bankData?.payload?.data ?? [];
  const expenseTypes = expenseTypeData?.payload?.data ?? [];

  const filter = useMemo(
    () => ({
      page,
      size,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      storeId: storeId !== "all" ? Number(storeId) : undefined,
      bankId: bankId !== "all" ? Number(bankId) : undefined,
      expenseTypeId: expenseTypeId !== "all" ? Number(expenseTypeId) : undefined,
      status: status !== "all" ? status : undefined,
    }),
    [page, size, startDate, endDate, storeId, bankId, expenseTypeId, status],
  );

  const { data: expenseData } = useReport.useExpenseReport(filter);

  const rows = useMemo(() => {
    if (!expenseData) return [];
    const payload = (expenseData as any)?.payload ?? expenseData;
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.data)) return payload.data;
    if (Array.isArray(payload?.content)) return payload.content;
    if (Array.isArray(payload?.expenses)) return payload.expenses;
    if (Array.isArray(payload?.items)) return payload.items;
    return [];
  }, [expenseData]);

  const filterGroups = useMemo(
    () => [
      {
        key: "storeId",
        label: t("inventory.store", "Store"),
        options: stores.map((store: any) => ({ label: store.name, value: String(store.id) })),
      },
      {
        key: "bankId",
        label: t("nav.bank", "Bank"),
        options: banks.map((bank: any) => ({ label: bank.name, value: String(bank.id) })),
      },
      {
        key: "expenseTypeId",
        label: t("nav.expense_type", "Expense Type"),
        options: expenseTypes.map((expenseType: any) => ({ label: expenseType.name, value: String(expenseType.id) })),
      },
      {
        key: "status",
        label: t("common.status", "Status"),
        options: [
          { label: "PENDING", value: "PENDING" },
          { label: "APPROVED", value: "APPROVED" },
          { label: "PAID", value: "PAID" },
          { label: "REJECTED", value: "REJECTED" },
        ],
      },
    ],
    [stores, banks, expenseTypes, t],
  );

  const searchFilteredRows = useSearch(rows, search, [
    "reference",
    "storeName",
    "bankName",
    "expenseTypeName",
    "description",
    "status",
  ]);

  const filteredRows = useMemo(() => {
    return searchFilteredRows.filter((row: any) => {
      if (storeId !== "all" && String(row.storeId) !== storeId) return false;
      if (bankId !== "all" && String(row.bankId) !== bankId) return false;
      if (expenseTypeId !== "all" && String(row.expenseTypeId) !== expenseTypeId) return false;
      if (status !== "all" && row.status !== status) return false;
      return true;
    });
  }, [searchFilteredRows, storeId, bankId, expenseTypeId, status]);

  const totalElements =
    (expenseData as any)?.payload?.totalElements ??
    (expenseData as any)?.payload?.pagination?.totalElements ??
    rows.length;

  const columns = useMemo(() => ExpenseReportColumns({ t }), [t]);

  const handleSearchFilterChange = (key: string, value: string) => {
    setFilterValues((prev) => ({ ...prev, [key]: value }));
    if (key === "storeId") setStoreId(value || "all");
    if (key === "bankId") setBankId(value || "all");
    if (key === "expenseTypeId") setExpenseTypeId(value || "all");
    if (key === "status") setStatus(value || "all");
  };

  const handleExportExcel = () => {
    exportTableToCsv(filteredRows, columns, "expense-report");
  };

  const handleDownloadPdf = () => {
    exportTableToPdf(filteredRows, columns, "expense-report", t("nav.expense_reports", "Expense Report"));
  };

  const handlePrint = () => {
    printTable(t("nav.expense_reports", "Expense Report"));
  };

  if (!canRead) {
    return <AccessDenied resource="expense reports" showBackButton />;
  }

  const summary = useMemo(() => {
    let totalExpense = 0;
    let paidAmount = 0;
    let pendingAmount = 0;
    let totalCount = rows.length;

    for (const r of rows) {
      const amt = Number(r.amount ?? 0);
      totalExpense += amt;
      const st = String(r.status ?? "").toUpperCase();
      if (st === "PAID") {
        paidAmount += amt;
      } else if (st === "PENDING") {
        pendingAmount += amt;
      }
    }

    return { totalExpense, paidAmount, pendingAmount, totalCount };
  }, [rows]);

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("nav.expense_reports", "Expense Reports")}
        description={t("report.expenses", "Overview of expenses by store, payment account, and type")}
      />

      {/* Summary KPI Cards */}
      <KpiGrid>
        <KpiCard
          featured
          icon={Wallet}
          title={t("dashboard.total_expense", "Total Expenses")}
          value={formatCurrency(summary.totalExpense)}
          caption={`${Number(summary.totalCount).toLocaleString()} ${t("pos.items", "Transactions")}`}
          splits={[
            { label: t("common.paid", "Paid Expenses"), value: summary.paidAmount, color: "#4ade80" },
            { label: t("common.pending", "Pending Expenses"), value: summary.pendingAmount, color: "#fbbf24" },
          ]}
        />
        <KpiCard
          tone="green"
          icon={CheckCircle2}
          title={t("common.paid", "Paid Expenses")}
          subtitle={t("report.paid_expenses_desc", "Already settled")}
          value={formatCurrency(summary.paidAmount)}
          caption={t("report.of_total_expenses", "of total expenses")}
          percent={summary.totalExpense > 0 ? (summary.paidAmount / summary.totalExpense) * 100 : 0}
        />
        <KpiCard
          tone="amber"
          icon={Clock}
          title={t("common.pending", "Pending Expenses")}
          subtitle={t("report.pending_expenses_desc", "Awaiting payment")}
          value={formatCurrency(summary.pendingAmount)}
          caption={t("report.of_total_expenses", "of total expenses")}
          percent={summary.totalExpense > 0 ? (summary.pendingAmount / summary.totalExpense) * 100 : 0}
        />
        <KpiCard
          tone="blue"
          icon={Receipt}
          title={t("pos.items", "Transactions")}
          subtitle={t("report.expense_records_desc", "Expense records in view")}
          value={Number(summary.totalCount).toLocaleString()}
        />
      </KpiGrid>

      <div className="rounded-2xl border border-border bg-card shadow-card overflow-hidden">
        <div className="border-b border-border/60 p-4">
          <PageFilter
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder={t("common.search", "Search expense reference, type, store...")}
            startDate={startDate}
            endDate={endDate}
            onStartDateChange={(value) => { setPage(1); setStartDate(value); }}
            onEndDateChange={(value) => { setPage(1); setEndDate(value); }}
            filterGroups={filterGroups}
            filterValues={filterValues}
            onFilterChange={handleSearchFilterChange}
            onPrintPdf={handlePrint}
            onDownloadPdf={handleDownloadPdf}
            onDownloadCsv={handleExportExcel}
            onReset={() => {
              setSearch("");
              setFilterValues({});
              setStoreId("all");
              setBankId("all");
              setExpenseTypeId("all");
              setStatus("all");
              setStartDate("");
              setEndDate("");
              setPage(1);
            }}
          />
        </div>

        <DataTable
          columns={columns}
          data={filteredRows}
          pagination={{
            currentPage: page,
            pageSize: size,
            totalElements: filteredRows.length,
            totalPages: Math.max(1, Math.ceil(filteredRows.length / size)),
            onPageChange: setPage,
            onPageSizeChange: (nextSize) => {
              setPage(1);
              setSize(nextSize);
            },
          }}
        />
      </div>
    </div>
  );
};

export default ExpenseReportPage;
