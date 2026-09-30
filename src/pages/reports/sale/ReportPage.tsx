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

type SalesReportMode = "daily" | "monthly" | "all";

const localDate = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

const getPeriod = (mode: SalesReportMode, value: string) => {
  if (mode === "daily") return { startDate: value, endDate: value };
  if (mode === "monthly") {
    const [year, month] = value.split("-").map(Number);
    if (!year || !month) return { startDate: "", endDate: "" };
    return {
      startDate: localDate(new Date(year, month - 1, 1)),
      endDate: localDate(new Date(year, month, 0)),
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
  const { Can } = usePermission();
  const canRead = Can(PERMISSION.REPORT.READ);

  const [page, setPage] = useState(1);
  const [size, setSize] = useState(10);
  const [search, setSearch] = useState("");
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});
  const [initialPeriod] = useState(() => {
    const today = new Date();
    return mode === "monthly" ? localDate(today).slice(0, 7) : localDate(today);
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

  const filterGroups = useMemo(
    () => [
      {
        key: "storeId",
        label: "Store",
        options: stores.map((store: any) => ({ label: store.name, value: String(store.id) })),
      },
      {
        key: "customerId",
        label: "Customer",
        options: customers.map((customer: any) => ({ label: customer.name, value: String(customer.id) })),
      },
      {
        key: "saleStatus",
        label: "Sale Status",
        options: Object.values(SaleStatus).map((status) => ({ label: status, value: status })),
      },
      {
        key: "paymentStatus",
        label: "Payment Status",
        options: Object.values(SalePaymentStatus).map((status) => ({ label: status, value: status })),
      },
    ],
    [stores, customers],
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

  const columns = SalesReportColumns();

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

  const reportTitle = mode === "daily" ? "Daily Sales" : mode === "monthly" ? "Monthly Sales" : "Sales Report";

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

  return (
    <div className="space-y-6">
      <PageHeader
        title={reportTitle}
        description={mode === "daily" ? "Sales for a selected day" : mode === "monthly" ? "Sales for a selected month" : "Overview of sales performance and transactions"}
      />

      <div className="flex flex-wrap items-center gap-2">
        {[
          { label: "Daily Sales", route: ROUTERS.REPORT_DAILY_SALES, value: "daily" },
          { label: "Monthly Sales", route: ROUTERS.REPORT_MONTHLY_SALES, value: "monthly" },
          { label: "Sales Report", route: ROUTERS.REPORT_SALES, value: "all" },
        ].map((tab) => (
          <Link key={tab.value} to={tab.route} className={`rounded-lg border px-3 py-2 text-xs font-semibold transition-colors ${mode === tab.value ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-muted-foreground hover:text-foreground"}`}>
            {tab.label}
          </Link>
        ))}
      </div>

      {mode !== "all" && (
        <label className="flex w-fit items-center gap-3 rounded-xl border bg-card px-4 py-3 text-sm font-medium">
          {mode === "daily" ? "Select day" : "Select month"}
          <input type={mode === "daily" ? "date" : "month"} value={periodValue} onChange={(event) => handlePeriodChange(event.target.value)} className="rounded-md border border-border bg-background px-2 py-1.5 text-sm" />
        </label>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: "Total Sales",
            value: formatCurrency(summary.totalSalesAmount ?? 0),
          },
          {
            label: "Discount",
            value: formatCurrency(summary.totalDiscount ?? 0),
          },
          {
            label: "Paid Amount",
            value: formatCurrency(summary.totalPaidAmount ?? 0),
          },
          {
            label: "Transactions",
            value: Number(summary.totalTransactions ?? 0).toLocaleString(),
          },
        ].map((card) => (
          <div key={card.label} className="rounded-xl border bg-card p-4 shadow-sm">
            <p className="text-sm text-muted-foreground">{card.label}</p>
            <h3 className="mt-2 text-2xl font-bold">{card.value}</h3>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-border/60 bg-card shadow-2xs overflow-hidden">
        <div className="border-b border-border/60 p-4">
          <PageFilter
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder="Search reference, customer, store..."
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
