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
import { PageFilter } from "@/utils/PageFilter";
import { useSearch } from "@/utils/useSearch";
import { useLanguage } from "@/i18n/LanguageContext";
import { KpiCard, KpiGrid } from "@/components/ui/kpi-card";
import { Boxes, CheckCircle2, DollarSign, ListChecks } from "lucide-react";
import { ProductSerialReportColumns } from "./ProductSerialReportColumn";

const formatCurrency = (value: number | string | undefined) => {
  const numeric = Number(value ?? 0);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(numeric);
};

const ProductSerialReportPage = () => {
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
  const [status, setStatus] = useState<string>("all");
  const [barcode, setBarcode] = useState("");

  const { data: storeData } = useStore.useGetAllStore({ page: 1, size: 1000 });
  const { data: productData } = useProduct.useGetAllProduct({ page: 1, size: 1000 });

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
      status: status !== "all" ? status : undefined,
      barcode: barcode.trim() || undefined,
    }),
    [page, size, startDate, endDate, storeId, productId, status, barcode],
  );

  const { data: serialData } = useReport.useProductSerialReport(filter, { page, size });

  const rows = useMemo(() => {
    if (!serialData) return [];
    const payload = serialData.payload ?? serialData;
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.content)) return payload.content;
    if (Array.isArray(payload?.data)) return payload.data;
    if (Array.isArray(payload?.items)) return payload.items;
    return [];
  }, [serialData]);

  const filterGroups = useMemo(
    () => [
      {
        key: "storeId",
        label: t("store.name", "Store"),
        options: stores.map((store: any) => ({ label: store.name, value: String(store.id) })),
      },
      {
        key: "productId",
        label: t("product.name", "Product"),
        options: products.map((product: any) => ({ label: product.name, value: String(product.id) })),
      },
      {
        key: "status",
        label: t("common.status", "Status"),
        options: [
          { label: "AVAILABLE", value: "AVAILABLE" },
          { label: "SOLD", value: "SOLD" },
          { label: "DAMAGED", value: "DAMAGED" },
          { label: "RETURNED", value: "RETURNED" },
        ],
      },
    ],
    [stores, products, t],
  );

  const searchFilteredRows = useSearch(rows, search, [
    "productName",
    "barcode",
    "storeName",
    "status",
  ]);

  const filteredRows = useMemo(() => {
    return searchFilteredRows.filter((row: any) => {
      if (storeId !== "all" && String(row.storeId) !== storeId) return false;
      if (productId !== "all" && String(row.productId) !== productId) return false;
      if (status !== "all" && row.status !== status) return false;
      if (barcode && !String(row.barcode ?? "").toLowerCase().includes(barcode.toLowerCase())) return false;
      return true;
    });
  }, [searchFilteredRows, storeId, productId, status, barcode]);

  const totalElements =
    (serialData as any)?.payload?.totalElements ??
    (serialData as any)?.payload?.pagination?.totalElements ??
    rows.length;

  const columns = useMemo(() => ProductSerialReportColumns({ t }), [t]);

  const handleSearchFilterChange = (key: string, value: string) => {
    setFilterValues((prev) => ({ ...prev, [key]: value }));
    if (key === "storeId") setStoreId(value || "all");
    if (key === "productId") setProductId(value || "all");
    if (key === "status") setStatus(value || "all");
  };

  const handleExportExcel = () => {
    exportTableToCsv(filteredRows, columns, "product-serial-report");
  };

  const handleDownloadPdf = () => {
    exportTableToPdf(filteredRows, columns, "product-serial-report", "Product Serial Report");
  };

  const handlePrint = () => {
    printTable("Product Serial Report");
  };

  const summary = useMemo(() => {
    let totalQty = 0;
    let totalValue = 0;
    let availableCount = 0;
    let totalRecords = rows.length;

    for (const r of rows) {
      const q = Number(r.quantity ?? 1);
      const price = Number(r.price ?? 0);
      totalQty += q;
      totalValue += price * q;
      const st = String(r.status ?? "").toUpperCase();
      if (st === "AVAILABLE") {
        availableCount += q;
      }
    }

    return { totalQty, totalValue, availableCount, totalRecords };
  }, [rows]);

  if (!canRead) {
    return <AccessDenied resource="product serial reports" showBackButton />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("report.product_serials", "Product Serial Reports")}
        description={t("report.product_serials_desc", "Inventory-level product serial and quantity tracking report")}
      />

      {/* Summary KPI Cards */}
      <KpiGrid>
        <KpiCard
          featured
          icon={DollarSign}
          title={t("report.total_inventory_value", "Total Inventory Value")}
          value={formatCurrency(summary.totalValue)}
          caption={`${Number(summary.totalQty).toLocaleString()} ${t("inventory.units", "units")}`}
          splits={[
            { label: t("report.available_items", "Available Items"), value: summary.availableCount, color: "#4ade80" },
            { label: t("report.not_available", "Not Available"), value: Math.max(0, summary.totalQty - summary.availableCount), color: "#fbbf24" },
          ]}
        />
        <KpiCard
          tone="blue"
          icon={Boxes}
          title={t("report.total_quantity", "Total Quantity")}
          subtitle={t("report.total_quantity_desc", "Units across all serials")}
          value={Number(summary.totalQty).toLocaleString()}
        />
        <KpiCard
          tone="green"
          icon={CheckCircle2}
          title={t("report.available_items", "Available Items")}
          subtitle={t("report.available_items_desc", "Ready to sell")}
          value={Number(summary.availableCount).toLocaleString()}
          caption={`${t("payment.of", "of")} ${Number(summary.totalQty).toLocaleString()} ${t("inventory.units", "units")}`}
          percent={summary.totalQty > 0 ? (summary.availableCount / summary.totalQty) * 100 : 0}
        />
        <KpiCard
          tone="purple"
          icon={ListChecks}
          title={t("report.total_records", "Total Records")}
          subtitle={t("report.total_records_desc", "Serial rows in view")}
          value={Number(summary.totalRecords).toLocaleString()}
        />
      </KpiGrid>

      <div className="rounded-2xl border border-border bg-card shadow-card overflow-hidden">
        <div className="border-b border-border/60 p-4">
          <PageFilter
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder={t("report.search_serial_placeholder", "Search serials, barcode, product, store...")}
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
              setStatus("all");
              setBarcode("");
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

export default ProductSerialReportPage;
