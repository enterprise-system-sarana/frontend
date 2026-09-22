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
import { useCustomer } from "@/hooks/sales/useCustomer";
import { SalePaymentStatus, SaleStatus } from "@/types/sales/Sale";
import { PageFilter } from "@/utils/PageFilter";
import { useSearch } from "@/utils/useSearch";
import { SalesReportColumns } from "./SalesReportColumn";

const formatCurrency = (value: number | string | undefined) => {
  const numeric = Number(value ?? 0);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(numeric);
};

const ReportPage = () => {
  const { Can } = usePermission();
  const canRead = Can(PERMISSION.REPORT.READ);

  const [page, setPage] = useState(1);
  const [size, setSize] = useState(10);
  const [search, setSearch] = useState("");
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
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
  const salesRows = Array.isArray(summary.sales) ? summary.sales : [];

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

  const searchFilteredRows = useSearch(salesRows, search, [
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

  const handleExportExcel = () => {
    exportTableToCsv(filteredRows, columns, "sales-report");
  };

  const handleDownloadPdf = () => {
    exportTableToPdf(filteredRows, columns, "sales-report", "Sales Report");
  };

  const handlePrint = () => {
    printTable("Sales Report");
  };

  if (!canRead) {
    return <AccessDenied resource="reports" showBackButton />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sales Reports"
        description="Overview of sales performance and transactions"
      />

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

      <div className="rounded-2xl border border-border/60 bg-card shadow-sm overflow-hidden">
        <div className="border-b p-4">
          <PageFilter
            search={search}
            onSearchChange={setSearch}
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
            }}
          />
        </div>

        <div className="flex flex-col gap-3 border-b p-4">
          <div>
            <h2 className="text-lg font-semibold">Sales Transactions</h2>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setPage(1);
                setStartDate(e.target.value);
              }}
              className="rounded-md border bg-background px-3 py-2 text-sm"
            />
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setPage(1);
                setEndDate(e.target.value);
              }}
              className="rounded-md border bg-background px-3 py-2 text-sm"
            />
            <select
              value={storeId}
              onChange={(e) => {
                setPage(1);
                setStoreId(e.target.value);
              }}
              className="rounded-md border bg-background px-3 py-2 text-sm"
            >
              <option value="all">All Stores</option>
              {stores.map((store: any) => (
                <option key={store.id} value={store.id}>{store.name}</option>
              ))}
            </select>
            <select
              value={customerId}
              onChange={(e) => {
                setPage(1);
                setCustomerId(e.target.value);
              }}
              className="rounded-md border bg-background px-3 py-2 text-sm"
            >
              <option value="all">All Customers</option>
              {customers.map((customer: any) => (
                <option key={customer.id} value={customer.id}>{customer.name}</option>
              ))}
            </select>
            <select
              value={saleStatus}
              onChange={(e) => {
                setPage(1);
                setSaleStatus(e.target.value);
              }}
              className="rounded-md border bg-background px-3 py-2 text-sm"
            >
              <option value="all">All Sale Status</option>
              {Object.values(SaleStatus).map((status) => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
            <select
              value={paymentStatus}
              onChange={(e) => {
                setPage(1);
                setPaymentStatus(e.target.value);
              }}
              className="rounded-md border bg-background px-3 py-2 text-sm"
            >
              <option value="all">All Payment Status</option>
              {Object.values(SalePaymentStatus).map((status) => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>
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
