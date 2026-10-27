import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
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
import { useCustomer } from "@/hooks/sales/useCustomer";
import { SalePaymentStatus, SaleStatus } from "@/types/sales/Sale";
import { PageFilter } from "@/utils/PageFilter";
import { useSearch } from "@/utils/useSearch";
import { SalesReportColumns, type SaleReportRow } from "./SalesReportColumn";
import { ROUTERS } from "@/constants/Route";
import { useLanguage } from "@/i18n/LanguageContext";
import {
  DollarSign,
  TrendingUp,
  Package,
  Wallet,
  Calendar,
  CalendarDays,
  CalendarRange,
  LayoutList,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";

type SalesReportMode = "daily" | "weekly" | "monthly" | "3months" | "6months" | "all";

const localDate = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

const getPeriod = (mode: SalesReportMode, value: string) => {
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

const ReportPage = ({ mode = "all" }: { mode?: SalesReportMode }) => {
  const { t } = useLanguage();
  const { Can } = usePermission();
  const canRead = Can(PERMISSION.REPORT.READ);

  const [page, setPage] = useState(1);
  const [size, setSize] = useState(10);
  const [search, setSearch] = useState("");
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});
  const [initialPeriod] = useState(() => {
    const today = new Date();
    if (mode === "monthly") return localDate(today).slice(0, 7);
    return localDate(today);
  });
  const [periodValue, setPeriodValue] = useState(initialPeriod);
  const [startDate, setStartDate] = useState(() => getPeriod(mode, initialPeriod).startDate);
  const [endDate, setEndDate] = useState(() => getPeriod(mode, initialPeriod).endDate);
  const [storeId, setStoreId] = useState<string>("all");
  const [customerId, setCustomerId] = useState<string>("all");
  const [saleStatus, setSaleStatus] = useState<string>("all");
  const [paymentStatus, setPaymentStatus] = useState<string>("all");

  const { data: storeData } = useStore.useGetAllStore({ page: 1, size: 1000 });
  const { data: customerData } = useCustomer.useGetAllCustomer({ page: 1, size: 1000 });

  const stores = storeData?.payload?.data ?? [];
  const customers = customerData?.payload?.data ?? [];

  const filter = useMemo(
    () => ({
      page,
      size,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      storeId: storeId !== "all" ? Number(storeId) : undefined,
      customerId: customerId !== "all" ? Number(customerId) : undefined,
      saleStatus: saleStatus !== "all" ? saleStatus : undefined,
      paymentStatus: paymentStatus !== "all" ? paymentStatus : undefined,
    }),
    [page, size, startDate, endDate, storeId, customerId, saleStatus, paymentStatus],
  );

  const { data: summaryData } = useReport.useSalesReport(filter);

  const summary = summaryData?.payload ?? summaryData ?? {};
  const salesRows: SaleReportRow[] = Array.isArray(summary.sales) ? summary.sales : [];

  const expenseFilter = useMemo(
    () => ({
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      storeId: storeId !== "all" ? Number(storeId) : undefined,
      page: 1,
      size: 1000,
    }),
    [startDate, endDate, storeId],
  );

  const { data: expenseData } = useReport.useExpenseReport(expenseFilter);

  const totalExpense = useMemo(() => {
    if (summary.totalExpense != null) return Number(summary.totalExpense);
    const payload = (expenseData as any)?.payload ?? expenseData;
    let list: any[] = [];
    if (Array.isArray(payload)) list = payload;
    else if (Array.isArray(payload?.data)) list = payload.data;
    else if (Array.isArray(payload?.content)) list = payload.content;
    else if (Array.isArray(payload?.expenses)) list = payload.expenses;
    else if (Array.isArray(payload?.items)) list = payload.items;
    return list.reduce((sum: number, item: any) => sum + (Number(item?.amount) || 0), 0);
  }, [summary.totalExpense, expenseData]);

  const totalSales = Number(summary.totalSalesAmount ?? 0);
  const totalProfit = Number(summary.totalProfit ?? 0);
  const totalCost = Number(summary.totalCost != null ? summary.totalCost : totalSales - totalProfit);
  const totalTransactions = Number(summary.totalTransactions ?? 0);
  const totalDiscount = Number(summary.totalDiscount ?? 0);
  const totalPaid = Number(summary.totalPaidAmount ?? 0);
  const profitMargin = totalSales > 0 ? ((totalProfit / totalSales) * 100).toFixed(1) : "0.0";

  const filterGroups = useMemo(
    () => [
      {
        key: "storeId",
        label: t("inventory.store", "Store"),
        options: stores.map((store: any) => ({ label: store.name, value: String(store.id) })),
      },
      {
        key: "customerId",
        label: t("sale.customer", "Customer"),
        options: customers.map((customer: any) => ({ label: customer.name, value: String(customer.id) })),
      },
      {
        key: "saleStatus",
        label: t("common.status", "Sale Status"),
        options: Object.values(SaleStatus).map((status) => ({ label: status, value: status })),
      },
      {
        key: "paymentStatus",
        label: t("purchase.payment_status", "Payment Status"),
        options: Object.values(SalePaymentStatus).map((status) => ({ label: status, value: status })),
      },
    ],
    [stores, customers, t],
  );

  const searchFilteredRows = useSearch<SaleReportRow>(salesRows, search, [
    "reference",
    "customerName",
    "storeName",
    "paymentStatus",
    "status",
  ]);

  const filteredRows = useMemo(() => {
    return searchFilteredRows.filter((row: any) => {
      if (storeId !== "all" && String(row.storeId) !== storeId) return false;
      if (customerId !== "all" && String(row.customerId) !== customerId) return false;
      if (saleStatus !== "all" && row.status !== saleStatus) return false;
      if (paymentStatus !== "all" && row.paymentStatus !== paymentStatus) return false;
      return true;
    });
  }, [searchFilteredRows, storeId, customerId, saleStatus, paymentStatus]);

  const columns = useMemo(() => SalesReportColumns({ t }), [t]);

  const handleSearchFilterChange = (key: string, value: string) => {
    setFilterValues((prev) => ({ ...prev, [key]: value }));
    if (key === "storeId") setStoreId(value || "all");
    if (key === "customerId") setCustomerId(value || "all");
    if (key === "saleStatus") setSaleStatus(value || "all");
    if (key === "paymentStatus") setPaymentStatus(value || "all");
  };

  const handlePeriodChange = (value: string) => {
    if (!value) return;
    setPeriodValue(value);
    const range = getPeriod(mode, value);
    setStartDate(range.startDate);
    setEndDate(range.endDate);
    setPage(1);
  };

  const reportTitle =
    mode === "daily"
      ? t("nav.daily_sales", "Daily Sales")
      : mode === "weekly"
        ? t("report.weekly", "Weekly Sales")
        : mode === "monthly"
          ? t("nav.monthly_sales", "Monthly Sales")
          : t("nav.sales_report", "Sales Report");

  const reportDescription =
    mode === "daily"
      ? t("report.daily_sales", "Sales for a selected day")
      : mode === "weekly"
        ? t("report.weekly", "Sales for a selected week")
        : mode === "monthly"
          ? t("report.monthly_sales", "Sales for a selected month")
          : t("report.sales", "Overview of sales performance and transactions");

  const handleExportExcel = () => {
    exportTableToCsv(filteredRows, columns, reportTitle.toLowerCase().replaceAll(" ", "-"));
  };
  const handleDownloadPdf = () => {
    exportTableToPdf(filteredRows, columns, reportTitle.toLowerCase().replaceAll(" ", "-"), reportTitle);
  };
  const handlePrint = () => {
    printTable(reportTitle);
  };

  if (!canRead) {
    return <AccessDenied resource="reports" showBackButton />;
  }

  const tabs = [
    { label: t("common.all", "All Sales"), route: ROUTERS.REPORT_SALES, value: "all" as const, icon: LayoutList },
    { label: t("report.today", "Daily"), route: ROUTERS.REPORT_DAILY_SALES, value: "daily" as const, icon: Calendar },
    { label: t("report.weekly", "Weekly"), route: ROUTERS.REPORT_WEEKLY_SALES, value: "weekly" as const, icon: CalendarRange },
    { label: t("report.monthly", "Monthly"), route: ROUTERS.REPORT_MONTHLY_SALES, value: "monthly" as const, icon: CalendarDays },
    { label: t("report.three_months", "3 Months"), route: `${ROUTERS.REPORT_SALES}?range=3months`, value: "3months" as const, icon: CalendarRange },
    { label: t("report.six_months", "6 Months"), route: `${ROUTERS.REPORT_SALES}?range=6months`, value: "6months" as const, icon: CalendarRange },
  ];

  const kpiCards = [
    {
      label: t("dashboard.total_sales", "Total Sales"),
      value: formatCurrency(totalSales),
      detail: `${totalTransactions} ${t("pos.items", "transactions")}`,
      icon: DollarSign,
      iconBg: "bg-blue-500/10 dark:bg-blue-500/20",
      iconColor: "text-blue-600 dark:text-blue-400",
      accent: "border-l-blue-500",
    },
    {
      label: t("dashboard.total_profit", "Total Profit"),
      value: formatCurrency(totalProfit),
      detail: `${profitMargin}% ${t("product.margin", "margin")}`,
      icon: TrendingUp,
      iconBg: "bg-emerald-500/10 dark:bg-emerald-500/20",
      iconColor: "text-emerald-600 dark:text-emerald-400",
      accent: "border-l-emerald-500",
      trend: totalProfit >= 0 ? "up" as const : "down" as const,
    },
    {
      label: t("dashboard.total_cost", "Total Cost"),
      value: formatCurrency(totalCost),
      detail: t("dashboard.cost_of_goods", "Cost of goods sold"),
      icon: Package,
      iconBg: "bg-amber-500/10 dark:bg-amber-500/20",
      iconColor: "text-amber-600 dark:text-amber-400",
      accent: "border-l-amber-500",
    },
    {
      label: t("dashboard.total_expense", "Total Expense"),
      value: formatCurrency(totalExpense),
      detail: t("dashboard.operating_expenses", "Operating expenses"),
      icon: Wallet,
      iconBg: "bg-rose-500/10 dark:bg-rose-500/20",
      iconColor: "text-rose-600 dark:text-rose-400",
      accent: "border-l-rose-500",
    },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <PageHeader
          title={reportTitle}
          description={reportDescription}
        />
      </div>
      {/* KPI Cards */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {kpiCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className={`relative rounded-xl border border-border/60 border-l-[3px] ${card.accent} bg-card p-4 transition-all duration-200 hover:shadow-md group`}
            >
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                    {card.label}
                  </p>
                  <div className="flex items-baseline gap-2">
                    <h3 className="text-xl font-bold tracking-tight text-foreground">
                      {card.value}
                    </h3>
                    {card.trend && (
                      <span className={`inline-flex items-center text-[10px] font-semibold ${card.trend === "up" ? "text-emerald-600" : "text-rose-600"}`}>
                        {card.trend === "up" ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}
                      </span>
                    )}
                  </div>
                </div>
                <div className={`rounded-lg p-2.5 ${card.iconBg} transition-transform duration-200 group-hover:scale-110`}>
                  <Icon className={`size-4 ${card.iconColor}`} />
                </div>
              </div>
              <p className="mt-2 text-[11px] text-muted-foreground">{card.detail}</p>
            </div>
          );
        })}
      </div>
      {/* Tab Navigation */}
      <div className="flex items-center gap-1 rounded-xl border border-border/60 bg-muted/30 p-1 w-fit">
        {tabs.map((tab) => {
          const TabIcon = tab.icon;
          const isActive = mode === tab.value;
          return (
            <Link
              key={tab.value}
              to={tab.route}
              className={`
                inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-200
                ${isActive
                  ? "bg-background text-foreground shadow-sm border border-border/80"
                  : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                }
              `}
            >
              <TabIcon className="size-3.5" />
              {tab.label}
            </Link>
          );
        })}
      </div>

      {/* Period Selector */}
      {mode !== "all" && (
        <div className="flex items-center gap-3">
          <label className="inline-flex items-center gap-2.5 rounded-lg border border-border/60 bg-card px-3.5 py-2 text-sm shadow-sm">
            <Calendar className="size-4 text-muted-foreground" />
            <span className="text-muted-foreground font-medium">
              {mode === "daily" ? t("common.date", "Date") : mode === "weekly" ? t("report.weekly", "Week") : t("report.monthly", "Month")}
            </span>
            <input
              type={mode === "daily" || mode === "weekly" ? "date" : "month"}
              value={periodValue}
              onChange={(e) => handlePeriodChange(e.target.value)}
              className="rounded-md border border-border bg-background px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </label>
        </div>
      )}

      {/* Data Table Section */}
      <div className="rounded-xl border border-border/60 bg-card overflow-hidden shadow-sm">
        <div className="border-b border-border/60 px-4 py-3">
          <PageFilter
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder={t("common.search", "Search reference, customer, store...")}
            startDate={mode === "all" ? startDate : undefined}
            endDate={mode === "all" ? endDate : undefined}
            onStartDateChange={mode === "all" ? (value) => { setPage(1); setStartDate(value); } : undefined}
            onEndDateChange={mode === "all" ? (value) => { setPage(1); setEndDate(value); } : undefined}
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
              setCustomerId("all");
              setSaleStatus("all");
              setPaymentStatus("all");
              const range = getPeriod(mode, initialPeriod);
              setPeriodValue(initialPeriod);
              setStartDate(range.startDate);
              setEndDate(range.endDate);
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

export default ReportPage;
