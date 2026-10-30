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
import { useCategory } from "@/hooks/product/useCategory";
import { PageFilter } from "@/utils/PageFilter";
import { useLanguage } from "@/i18n/LanguageContext";
import { KpiCard, KpiGrid } from "@/components/ui/kpi-card";
import { StockItemReportColumns, StockMovementColumns } from "./StockReportColumn";
import type { StockItemReportResponse, StockMovementItemResponse } from "@/types/reports/StockReport";
import {
  AlertTriangle,
  ArrowUpDown,
  Boxes,
  DollarSign,
  TrendingUp,
} from "lucide-react";

const formatCurrency = (value: number | string | undefined) => {
  const numeric = Number(value ?? 0);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(numeric);
};

const StockReportPage = () => {
  const { t } = useLanguage();
  const { Can } = usePermission();
  const canRead = Can(PERMISSION.REPORT.READ);

  const [activeTab, setActiveTab] = useState<"items" | "movements">("items");
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(10);
  const [search, setSearch] = useState("");
  const [storeId, setStoreId] = useState<string>("all");
  const [categoryId, setCategoryId] = useState<string>("all");
  const [stockStatus, setStockStatus] = useState<string>("all");
  const [transactionType, setTransactionType] = useState<string>("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});

  // Dropdown reference queries
  const { data: storeData } = useStore.useGetAllStore({ page: 1, size: 1000 });
  const { data: categoryData } = useCategory.useGetAllCategory({ page: 1, size: 1000 });

  const stores = storeData?.payload?.data ?? [];
  const categories = categoryData?.payload?.data ?? [];

  // Filter payload for Stock Items
  const stockItemsFilter = useMemo(
    () => ({
      page,
      size,
      search: search.trim() || undefined,
      storeId: storeId !== "all" ? Number(storeId) : undefined,
      categoryId: categoryId !== "all" ? Number(categoryId) : undefined,
      stockStatus: stockStatus !== "all" ? stockStatus : undefined,
    }),
    [page, size, search, storeId, categoryId, stockStatus]
  );

  // Filter payload for Movements
  const movementFilter = useMemo(
    () => ({
      page,
      size,
      search: search.trim() || undefined,
      storeId: storeId !== "all" ? Number(storeId) : undefined,
      transactionType: transactionType !== "all" ? transactionType : undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
    }),
    [page, size, search, storeId, transactionType, startDate, endDate]
  );

  // Queries
  const { data: itemsData, isLoading: isLoadingItems } = useReport.useStockItemsReport(
    stockItemsFilter,
    { page, size }
  );

  const { data: summaryData } = useReport.useStockSummary(stockItemsFilter);

  const { data: movementsData, isLoading: isLoadingMovements } = useReport.useStockMovements(
    movementFilter,
    { page, size }
  );

  // Extract items list
  const stockRows: StockItemReportResponse[] = useMemo(() => {
    if (!itemsData) return [];
    const payload = itemsData.payload ?? itemsData;
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.content)) return payload.content;
    if (Array.isArray(payload?.data)) return payload.data;
    if (Array.isArray(payload?.items)) return payload.items;
    return [];
  }, [itemsData]);

  const totalStockElements = useMemo(() => {
    const payload = itemsData?.payload ?? itemsData;
    if (typeof payload?.totalElements === "number") return payload.totalElements;
    return stockRows.length;
  }, [itemsData, stockRows]);

  // Extract movement list
  const movementRows: StockMovementItemResponse[] = useMemo(() => {
    if (!movementsData) return [];
    const payload = movementsData.payload ?? movementsData;
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.content)) return payload.content;
    if (Array.isArray(payload?.data)) return payload.data;
    if (Array.isArray(payload?.items)) return payload.items;
    return [];
  }, [movementsData]);

  const totalMovementElements = useMemo(() => {
    const payload = movementsData?.payload ?? movementsData;
    if (typeof payload?.totalElements === "number") return payload.totalElements;
    return movementRows.length;
  }, [movementsData, movementRows]);

  // Computed summary metrics with fallback
  const kpiSummary = useMemo(() => {
    const backendSummary = summaryData?.payload ?? summaryData;

    if (backendSummary && typeof backendSummary === "object") {
      return {
        totalProducts: backendSummary.totalProducts ?? stockRows.length,
        totalQuantity: Number(backendSummary.totalQuantity ?? 0),
        totalCostValue: Number(backendSummary.totalCostValue ?? 0),
        totalSaleValue: Number(backendSummary.totalSaleValue ?? 0),
        potentialProfit: Number(backendSummary.potentialProfit ?? (Number(backendSummary.totalSaleValue ?? 0) - Number(backendSummary.totalCostValue ?? 0))),
        lowStockCount: Number(backendSummary.lowStockCount ?? 0),
        outOfStockCount: Number(backendSummary.outOfStockCount ?? 0),
        inStockCount: Number(backendSummary.inStockCount ?? 0),
      };
    }

    // Client-side fallback calculation from rows
    let totalQty = 0;
    let costVal = 0;
    let saleVal = 0;
    let lowCount = 0;
    let outCount = 0;
    let inCount = 0;

    for (const item of stockRows) {
      const q = Number(item.currentQuantity ?? 0);
      const c = Number(item.costPrice ?? 0);
      const s = Number(item.salePrice ?? 0);
      const reorder = item.reorderLevel ?? item.alertQuantity ?? 5;

      totalQty += q;
      costVal += item.totalCostValue ? Number(item.totalCostValue) : q * c;
      saleVal += item.totalSaleValue ? Number(item.totalSaleValue) : q * s;

      if (q <= 0) outCount++;
      else if (q <= reorder) lowCount++;
      else inCount++;
    }

    return {
      totalProducts: stockRows.length,
      totalQuantity: totalQty,
      totalCostValue: costVal,
      totalSaleValue: saleVal,
      potentialProfit: saleVal - costVal,
      lowStockCount: lowCount,
      outOfStockCount: outCount,
      inStockCount: inCount,
    };
  }, [summaryData, stockRows]);

  // Filter groups for PageFilter
  const filterGroups = useMemo(() => {
    const commonGroups = [
      {
        key: "storeId",
        label: t("store.name", "Store"),
        options: stores.map((s: any) => ({ label: s.name, value: String(s.id) })),
      },
    ];

    if (activeTab === "items") {
      return [
        ...commonGroups,
        {
          key: "categoryId",
          label: t("category.name", "Category"),
          options: categories.map((c: any) => ({ label: c.name, value: String(c.id) })),
        },
        {
          key: "stockStatus",
          label: t("common.status", "Stock Status"),
          options: [
            { label: t("inventory.in_stock", "In Stock"), value: "IN_STOCK" },
            { label: t("inventory.low_stock", "Low Stock"), value: "LOW_STOCK" },
            { label: t("inventory.out_of_stock", "Out of Stock"), value: "OUT_OF_STOCK" },
          ],
        },
      ];
    }

    return [
      ...commonGroups,
      {
        key: "transactionType",
        label: t("inventory.transaction_type", "Type"),
        options: [
          { label: "Purchase (IN)", value: "PURCHASE" },
          { label: "Sale (OUT)", value: "SALE" },
          { label: "Adjustment", value: "ADJUSTMENT" },
          { label: "Return", value: "RETURN" },
        ],
      },
    ];
  }, [stores, categories, activeTab, t]);

  const handleFilterChange = (key: string, value: string) => {
    setFilterValues((prev) => ({ ...prev, [key]: value }));
    setPage(1);

    if (key === "storeId") setStoreId(value);
    if (key === "categoryId") setCategoryId(value);
    if (key === "stockStatus") setStockStatus(value);
    if (key === "transactionType") setTransactionType(value);
  };

  const handleResetFilters = () => {
    setSearch("");
    setStoreId("all");
    setCategoryId("all");
    setStockStatus("all");
    setTransactionType("all");
    setStartDate("");
    setEndDate("");
    setFilterValues({});
    setPage(1);
  };

  // Export handlers
  const itemColumns = useMemo(() => StockItemReportColumns({ t }), [t]);
  const movementColumns = useMemo(() => StockMovementColumns({ t }), [t]);

  const handleExportCsv = () => {
    if (activeTab === "items") {
      exportTableToCsv(
        stockRows.map((r) => ({
          Product: r.productName || "-",
          Code: r.productCode || "-",
          Store: r.storeName || "-",
          Category: r.categoryName || "-",
          Quantity: r.currentQuantity ?? 0,
          ReorderLevel: r.reorderLevel ?? 5,
          CostPrice: r.costPrice ?? 0,
          SalePrice: r.salePrice ?? 0,
          TotalCostValue: r.totalCostValue ?? 0,
          TotalSaleValue: r.totalSaleValue ?? 0,
          Profit: r.potentialProfit ?? 0,
          Status: r.stockStatus || "-",
        })),
        "stock-report"
      );
    } else {
      exportTableToCsv(
        movementRows.map((m) => ({
          TxID: m.transactionId || "-",
          Date: m.transactionDate || m.createdAt || "-",
          Product: m.productName || "-",
          Code: m.productCode || "-",
          Store: m.storeName || "-",
          Type: m.transactionType || "-",
          Quantity: m.quantity ?? 0,
          Reference: m.referenceId || "-",
          Notes: m.notes || "-",
          CreatedBy: m.createdBy || "-",
        })),
        "stock-movements-report"
      );
    }
  };

  const handleExportPdf = () => {
    if (activeTab === "items") {
      exportTableToPdf(
        [
          t("product.name", "Product"),
          t("product.code", "Code"),
          t("store.name", "Store"),
          t("inventory.current_quantity", "Qty"),
          t("product.cost_price", "Cost"),
          t("product.sale_price", "Sale"),
          t("inventory.valuation", "Total Valuation"),
          t("common.status", "Status"),
        ],
        stockRows.map((r) => [
          r.productName || "-",
          r.productCode || "-",
          r.storeName || "-",
          String(r.currentQuantity ?? 0),
          formatCurrency(r.costPrice),
          formatCurrency(r.salePrice),
          formatCurrency(r.totalCostValue),
          r.stockStatus || "-",
        ]),
        t("report.stock", "Stock Inventory Report")
      );
    } else {
      exportTableToPdf(
        ["Tx ID", "Date", "Product", "Store", "Type", "Qty", "Ref", "Created By"],
        movementRows.map((m) => [
          String(m.transactionId || "-"),
          m.transactionDate ? String(m.transactionDate).slice(0, 10) : "-",
          m.productName || "-",
          m.storeName || "-",
          m.transactionType || "-",
          String(m.quantity ?? 0),
          String(m.referenceId || "-"),
          m.createdBy || "-",
        ]),
        t("report.stock_movements", "Stock Movement Audit Report")
      );
    }
  };

  const handlePrint = () => {
    if (activeTab === "items") {
      printTable(
        [
          t("product.name", "Product"),
          t("product.code", "Code"),
          t("store.name", "Store"),
          t("inventory.current_quantity", "Qty"),
          t("product.cost_price", "Cost"),
          t("product.sale_price", "Sale"),
          t("inventory.valuation", "Total Valuation"),
          t("common.status", "Status"),
        ],
        stockRows.map((r) => [
          r.productName || "-",
          r.productCode || "-",
          r.storeName || "-",
          String(r.currentQuantity ?? 0),
          formatCurrency(r.costPrice),
          formatCurrency(r.salePrice),
          formatCurrency(r.totalCostValue),
          r.stockStatus || "-",
        ]),
        t("report.stock", "Stock Inventory Report")
      );
    } else {
      printTable(
        ["Tx ID", "Date", "Product", "Store", "Type", "Qty", "Ref", "Created By"],
        movementRows.map((m) => [
          String(m.transactionId || "-"),
          m.transactionDate ? String(m.transactionDate).slice(0, 10) : "-",
          m.productName || "-",
          m.storeName || "-",
          m.transactionType || "-",
          String(m.quantity ?? 0),
          String(m.referenceId || "-"),
          m.createdBy || "-",
        ]),
        t("report.stock_movements", "Stock Movement Audit Report")
      );
    }
  };

  if (!canRead) {
    return <AccessDenied resource="stock reports" showBackButton />;
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title={t("report.stock_report", "Stock & Inventory Report")}
        description={t(
          "report.stock_report_desc",
          "Comprehensive inventory valuation, stock level tracking, and movement audit"
        )}
      />

      {/* KPI Summary Cards */}
      <KpiGrid>
        {/* Card 1: Total Stock Quantity */}
        <KpiCard
          featured
          icon={Boxes}
          title={t("report.total_stock_qty", "Total Stock Units")}
          value={kpiSummary.totalQuantity.toLocaleString()}
          caption={`${t("report.across", "across")} ${kpiSummary.totalProducts} ${t("pos.items", "items")}`}
          splits={[
            { label: t("pos.in_stock", "In Stock"), value: kpiSummary.inStockCount, color: "#4ade80" },
            { label: t("pos.low_stock", "Low Stock"), value: kpiSummary.lowStockCount, color: "#fbbf24" },
            { label: t("pos.out_of_stock", "Out of Stock"), value: kpiSummary.outOfStockCount, color: "#fb7185" },
          ]}
        />

        {/* Card 2: Total Cost Valuation */}
        <KpiCard
          tone="blue"
          icon={DollarSign}
          title={t("report.cost_valuation", "Total Cost Valuation")}
          subtitle={t("report.cost_valuation_desc", "Total invested capital in stock")}
          value={formatCurrency(kpiSummary.totalCostValue)}
        />

        {/* Card 3: Total Retail & Potential Profit */}
        <KpiCard
          tone="green"
          icon={TrendingUp}
          title={t("report.retail_valuation", "Potential Retail Value")}
          subtitle={t("report.retail_valuation_desc", "Stock valued at sale price")}
          value={formatCurrency(kpiSummary.totalSaleValue)}
          caption={`+${formatCurrency(kpiSummary.potentialProfit)} ${t("report.profit_margin", "profit margin")}`}
          percent={
            kpiSummary.totalSaleValue > 0
              ? Math.max(0, (kpiSummary.potentialProfit / kpiSummary.totalSaleValue) * 100)
              : 0
          }
        />

        {/* Card 4: Inventory Alerts */}
        <KpiCard
          tone="amber"
          icon={AlertTriangle}
          title={t("report.inventory_alerts", "Stock Alerts")}
          subtitle={t("report.inventory_alerts_desc", "Items needing purchase or reorder")}
          value={(kpiSummary.lowStockCount + kpiSummary.outOfStockCount).toLocaleString()}
          caption={`${kpiSummary.lowStockCount} ${t("report.low_stock_lower", "low stock")} · ${kpiSummary.outOfStockCount} ${t("report.out_lower", "out")}`}
          percent={
            Number(kpiSummary.totalProducts) > 0
              ? ((kpiSummary.lowStockCount + kpiSummary.outOfStockCount) / Number(kpiSummary.totalProducts)) * 100
              : 0
          }
        />
      </KpiGrid>

      {/* Main Content Area */}
      <div className="rounded-2xl border border-border bg-card shadow-card overflow-hidden">
        {/* Tab Switcher Header */}
        <div className="border-b border-border/70 bg-muted/20 px-4 pt-3 pb-0 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setActiveTab("items");
                setPage(1);
              }}
              className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-semibold rounded-t-lg border-b-2 transition-all cursor-pointer ${
                activeTab === "items"
                  ? "border-primary bg-background text-primary shadow-xs"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/40"
              }`}
            >
              <Boxes className="size-4" />
              <span>{t("report.stock_items", "Stock Levels & Valuation")}</span>
              <span className="ml-1 rounded-full bg-muted px-1.5 py-0.2 text-[11px] tabular-nums">
                {totalStockElements}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab("movements");
                setPage(1);
              }}
              className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-semibold rounded-t-lg border-b-2 transition-all cursor-pointer ${
                activeTab === "movements"
                  ? "border-primary bg-background text-primary shadow-xs"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/40"
              }`}
            >
              <ArrowUpDown className="size-4" />
              <span>{t("report.stock_movements", "Stock Movements & Audit")}</span>
              <span className="ml-1 rounded-full bg-muted px-1.5 py-0.2 text-[11px] tabular-nums">
                {totalMovementElements}
              </span>
            </button>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="border-b border-border/60 p-4">
          <PageFilter
            search={search}
            onSearchChange={(val) => {
              setSearch(val);
              setPage(1);
            }}
            searchPlaceholder={
              activeTab === "items"
                ? t("report.search_stock_placeholder", "Search product name, code, store...")
                : t("report.search_movement_placeholder", "Search movements, notes, products...")
            }
            startDate={activeTab === "movements" ? startDate : undefined}
            endDate={activeTab === "movements" ? endDate : undefined}
            onStartDateChange={(val) => {
              setStartDate(val);
              setPage(1);
            }}
            onEndDateChange={(val) => {
              setEndDate(val);
              setPage(1);
            }}
            filterGroups={filterGroups}
            filterValues={filterValues}
            onFilterChange={handleFilterChange}
            onPrintPdf={handlePrint}
            onDownloadPdf={handleExportPdf}
            onDownloadCsv={handleExportCsv}
            onReset={handleResetFilters}
          />
        </div>

        {/* Data Table */}
        {activeTab === "items" ? (
          <DataTable
            columns={itemColumns}
            data={stockRows}
            loading={isLoadingItems}
            pagination={{
              currentPage: page,
              pageSize: size,
              totalElements: totalStockElements,
              totalPages: Math.max(1, Math.ceil(totalStockElements / size)),
              onPageChange: setPage,
              onPageSizeChange: (nextSize) => {
                setPage(1);
                setSize(nextSize);
              },
            }}
          />
        ) : (
          <DataTable
            columns={movementColumns}
            data={movementRows}
            loading={isLoadingMovements}
            pagination={{
              currentPage: page,
              pageSize: size,
              totalElements: totalMovementElements,
              totalPages: Math.max(1, Math.ceil(totalMovementElements / size)),
              onPageChange: setPage,
              onPageSizeChange: (nextSize) => {
                setPage(1);
                setSize(nextSize);
              },
            }}
          />
        )}
      </div>
    </div>
  );
};

export default StockReportPage;
