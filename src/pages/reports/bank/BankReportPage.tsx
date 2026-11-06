import { DatePicker, DateRangePicker, MonthPicker } from "@/components/ui/date-picker";
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
import { useBank } from "@/hooks/finance/useBank";
import { PageFilter } from "@/utils/PageFilter";
import { useSearch } from "@/utils/useSearch";
import {
  BankReportColumns,
  type BankReportRow,
} from "./BankReportColumn";
import { useLanguage } from "@/i18n/LanguageContext";
import { KpiCard, KpiGrid } from "@/components/ui/kpi-card";
import {
  Building2,
  Calendar,
  CalendarDays,
  CalendarRange,
  LayoutList,
  ArrowDownLeft,
  ArrowUpRight,
  Wallet,
  Activity,
  Layers,
} from "lucide-react";
import type { BankReportFilter } from "@/types/reports/BankReport";

type ReportPeriodMode = "all" | "daily" | "weekly" | "monthly" | "3months" | "6months";

const localDate = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

const getPeriod = (mode: ReportPeriodMode, value: string) => {
  if (mode === "daily") return { startDate: value, endDate: value };
  if (mode === "weekly") {
    const d = new Date(value);
    const day = d.getDay();
    const start = new Date(d);
    start.setDate(d.getDate() - day);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return { startDate: localDate(start), endDate: localDate(end) };
  }
  if (mode === "monthly") {
    const [year, month] = value.split("-").map(Number);
    if (!year || !month) return { startDate: "", endDate: "" };
    return {
      startDate: localDate(new Date(year, month - 1, 1)),
      endDate: localDate(new Date(year, month, 0)),
    };
  }
  if (mode === "3months") {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth() - 2, 1);
    return {
      startDate: localDate(start),
      endDate: localDate(now),
    };
  }
  if (mode === "6months") {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    return {
      startDate: localDate(start),
      endDate: localDate(now),
    };
  }
  return { startDate: "", endDate: "" };
};

const formatCurrency = (value: number | string | undefined) => {
  const numeric = Number(value ?? 0);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(numeric);
};

