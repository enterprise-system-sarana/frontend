import { DateRangePicker } from "@/components/ui/date-picker";
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
import { useSupplier } from "@/hooks/purchases/useSupplier";
import { useProduct } from "@/hooks/product/useProduct";
import { PageFilter } from "@/utils/PageFilter";
import { useSearch } from "@/utils/useSearch";
import {
  PurchaseItemReportColumns,
  type PurchaseItemRow,
} from "./PurchaseItemReportColumn";
import { PurchaseDetailModal } from "@/pages/purchases/purchase/PurchaseDetail";
import { ROUTERS } from "@/constants/Route";
import { useLanguage } from "@/i18n/LanguageContext";
import { KpiCard, KpiGrid } from "@/components/ui/kpi-card";
import {
  Package,
  DollarSign,
  Boxes,
  RotateCcw,
  ShoppingBag,
  ArrowLeft,
} from "lucide-react";

const formatCurrency = (value: number | string | undefined) => {
  const numeric = Number(value ?? 0);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(numeric);
};

export default function PurchaseItemReportPage() {
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
  const [supplierId, setSupplierId] = useState<string>("all");
  const [productId, setProductId] = useState<string>("all");
  const [status, setStatus] = useState<string>("all");
  const [paymentStatus, setPaymentStatus] = useState<string>("all");

  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedPurchaseId, setSelectedPurchaseId] = useState<number | null>(null);

  const { data: storeData } = useStore.useGetAllStore({ page: 1, size: 1000 });
  const { data: supplierData } = useSupplier.useGetAllSupplier({ page: 1, size: 1000 });
  const { data: productData } = useProduct.useGetAllProduct({ page: 1, size: 1000 });

  const stores = storeData?.payload?.data ?? storeData?.data ?? [];
  const suppliers = supplierData?.payload?.data ?? supplierData?.data ?? [];
  const products = productData?.payload?.data ?? productData?.data ?? [];

  const filter = useMemo(
    () => ({
      page,
      size,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      storeId: storeId !== "all" ? Number(storeId) : undefined,
      supplierId: supplierId !== "all" ? Number(supplierId) : undefined,
      productId: productId !== "all" ? Number(productId) : undefined,
      status: status !== "all" ? status : undefined,
      paymentStatus: paymentStatus !== "all" ? paymentStatus : undefined,
    }),
    [page, size, startDate, endDate, storeId, supplierId, productId, status, paymentStatus],
  );

  const { data: itemsData, isLoading, isError, refetch } = useReport.usePurchaseItemsReport(filter, {
    page,
    size,
  });

  const { data: summaryData } = useReport.usePurchaseReport(filter);

  const rawItems = useMemo(() => {
    const payload = itemsData?.payload ?? itemsData ?? {};
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.data)) return payload.data;
    if (Array.isArray(payload?.content)) return payload.content;
    if (Array.isArray(payload?.items)) return payload.items;
    return [];
  }, [itemsData]);

  const summary = summaryData?.payload ?? summaryData ?? {};
  const totalAmount = Number(summary.totalAmount ?? 0);
  const totalQuantity = Number(summary.totalQuantity ?? 0);

  const filterGroups = useMemo(
    () => [
      {
        key: "storeId",
        label: t("inventory.store", "Store"),
        options: stores.map((s: any) => ({ label: s.name, value: String(s.id) })),
      },
      {
        key: "supplierId",
        label: t("purchase.supplier", "Supplier"),
        options: suppliers.map((s: any) => ({
          label: s.name || s.companyName,
          value: String(s.id),
        })),
      },
      {
        key: "productId",
        label: t("product.title", "Product"),
        options: products.map((p: any) => ({ label: p.name, value: String(p.id) })),
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
    [stores, suppliers, products, t],
  );

  const handleFilterChange = (key: string, value: string) => {
    setFilterValues((prev) => ({ ...prev, [key]: value }));
    setPage(1);
    if (key === "storeId") setStoreId(value);
    if (key === "supplierId") setSupplierId(value);
    if (key === "productId") setProductId(value);
    if (key === "status") setStatus(value);
    if (key === "paymentStatus") setPaymentStatus(value);
  };

  const handleResetFilters = () => {
    setFilterValues({});
    setSearch("");
    setStoreId("all");
    setSupplierId("all");
    setProductId("all");
    setStatus("all");
    setPaymentStatus("all");
    setStartDate("");
    setEndDate("");
    setPage(1);
  };

  const searchedRows = useSearch(rawItems, search, [
    "referenceNo",
    "productName",
    "productCode",
    "supplierName",
    "storeName",
    "purchaseStatus",
    "paymentStatus",
  ]);

  const columns = useMemo(
    () =>
      PurchaseItemReportColumns({
        t,
        onViewPurchase: (id: number) => {
          setSelectedPurchaseId(id);
          setDetailModalOpen(true);
        },
      }),
    [t],
  );

  if (!canRead) {
    return <AccessDenied message={t("report.access_denied", "You do not have permission to view purchase item reports.")} />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("report.purchase_items_title", "Purchase Item Reports")}
        description={t(
          "report.purchase_items_desc",
          "Line-item breakdown of all purchased goods, costs, product SKUs, and incoming delivery status."
        )}
      >
        <div className="flex items-center gap-2">
          <Link
            to={ROUTERS.REPORT_PURCHASES}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-border/80 bg-background hover:bg-muted transition-colors shadow-xs"
          >
            <ArrowLeft className="size-3.5 text-muted-foreground" />
            <span>{t("report.back_to_purchases", "Back to Purchase Summary")}</span>
          </Link>
        </div>
      </PageHeader>

      {/* Item Summary Metric Strip */}
      <KpiGrid>
        <KpiCard
          featured
          icon={DollarSign}
          title={t("purchase.total_procurement", "Total Procurement Cost")}
          value={formatCurrency(totalAmount)}
          caption={`${searchedRows.length.toLocaleString()} ${t("purchase.line_items", "line items")}`}
        />
        <KpiCard
          tone="green"
          icon={Boxes}
          title={t("purchase.total_units", "Total Units Received")}
          subtitle={t("purchase.total_units_desc", "Quantity across all items")}
          value={totalQuantity.toLocaleString()}
        />
        <KpiCard
          tone="cyan"
          icon={Package}
          title={t("purchase.recorded_lines", "Recorded Line Items")}
          subtitle={t("purchase.recorded_lines_desc", "Purchase lines in this view")}
          value={searchedRows.length.toLocaleString()}
        />
      </KpiGrid>

      {/* Date Filter & Search */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-muted-foreground font-semibold">Date Range:</span>
            <DateRangePicker
              startDate={startDate}
              endDate={endDate}
              onChange={(start, end) => {
                setStartDate(start);
                setEndDate(end);
              }}
            />
          </div>

          {(storeId !== "all" || supplierId !== "all" || productId !== "all" || status !== "all" || paymentStatus !== "all" || search || startDate || endDate) && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors border border-border/60"
            >
              <RotateCcw className="size-3" />
              <span>Reset Filters</span>
            </button>
          )}
        </div>

        <PageFilter
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder={t("report.search_item_placeholder", "Search product, SKU, reference, supplier...")}
          filterGroups={filterGroups}
          filterValues={filterValues}
          onFilterChange={handleFilterChange}
          onResetFilter={handleResetFilters}
        />
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-border bg-card shadow-card overflow-hidden">
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
          onExportCsv={() => exportTableToCsv(columns, searchedRows, "purchase_items_report")}
          onExportPdf={() => exportTableToPdf(columns, searchedRows, "purchase_items_report", "Purchase Items Report")}
          onPrint={() => printTable(columns, searchedRows, "Purchase Items Report")}
        />
      </div>

      <PurchaseDetailModal
        purchaseId={selectedPurchaseId}
        open={detailModalOpen}
        onOpenChange={setDetailModalOpen}
      />
    </div>
  );
}
