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
import { useProduct } from "@/hooks/product/useProduct";
import { SalePaymentStatus, SaleStatus } from "@/types/sales/Sale";
import { PageFilter } from "@/utils/PageFilter";
import { useSearch } from "@/utils/useSearch";
import {
  SalesItemReportColumns,
  type SaleItemRow,
} from "./SalesItemReportColumn";

const formatCurrency = (value: number | string | undefined) => {
  const numeric = Number(value ?? 0);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(numeric);
};

const SalesItemReportPage = () => {
  const { Can } = usePermission();
  const canRead = Can(PERMISSION.REPORT.READ);

  const [page, setPage] = useState(1);
  const [size, setSize] = useState(10);
  const [search, setSearch] = useState("");
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [storeId, setStoreId] = useState<string>("all");
  const [productId, setProductId] = useState<string>("all");
  const [saleStatus, setSaleStatus] = useState<string>("all");
  const [paymentStatus, setPaymentStatus] = useState<string>("all");

  const { data: storeData } = useStore.useGetAllStore({ page: 1, size: 1000 });
  const { data: productData } = useProduct.useGetAllProduct({
    page: 1,
    size: 1000,
  });

  const stores = storeData?.payload?.data ?? [];
  const products = productData?.payload?.data ?? [];

  const filter = useMemo(
    () => ({
      page,
      size,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      storeId: storeId !== "all" ? Number(storeId) : undefined,
      productId: productId !== "all" ? Number(productId) : undefined,
      saleStatus: saleStatus !== "all" ? saleStatus : undefined,
      paymentStatus: paymentStatus !== "all" ? paymentStatus : undefined,
    }),
    [
      page,
      size,
      startDate,
      endDate,
      storeId,
      productId,
      saleStatus,
      paymentStatus,
    ],
  );

  // Fetch sales items report data
  const { data: itemsData } = useReport.useSalesItemsReport(filter, {
    page,
    size,
  });

  // Fetch sales report summary for KPI cards
  const { data: summaryData } = useReport.useSalesReport(filter);
  const summary = useMemo(() => {
    const payload = (summaryData as any)?.payload ?? summaryData ?? {};
    if (payload.totalSalesAmount !== undefined && !Array.isArray(payload.data)) {
      return {
        totalSalesAmount: Number(payload.totalSalesAmount ?? 0),
        totalDiscount: Number(payload.totalDiscount ?? 0),
        totalPaidAmount: Number(payload.totalPaidAmount ?? 0),
        totalTransactions: Number(payload.totalTransactions ?? 0),
      };
    }
    const dataArray = Array.isArray(payload?.data)
      ? payload.data
      : Array.isArray(payload)
        ? payload
        : [];
    // Aggregate across all groups
    let totalSalesAmount = 0;
    let totalDiscount = 0;
    let totalPaidAmount = 0;
    let totalTransactions = 0;
    for (const group of dataArray) {
      totalSalesAmount += Number(group.totalSalesAmount ?? 0);
      totalDiscount += Number(group.totalDiscount ?? 0);
      totalPaidAmount += Number(group.totalPaidAmount ?? 0);
      totalTransactions += Number(group.totalTransactions ?? 0);
    }
    return { totalSalesAmount, totalDiscount, totalPaidAmount, totalTransactions };
  }, [summaryData]);

  console.log("sale report", summaryData)
  // Flatten nested API response: payload.data[*].sales[*].items[*] or payload.sales[*].items[*]
  const rows = useMemo((): SaleItemRow[] => {
    if (!itemsData) return [];
    const payload = (itemsData as any)?.payload ?? itemsData;
    const groups = Array.isArray(payload?.data)
      ? payload.data
      : Array.isArray(payload)
        ? payload
        : payload?.sales
          ? [payload]
          : [];

    const flatItems: SaleItemRow[] = [];
    for (const group of groups) {
      // Direct sale item in flat list
      if (group.productName && !group.sales && !group.items) {
        flatItems.push({
          ...group,
          productId: group.productId ?? group.product?.id ?? group.id,
          productName: group.productName ?? group.product?.name ?? "-",
          quantity: group.qty ?? group.quantity ?? 1,
          price: group.price ?? 0,
          itemDiscount: group.itemDiscount ?? group.discount ?? 0,
          subTotal: group.subTotal ?? (group.price ?? 0) * (group.qty ?? group.quantity ?? 1),
          serialNumbers: group.productSerialIds ?? group.serialNumbers ?? [],
        });
        continue;
      }

      const sales = Array.isArray(group.sales)
        ? group.sales
        : Array.isArray(group.items)
          ? [group]
          : [];

      for (const sale of sales) {
        const items = Array.isArray(sale.items) ? sale.items : [];
        for (const item of items) {
          const qty = Number(item.qty ?? item.quantity ?? 1);
          const price = Number(item.price ?? 0);
          const discount = Number(item.itemDiscount ?? item.discount ?? 0);
          const subTotal = item.subTotal !== undefined ? Number(item.subTotal) : (price * qty - discount);

          flatItems.push({
            ...item,
            saleId: sale.id,
            saleReference: sale.no || sale.reference || "-",
            saleDate: sale.date ?? sale.saleDate ?? sale.createdAt ?? "-",
            storeId: sale.storeId ?? group.storeId,
            storeName: sale.storeName ?? group.storeName ?? "-",
            productId: item.productId ?? item.product?.id ?? item.id,
            productName: item.productName ?? item.product?.name ?? "-",
            status: sale.status,
            paymentStatus: sale.paymentStatus,
            quantity: qty,
            price: price,
            itemDiscount: discount,
            subTotal: subTotal,
            serialNumbers: item.productSerialIds ?? item.serialNumbers ?? [],
          });
        }
      }
    }
    return flatItems;
  }, [itemsData]);

  const filterGroups = useMemo(
    () => [
      {
        key: "storeId",
        label: "Store",
        options: stores.map((store: any) => ({
          label: store.name,
          value: String(store.id),
        })),
      },
      {
        key: "productId",
        label: "Product",
        options: products.map((product: any) => ({
          label: product.name,
          value: String(product.id),
        })),
      },
      {
        key: "saleStatus",
        label: "Sale Status",
        options: Object.values(SaleStatus).map((status) => ({
          label: status,
          value: status,
        })),
      },
      {
        key: "paymentStatus",
        label: "Payment Status",
        options: Object.values(SalePaymentStatus).map((status) => ({
          label: status,
          value: status,
        })),
      },
    ],
    [stores, products],
  );

  const searchFilteredRows = useSearch(rows, search, [
    "saleReference",
    "productName",
    "saleDate",
    "storeName",
  ]);

  const filteredRows = useMemo(() => {
    return searchFilteredRows.filter((row: any) => {
      if (storeId !== "all" && String(row.storeId) !== storeId) return false;
      if (productId !== "all" && String(row.productId) !== productId)
        return false;
      if (saleStatus !== "all" && row.status !== saleStatus) return false;
      if (paymentStatus !== "all" && row.paymentStatus !== paymentStatus)
        return false;
      return true;
    });
  }, [searchFilteredRows, storeId, productId, saleStatus, paymentStatus]);

  const columns = SalesItemReportColumns();

  const handleSearchFilterChange = (key: string, value: string) => {
    setFilterValues((prev) => ({ ...prev, [key]: value }));
    if (key === "storeId") setStoreId(value || "all");
    if (key === "productId") setProductId(value || "all");
    if (key === "saleStatus") setSaleStatus(value || "all");
    if (key === "paymentStatus") setPaymentStatus(value || "all");
  };

  const handleExportExcel = () => {
    exportTableToCsv(filteredRows, columns, "sales-item-report");
  };

  const handleDownloadPdf = () => {
    exportTableToPdf(
      filteredRows,
      columns,
      "sales-item-report",
      "Sales Item Report",
    );
  };

  const handlePrint = () => {
    printTable("Sales Item Report");
  };

  if (!canRead) {
    return <AccessDenied resource="sales item reports" showBackButton />;
  }

  // KPI card definitions with icon, accent color, and formatted values
  const kpiCards = [
    {
      label: "Total Sales",
      value: formatCurrency(summary.totalSalesAmount),
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
      ),
      iconBg: "bg-[#696cff]/10 text-[#696cff]",
      valueColor: "text-[#696cff]",
      border: "border-[#696cff]/20",
    },
    {
      label: "Total Discount",
      value: formatCurrency(summary.totalDiscount),
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
      ),
      iconBg: "bg-[#ff3e1d]/10 text-[#ff3e1d]",
      valueColor: "text-[#ff3e1d]",
      border: "border-[#ff3e1d]/20",
    },
    {
      label: "Paid Amount",
      value: formatCurrency(summary.totalPaidAmount),
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="1" y="4" width="22" height="16" rx="2" ry="2" /><line x1="1" y1="10" x2="23" y2="10" />
        </svg>
      ),
      iconBg: "bg-[#71dd37]/10 text-[#71dd37]",
      valueColor: "text-[#71dd37]",
      border: "border-[#71dd37]/20",
    },
    {
      label: "Transactions",
      value: Number(summary.totalTransactions).toLocaleString(),
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </svg>
      ),
      iconBg: "bg-[#ffab00]/10 text-[#ffab00]",
      valueColor: "text-[#ffab00]",
      border: "border-[#ffab00]/20",
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sales Item Reports"
      // description="Detailed breakdown of each sold item by transaction"
      />

      {/* KPI Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {kpiCards.map((card) => (
          <div
            key={card.label}
            className={`rounded-xl border ${card.border} bg-card p-5 shadow-sm transition-shadow hover:shadow-md`}
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-muted-foreground">{card.label}</p>
              <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${card.iconBg}`}>
                {card.icon}
              </span>
            </div>
            <h3 className={`mt-3 text-2xl font-bold tracking-tight ${card.valueColor}`}>
              {card.value}
            </h3>
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
              setProductId("all");
              setSaleStatus("all");
              setPaymentStatus("all");
              setStartDate("");
              setEndDate("");
              setPage(1);
            }}
          />
        </div>

        {/* Advanced Filter Bar */}
        <div className="border-b bg-muted/30 p-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
              </svg>
              <h2 className="text-sm font-semibold text-foreground">Filter Sales Items</h2>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#696cff]/10 px-2.5 py-0.5 text-xs font-semibold text-[#696cff]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#696cff]" />
              {filteredRows.length} records
            </span>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
            {/* Start Date */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-muted-foreground">From Date</label>
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-2.5 flex items-center text-muted-foreground">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                </span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => { setPage(1); setStartDate(e.target.value); }}
                  className="w-full rounded-lg border border-border bg-background py-2 pl-8 pr-3 text-sm transition-colors focus:border-[#696cff] focus:outline-none focus:ring-1 focus:ring-[#696cff]/30"
                />
              </div>
            </div>

            {/* End Date */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-muted-foreground">To Date</label>
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-2.5 flex items-center text-muted-foreground">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                </span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => { setPage(1); setEndDate(e.target.value); }}
                  className="w-full rounded-lg border border-border bg-background py-2 pl-8 pr-3 text-sm transition-colors focus:border-[#696cff] focus:outline-none focus:ring-1 focus:ring-[#696cff]/30"
                />
              </div>
            </div>

            {/* Store */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-muted-foreground">Store</label>
              <select
                value={storeId}
                onChange={(e) => { setPage(1); setStoreId(e.target.value); }}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm transition-colors focus:border-[#696cff] focus:outline-none focus:ring-1 focus:ring-[#696cff]/30"
              >
                <option value="all">All Stores</option>
                {stores.map((store: any) => (
                  <option key={store.id} value={store.id}>{store.name}</option>
                ))}
              </select>
            </div>

            {/* Product */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-muted-foreground">Product</label>
              <select
                value={productId}
                onChange={(e) => { setPage(1); setProductId(e.target.value); }}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm transition-colors focus:border-[#696cff] focus:outline-none focus:ring-1 focus:ring-[#696cff]/30"
              >
                <option value="all">All Products</option>
                {products.map((product: any) => (
                  <option key={product.id} value={product.id}>{product.name}</option>
                ))}
              </select>
            </div>

            {/* Sale Status */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-muted-foreground">Sale Status</label>
              <select
                value={saleStatus}
                onChange={(e) => { setPage(1); setSaleStatus(e.target.value); }}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm transition-colors focus:border-[#696cff] focus:outline-none focus:ring-1 focus:ring-[#696cff]/30"
              >
                <option value="all">All Statuses</option>
                {Object.values(SaleStatus).map((status) => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>

            {/* Payment Status */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-muted-foreground">Payment</label>
              <select
                value={paymentStatus}
                onChange={(e) => { setPage(1); setPaymentStatus(e.target.value); }}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm transition-colors focus:border-[#696cff] focus:outline-none focus:ring-1 focus:ring-[#696cff]/30"
              >
                <option value="all">All Payments</option>
                {Object.values(SalePaymentStatus).map((status) => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>
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

export default SalesItemReportPage;
