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
import { useLanguage } from "@/i18n/LanguageContext";
import { KpiCard, KpiGrid } from "@/components/ui/kpi-card";
import { Activity, CreditCard, DollarSign, Tag } from "lucide-react";
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

const pct = (part: number, total: number) => (total > 0 ? (part / total) * 100 : 0);

const SalesItemReportPage = () => {
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
        label: t("store.name", "Store"),
        options: stores.map((store: any) => ({
          label: store.name,
          value: String(store.id),
        })),
      },
      {
        key: "productId",
        label: t("product.name", "Product"),
        options: products.map((product: any) => ({
          label: product.name,
          value: String(product.id),
        })),
      },
      {
        key: "saleStatus",
        label: t("sale.status", "Sale Status"),
        options: Object.values(SaleStatus).map((status) => ({
          label: status,
          value: status,
        })),
      },
      {
        key: "paymentStatus",
        label: t("sale.payment_status", "Payment Status"),
        options: Object.values(SalePaymentStatus).map((status) => ({
          label: status,
          value: status,
        })),
      },
    ],
    [stores, products, t],
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

  const columns = useMemo(() => SalesItemReportColumns({ t }), [t]);

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

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("report.sales_items", "Sales Item Reports")}
        description={t("report.sales_items_desc", "Detailed breakdown of each sold item by transaction")}
      />

      {/* KPI Summary Cards */}
      <KpiGrid>
        <KpiCard
          featured
          icon={DollarSign}
          title={t("report.total_sales", "Total Sales")}
          value={formatCurrency(summary.totalSalesAmount)}
          caption={`${Number(summary.totalTransactions).toLocaleString()} ${t("report.transactions", "Transactions")}`}
          splits={[
            { label: t("common.paid", "Paid"), value: summary.totalPaidAmount, color: "#4ade80" },
            { label: t("common.due", "Due"), value: Math.max(0, summary.totalSalesAmount - summary.totalPaidAmount), color: "#fbbf24" },
          ]}
        />
        <KpiCard
          tone="red"
          icon={Tag}
          title={t("sale.total_discount", "Total Discount")}
          subtitle={t("report.total_discount_desc", "Discounts given on sales")}
          value={formatCurrency(summary.totalDiscount)}
          caption={t("report.of_total_sales", "of total sales")}
          percent={pct(summary.totalDiscount, summary.totalSalesAmount)}
        />
        <KpiCard
          tone="green"
          icon={CreditCard}
          title={t("sale.paid_amount", "Paid Amount")}
          subtitle={t("report.paid_amount_desc", "Collected from customers")}
          value={formatCurrency(summary.totalPaidAmount)}
          caption={t("report.of_total_sales", "of total sales")}
          percent={pct(summary.totalPaidAmount, summary.totalSalesAmount)}
        />
        <KpiCard
          tone="amber"
          icon={Activity}
          title={t("report.transactions", "Transactions")}
          subtitle={t("report.transactions_desc", "Sales in this period")}
          value={Number(summary.totalTransactions).toLocaleString()}
        />
      </KpiGrid>

      <div className="rounded-2xl border border-border bg-card shadow-card overflow-hidden">
        <div className="border-b border-border/60 p-4">
          <PageFilter
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder={t("report.search_sale_item_placeholder", "Search sale items, product, barcode...")}
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
              setProductId("all");
              setSaleStatus("all");
              setPaymentStatus("all");
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

export default SalesItemReportPage;