export default function BankReportPage({ mode: initialMode = "all" }: { mode?: ReportPeriodMode }) {
  const { t } = useLanguage();
  const { Can } = usePermission();
  const canRead = Can(PERMISSION.REPORT.READ);

  const [activeTab, setActiveTab] = useState<ReportPeriodMode>(initialMode);
  const [selectedDate, setSelectedDate] = useState(() => localDate(new Date()));
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });
  const [customRange, setCustomRange] = useState({ startDate: "", endDate: "" });

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState("");
  const [selectedBankId, setSelectedBankId] = useState<string>("all");
  const [selectedTxType, setSelectedTxType] = useState<string>("all");
  const [selectedFlowType, setSelectedFlowType] = useState<string>("all");
  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>({});

  const { data: bankData } = useBank.useGetAllBank({ page: 1, size: 100 });
  const bankList = useMemo(() => {
    const payload = bankData?.payload;
    if (Array.isArray(payload?.data)) return payload.data;
    if (Array.isArray(payload?.content)) return payload.content;
    if (Array.isArray(payload)) return payload;
    return [];
  }, [bankData]);

  const { startDate, endDate } = useMemo(() => {
    if (customRange.startDate || customRange.endDate) return customRange;
    if (activeTab === "all") return { startDate: "", endDate: "" };
    if (activeTab === "monthly") return getPeriod(activeTab, selectedMonth);
    return getPeriod(activeTab, selectedDate);
  }, [activeTab, selectedDate, selectedMonth, customRange]);

  const filterParams: BankReportFilter = useMemo(() => {
    const f: BankReportFilter = { page, size: pageSize };
    if (startDate) f.startDate = startDate;
    if (endDate) f.endDate = endDate;
    if (selectedBankId && selectedBankId !== "all" && Number(selectedBankId) > 0) f.bankId = Number(selectedBankId);
    if (selectedTxType && selectedTxType !== "all") f.transactionType = selectedTxType;
    if (selectedFlowType && selectedFlowType !== "all") f.flowType = selectedFlowType;
    if (search.trim()) f.search = search.trim();
    return f;
  }, [startDate, endDate, selectedBankId, selectedTxType, selectedFlowType, search, page, pageSize]);

  // Fetch Summary Metrics and Paged Transactions
  const { data: summaryData, isLoading: isSummaryLoading } = useReport.useBankReportSummary(filterParams);
  const { data: pagedData, isLoading: isPagedLoading, isError } = useReport.useBankReportPaged(
    filterParams,
    { page, size: pageSize }
  );

  const summary = summaryData?.payload;

  const rawTransactions: BankReportRow[] = useMemo(() => {
    const payload = pagedData?.payload;
    if (Array.isArray(payload?.data)) return payload.data;
    if (Array.isArray(payload?.content)) return payload.content;
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(summary?.transactions)) return summary.transactions;
    return [];
  }, [pagedData, summary]);

  const filteredTransactions = useSearch(rawTransactions, search, [
    "bankName",
    "accountName",
    "accountNumber",
    "transactionReference",
    "description",
    "saleNo",
    "purchaseReferenceNo",
    "expenseReference",
  ]);

  const totalElements =
    (pagedData?.payload as any)?.pagination?.totalElements ||
    (pagedData?.payload as any)?.totalElements ||
    summary?.totalTransactions ||
    filteredTransactions.length;

  const totalPages =
    (pagedData?.payload as any)?.pagination?.totalPages ||
    (pagedData?.payload as any)?.totalPages ||
    Math.max(1, Math.ceil(totalElements / pageSize));

  const columns = useMemo(() => BankReportColumns({ t }), [t]);

  const handlePeriodChange = (mode: ReportPeriodMode) => {
    setActiveTab(mode);
    setCustomRange({ startDate: "", endDate: "" });
    setPage(1);
  };

  const handleResetFilters = () => {
    setActiveTab("all");
    setSelectedBankId("all");
    setSelectedTxType("all");
    setSelectedFlowType("all");
    setSearch("");
    setCustomRange({ startDate: "", endDate: "" });
    setPage(1);
  };

  const handleExportCsv = () => {
    exportTableToCsv(filteredTransactions, columns, `bank-tracking-report-${localDate(new Date())}`);
  };

  const handleDownloadPdf = () => {
    exportTableToPdf(filteredTransactions, columns, `bank-tracking-report-${localDate(new Date())}`);
  };

  const handlePrintPdf = () => {
    printTable(filteredTransactions, columns, "Bank Tracking & Cash Flow Report");
  };

  const filterGroups = useMemo(
    () => [
      {
        key: "bankId",
        label: t("finance.bank", "Bank Account"),
        options: [
          { value: "all", label: t("common.all_banks", "All Banks") },
          ...bankList.map((b: any) => ({
            value: String(b.id),
            label: `${b.name} (${b.accountName})`,
          })),
        ],
      },
      {
        key: "flowType",
        label: t("common.flow", "Money Flow"),
        options: [
          { value: "all", label: t("common.all_flows", "All Flows (In & Out)") },
          { value: "IN", label: t("common.inflow", "Inflow (+) Received") },
          { value: "OUT", label: t("common.outflow", "Outflow (-) Paid") },
        ],
      },
      {
        key: "transactionType",
        label: t("common.type", "Transaction Type"),
        options: [
          { value: "all", label: t("common.all_types", "All Types") },
          { value: "SALE", label: "Sale (+)" },
          { value: "PURCHASE", label: "Purchase (-)" },
          { value: "EXPENSE", label: "Expense (-)" },
        ],
      },
    ],
    [t, bankList]
  );

  const filterValues = useMemo(
    () => ({
      bankId: selectedBankId,
      flowType: selectedFlowType,
      transactionType: selectedTxType,
    }),
    [selectedBankId, selectedFlowType, selectedTxType]
  );

  const handleFilterChange = (key: string, value: string) => {
    const nextVal = !value || value === "all" ? "all" : value;
    if (key === "bankId") setSelectedBankId(nextVal);
    if (key === "flowType") setSelectedFlowType(nextVal);
    if (key === "transactionType") setSelectedTxType(nextVal);
    setPage(1);
  };

  if (!canRead) {
    return <AccessDenied resource="reports" showBackButton />;
  }

  const periodTabs = [
    { label: t("common.all", "All Time"), mode: "all" as const, icon: LayoutList },
    { label: t("report.daily", "Daily"), mode: "daily" as const, icon: Calendar },
    { label: t("report.weekly", "Weekly"), mode: "weekly" as const, icon: CalendarDays },
    { label: t("report.monthly", "Monthly"), mode: "monthly" as const, icon: CalendarRange },
    { label: t("report.three_months", "3 Months"), mode: "3months" as const, icon: CalendarRange },
    { label: t("report.six_months", "6 Months"), mode: "6months" as const, icon: CalendarRange },
  ];

  const totalInflow = summary?.totalInflow ?? 0;
  const totalOutflow = summary?.totalOutflow ?? 0;
  const netFlow = summary?.netFlow ?? 0;
  const totalBalance = summary?.currentTotalBalance ?? 0;
  const txCount = summary?.totalTransactions ?? totalElements;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <PageHeader
        title={t("report.bank_tracking", "Bank Tracking & Balance Report")}
        hideButton
      />

      {/* KPI Cards Grid */}
      <KpiGrid cols={4}>
        <KpiCard
          label={t("finance.total_inflow", "Total Inflow (Received)")}
          value={formatCurrency(totalInflow)}
          icon={ArrowDownLeft}
          color="emerald"
          subtitle={`${txCount} transactions analyzed`}
        />
        <KpiCard
          label={t("finance.total_outflow", "Total Outflow (Paid)")}
          value={formatCurrency(totalOutflow)}
          icon={ArrowUpRight}
          color="rose"
          subtitle="Purchases & Expenses"
        />
        <KpiCard
          label={t("finance.net_flow", "Net Cash Flow")}
          value={formatCurrency(netFlow)}
          icon={Activity}
          color={netFlow >= 0 ? "indigo" : "amber"}
          subtitle="Inflow - Outflow"
        />
        <KpiCard
          label={t("finance.total_bank_balance", "Total Bank Balance")}
          value={formatCurrency(totalBalance)}
          icon={Building2}
          color="blue"
          subtitle={selectedBankId !== "all" ? "Selected bank" : "All active banks"}
        />
      </KpiGrid>

      {/* Main Container */}
      <div className="space-y-4 rounded-2xl border border-border bg-card p-5 shadow-card">
        {/* Period Tabs & Date Selectors */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-4">
          <div className="flex flex-wrap items-center gap-1 rounded-xl bg-muted p-1">
            {periodTabs.map(({ label, mode, icon: Icon }) => (
              <button
                key={mode}
                onClick={() => handlePeriodChange(mode)}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === mode && !customRange.startDate && !customRange.endDate
                    ? "bg-card text-primary shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="size-3.5" />
                {label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {activeTab === "daily" && (
              <DatePicker
                value={selectedDate}
                onChange={(d) => { setSelectedDate(d); setPage(1); }}
                placeholder="Pick day"
              />
            )}
            {activeTab === "weekly" && (
              <DatePicker
                value={selectedDate}
                onChange={(d) => { setSelectedDate(d); setPage(1); }}
                placeholder="Pick week day"
              />
            )}
            {activeTab === "monthly" && (
              <MonthPicker
                value={selectedMonth}
                onChange={(m) => { setSelectedMonth(m); setPage(1); }}
              />
            )}

            <DateRangePicker
              startDate={customRange.startDate}
              endDate={customRange.endDate}
              onChange={(range) => {
                setCustomRange(range);
                if (range.startDate || range.endDate) setActiveTab("all");
                setPage(1);
              }}
              placeholder="Custom range"
            />
          </div>
        </div>

        {/* Filter Bar with Search, Dropdowns, Export & Columns */}
        <PageFilter
          search={search}
          onSearchChange={(val) => { setSearch(val); setPage(1); }}
          searchPlaceholder={t("common.search", "Search by reference, account, note, or doc...")}
          filterGroups={filterGroups}
          filterValues={filterValues}
          onFilterChange={handleFilterChange}
          onReset={handleResetFilters}
          columns={columns}
          columnVisibility={columnVisibility}
          onColumnVisibilityChange={setColumnVisibility}
          onPrintPdf={handlePrintPdf}
          onDownloadPdf={handleDownloadPdf}
          onDownloadCsv={handleExportCsv}
        />

        {/* Table View */}
        <DataTable
          columns={columns}
          data={filteredTransactions}
          columnVisibility={columnVisibility}
          onColumnVisibilityChange={setColumnVisibility}
          isLoading={isPagedLoading || isSummaryLoading}
          pagination={{
            currentPage: page,
            pageSize,
            totalElements,
            totalPages,
            onPageChange: setPage,
            onPageSizeChange: setPageSize,
          }}
        />
      </div>
    </div>
  );
}

