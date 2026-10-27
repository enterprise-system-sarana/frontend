import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
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
import { useSupplier } from "@/hooks/purchases/useSupplier";
import { PageFilter } from "@/utils/PageFilter";
import { useSearch } from "@/utils/useSearch";
import { PurchaseReportColumns, type PurchaseReportRow } from "./PurchaseReportColumn";
import { PurchaseDetailModal } from "@/pages/purchases/purchase/PurchaseDetail";
import { ROUTERS } from "@/constants/Route";
import { useLanguage } from "@/i18n/LanguageContext";
import {
  DollarSign,
  Package,
  Wallet,
  Calendar,
  CalendarDays,
  CalendarRange,
  LayoutList,
  AlertCircle,
  FileText,
  ShoppingBag,
  Store,
  Truck,
  RotateCcw,
} from "lucide-react";

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

export default function PurchaseReportPage({ mode: initialMode = "all" }: { mode?: ReportPeriodMode }) {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { Can } = usePermission();
  const canRead = Can(PERMISSION.REPORT.READ);

  const [activeTab, setActiveTab] = useState<ReportPeriodMode>(initialMode);
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(10);
  const [search, setSearch] = useState("");
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});

  const [initialPeriod] = useState(() => {
    const today = new Date();
    if (initialMode === "monthly") return localDate(today).slice(0, 7);
    return localDate(today);
  });
  const [periodValue, setPeriodValue] = useState(initialPeriod);
  const [startDate, setStartDate] = useState(() => getPeriod(initialMode, initialPeriod).startDate);
  const [endDate, setEndDate] = useState(() => getPeriod(initialMode, initialPeriod).endDate);
  const [storeId, setStoreId] = useState<string>("all");
  const [supplierId, setSupplierId] = useState<string>("all");
  const [status, setStatus] = useState<string>("all");
  const [paymentStatus, setPaymentStatus] = useState<string>("all");

  // Modal inspection state
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedPurchaseId, setSelectedPurchaseId] = useState<number | null>(null);

  const { data: storeData } = useStore.useGetAllStore({ page: 1, size: 1000 });
  const { data: supplierData } = useSupplier.useGetAllSupplier({ page: 1, size: 1000 });

  const stores = storeData?.payload?.data ?? storeData?.data ?? [];
  const suppliers = supplierData?.payload?.data ?? supplierData?.data ?? [];

  const handleTabChange = (newMode: ReportPeriodMode) => {
    setActiveTab(newMode);
    setPage(1);
    const today = new Date();
    const periodStr = newMode === "monthly" ? localDate(today).slice(0, 7) : localDate(today);
    setPeriodValue(periodStr);
    const dates = getPeriod(newMode, periodStr);
    setStartDate(dates.startDate);
    setEndDate(dates.endDate);
  };

  const filter = useMemo(
    () => ({
      page,
      size,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      storeId: storeId !== "all" ? Number(storeId) : undefined,
      supplierId: supplierId !== "all" ? Number(supplierId) : undefined,
      status: status !== "all" ? status : undefined,
      paymentStatus: paymentStatus !== "all" ? paymentStatus : undefined,
    }),
    [page, size, startDate, endDate, storeId, supplierId, status, paymentStatus],
  );

  const { data: reportData, isLoading, isError, refetch } = useReport.usePurchaseReport(filter);

  const summary = reportData?.payload ?? reportData ?? {};
  const purchaseRows: PurchaseReportRow[] = Array.isArray(summary.purchases)
    ? summary.purchases
    : Array.isArray(summary.data)
      ? summary.data
      : [];

  const totalAmount = Number(summary.totalAmount ?? 0);
  const totalPaid = Number(summary.totalPaidAmount ?? 0);
  const totalDue = Number(summary.totalDueAmount ?? 0);
  const totalTransactions = Number(summary.totalTransactions ?? purchaseRows.length);
  const totalQuantity = Number(summary.totalQuantity ?? 0);

  const filterGroups = useMemo(
    () => [
      {
        key: "storeId",
        label: t("inventory.store", "Store"),
        options: stores.map((store: any) => ({ label: store.name, value: String(store.id) })),
      },
      {
        key: "supplierId",
        label: t("purchase.supplier", "Supplier"),
        options: suppliers.map((supplier: any) => ({
          label: supplier.name || supplier.companyName,
          value: String(supplier.id),
        })),
      },
      {
        key: "status",
        label: t("common.status", "Purchase Status"),
        options: [
          { label: "Received", value: "RECEIVED" },
          { label: "Ordered", value: "ORDERED" },
          { label: "Pending", value: "PENDING" },
        ],
      },
      {
        key: "paymentStatus",
        label: t("purchase.payment_status", "Payment Status"),
        options: [
          { label: "Paid", value: "PAID" },
          { label: "Partial", value: "PARTIAL" },
          { label: "Unpaid", value: "UNPAID" },
        ],
      },
    ],
    [stores, suppliers, t],
  );

  const handleFilterChange = (key: string, value: string) => {
    setFilterValues((prev) => ({ ...prev, [key]: value }));
    setPage(1);
    if (key === "storeId") setStoreId(value);
    if (key === "supplierId") setSupplierId(value);
    if (key === "status") setStatus(value);
    if (key === "paymentStatus") setPaymentStatus(value);
  };

  const handleResetFilters = () => {
    setFilterValues({});
    setSearch("");
    setStoreId("all");
    setSupplierId("all");
    setStatus("all");
    setPaymentStatus("all");
    setStartDate("");
    setEndDate("");
    setActiveTab("all");
    setPage(1);
  };

  const searchedRows = useSearch(purchaseRows, search, [
    "referenceNo",
    "supplierName",
    "storeName",
    "status",
    "paymentStatus",
  ]);

  const columns = useMemo(
    () =>
      PurchaseReportColumns({
        t,
        onViewDetail: (id: number) => {
          setSelectedPurchaseId(id);
          setDetailModalOpen(true);
        },
        onViewInvoice: (id: number) => {
          navigate(ROUTERS.PURCHASE_INVOICE.replace(":id", String(id)));
        },
      }),
    [t, navigate],
  );

  const periodTabs = [
    { label: t("common.daily", "Today"), value: "daily" as const, icon: Calendar },
    { label: t("common.weekly", "This Week"), value: "weekly" as const, icon: CalendarDays },
    { label: t("common.monthly", "This Month"), value: "monthly" as const, icon: CalendarRange },
    { label: t("report.three_months", "3 Months"), value: "3months" as const, icon: CalendarRange },
    { label: t("report.six_months", "6 Months"), value: "6months" as const, icon: CalendarRange },
    { label: t("common.all", "All Purchases"), value: "all" as const, icon: LayoutList },
  ];

  if (!canRead) {
    return <AccessDenied message={t("report.access_denied", "You do not have permission to view purchase reports.")} />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("report.purchase_title", "Purchase Reports")}
        description={t(
          "report.purchase_desc",
          "Comprehensive overview of procurement expenditures, supplier transactions, and payment statuses."
        )}
      >
        <div className="flex items-center gap-2">
          <Link
            to={ROUTERS.REPORT_PURCHASE_ITEMS}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-border/80 bg-background hover:bg-muted transition-colors shadow-xs"
          >
            <Package className="size-3.5 text-primary" />
            <span>{t("report.view_item_reports", "View Item Breakdown")}</span>
          </Link>
        </div>
      </PageHeader>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Purchases */}
        <div className="p-4 rounded-xl border border-border/60 bg-card shadow-xs relative overflow-hidden group hover:border-primary/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t("purchase.total_purchases", "Total Purchases")}
            </span>
            <div className="size-9 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <ShoppingBag className="size-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold tracking-tight text-foreground">
              {formatCurrency(totalAmount)}
            </span>
            <span className="text-xs font-semibold text-muted-foreground">
              {totalTransactions} {t("common.invoices", "orders")}
            </span>
          </div>
        </div>

        {/* Total Paid Amount */}
        <div className="p-4 rounded-xl border border-border/60 bg-card shadow-xs relative overflow-hidden group hover:border-emerald-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t("purchase.total_paid", "Total Paid")}
            </span>
            <div className="size-9 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Wallet className="size-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
              {formatCurrency(totalPaid)}
            </span>
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              {totalAmount > 0 ? `${((totalPaid / totalAmount) * 100).toFixed(1)}% settled` : "—"}
            </span>
          </div>
        </div>

        {/* Outstanding Due Amount */}
        <div className="p-4 rounded-xl border border-border/60 bg-card shadow-xs relative overflow-hidden group hover:border-rose-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t("purchase.total_due", "Total Due / Unpaid")}
            </span>
            <div className={`size-9 rounded-lg flex items-center justify-center ${
              totalDue > 0 ? "bg-rose-500/10 text-rose-600 dark:text-rose-400" : "bg-muted text-muted-foreground"
            }`}>
              <AlertCircle className="size-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className={`text-2xl font-bold tracking-tight ${totalDue > 0 ? "text-rose-600 dark:text-rose-400" : "text-foreground"}`}>
              {formatCurrency(totalDue)}
            </span>
            {totalDue > 0 && (
              <span className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full">
                Action Needed
              </span>
            )}
          </div>
        </div>

        {/* Total Units / Quantity */}
        <div className="p-4 rounded-xl border border-border/60 bg-card shadow-xs relative overflow-hidden group hover:border-sky-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t("purchase.total_quantity", "Purchased Items")}
            </span>
            <div className="size-9 rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center">
              <Package className="size-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold tracking-tight text-foreground">
              {totalQuantity.toLocaleString()}
            </span>
            <span className="text-xs font-semibold text-muted-foreground">
              Units Received
            </span>
          </div>
        </div>
      </div>

      {/* Filter Bar & Quick Period Selector */}
      <div className="space-y-3">
        {/* Period Selector Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-muted/40 border border-border/60 shadow-xs">
            {periodTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.value;
              return (
                <button
                  key={tab.value}
                  type="button"
                  onClick={() => handleTabChange(tab.value)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                    isActive
                      ? "bg-background text-foreground shadow-xs border border-border/80"
                      : "text-muted-foreground hover:text-foreground hover:bg-background/40"
                  }`}
                >
                  <Icon className="size-3.5 text-primary" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Quick Date Range / Period Input */}
          <div className="flex items-center gap-2">
            {activeTab === "daily" && (
              <input
                type="date"
                value={periodValue}
                onChange={(e) => {
                  setPeriodValue(e.target.value);
                  setStartDate(e.target.value);
                  setEndDate(e.target.value);
                }}
                className="h-8 px-2.5 text-xs rounded-lg border border-border bg-background shadow-xs focus:ring-1 focus:ring-primary/40"
              />
            )}
            {activeTab === "monthly" && (
              <input
                type="month"
                value={periodValue}
                onChange={(e) => {
                  setPeriodValue(e.target.value);
                  const p = getPeriod("monthly", e.target.value);
                  setStartDate(p.startDate);
                  setEndDate(p.endDate);
                }}
                className="h-8 px-2.5 text-xs rounded-lg border border-border bg-background shadow-xs focus:ring-1 focus:ring-primary/40"
              />
            )}
            {activeTab === "all" && (
              <div className="flex items-center gap-1.5 text-xs">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="h-8 px-2 text-xs rounded-lg border border-border bg-background shadow-xs"
                  placeholder="From"
                />
                <span className="text-muted-foreground">to</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="h-8 px-2 text-xs rounded-lg border border-border bg-background shadow-xs"
                  placeholder="To"
                />
              </div>
            )}
            {(storeId !== "all" || supplierId !== "all" || status !== "all" || paymentStatus !== "all" || search || startDate || endDate) && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors border border-border/60"
                title="Reset all filters"
              >
                <RotateCcw className="size-3" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* Global PageFilter with dropdown groups */}
        <PageFilter
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder={t("report.search_purchase_placeholder", "Search by reference, supplier, store...")}
          filterGroups={filterGroups}
          filterValues={filterValues}
          onFilterChange={handleFilterChange}
          onResetFilter={handleResetFilters}
        />
      </div>

      {/* Main Data Table Card */}
      <div className="rounded-2xl border border-border/60 bg-card shadow-xs overflow-hidden">
        <DataTable
          columns={columns}
          data={searchedRows}
          isLoading={isLoading}
          isError={isError}
          onReload={refetch}
          page={page}
          size={size}
          total={searchedRows.length}
          onPageChange={setPage}
          onPageSizeChange={(newSize) => {
            setSize(newSize);
            setPage(1);
          }}
          onExportCsv={() => exportTableToCsv(columns, searchedRows, "purchase_report")}
          onExportPdf={() => exportTableToPdf(columns, searchedRows, "purchase_report", "Purchase Report")}
          onPrint={() => printTable(columns, searchedRows, "Purchase Report")}
          actionButton={
            <div className="flex items-center gap-2">
              <Link
                to={ROUTERS.PURCHASE_CREATE}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-xs"
              >
                <FileText className="size-3.5" />
                <span>{t("purchase.create_title", "New Purchase")}</span>
              </Link>
            </div>
          }
        />
      </div>

      {/* Detail Modal Component */}
      <PurchaseDetailModal
        purchaseId={selectedPurchaseId}
        open={detailModalOpen}
        onOpenChange={setDetailModalOpen}
      />
    </div>
  );
}
