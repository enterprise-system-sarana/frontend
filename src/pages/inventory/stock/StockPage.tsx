import { useMemo, useState } from "react";
import type { VisibilityState } from "@tanstack/react-table";
import {
    DataTable,
    exportTableToCsv,
    exportTableToPdf,
    printTable,
    getColumnsForVisibility,
} from "@/components/ui/data-table";
import { QueryBoundary } from "@/components/ui/query-boundary";
import type { StockResponse } from "@/types/inventory/Stock";
import type { StoreResponse } from "@/types/inventory/Store";
import type { CategoryResponse } from "@/types/product/Category";
import type { BrandResponse } from "@/types/product/Brand";
import type { ModelResponse } from "@/types/product/Model";
import type { ProductResponse } from "@/types/product/Product";
import { useSearch } from "@/utils/useSearch";
import { PageFilter, type FilterGroup } from "@/utils/PageFilter";
import { useStock } from "@/hooks/inventory/useStock";
import { useStore } from "@/hooks/inventory/useStore";
import { useCategory } from "@/hooks/product/useCategory";
import { useBrand } from "@/hooks/product/useBrand";
import { useModel } from "@/hooks/product/useModel";
import { useProduct } from "@/hooks/product/useProduct";
import { StockColumns } from "./StockColumn";
import { usePermission } from "@/utils/UsePermission";
import { PERMISSION } from "@/constants/Permission";
import { AccessDenied } from "@/components/ui/access-denied";
import { PageHeader } from "@/components/ui/page-header";
import { useLanguage } from "@/i18n/LanguageContext";

export const StockPage = () => {
    const { t } = useLanguage();
    const { Can } = usePermission();
    const canRead = Can(PERMISSION.STOCK.READ);
    // const canUpdate = Can(PERMISSION.STOCK.UPDATE);

    const [page, setPage] = useState(1);
    const [size, setSize] = useState(10);
    const [search, setSearch] = useState("");
    const [filterValues, setFilterValues] = useState<Record<string, string>>({});
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
        categoryName: false,
        brandName: false,
        modelName: false,
    });

    const storeId =
        filterValues.storeId && filterValues.storeId !== "all" && Number(filterValues.storeId) > 0
            ? Number(filterValues.storeId)
            : undefined;
    const categoryId =
        filterValues.categoryId && filterValues.categoryId !== "all" && Number(filterValues.categoryId) > 0
            ? Number(filterValues.categoryId)
            : undefined;
    const brandId =
        filterValues.brandId && filterValues.brandId !== "all" && Number(filterValues.brandId) > 0
            ? Number(filterValues.brandId)
            : undefined;
    const modelId =
        filterValues.modelId && filterValues.modelId !== "all" && Number(filterValues.modelId) > 0
            ? Number(filterValues.modelId)
            : undefined;
    const productId =
        filterValues.productId && filterValues.productId !== "all" && Number(filterValues.productId) > 0
            ? Number(filterValues.productId)
            : undefined;
    const stockStatus =
        filterValues.stockStatus && filterValues.stockStatus !== "all"
            ? filterValues.stockStatus
            : undefined;

    // Fetch stocks with store, product, model, brand, category, status, and search filters
    const { data, isError, isLoading } = useStock.useGetAllStock({
        page,
        size,
        storeId,
        productId,
        modelId,
        brandId,
        categoryId,
        status: stockStatus,
        search: search.trim() || undefined,
    });

    // Fetch stores list for store filter options
    const { data: storeData } = useStore.useGetAllStore({ page: 1, size: 100 });
    const storeList = storeData?.payload?.data;
    const storeOptions = useMemo(() => {
        if (!storeList) return [];
        return storeList.map((s: StoreResponse) => ({
            label: s.name,
            value: String(s.id),
        }));
    }, [storeList]);

    // Fetch categories list for category filter options
    const { data: categoryData } = useCategory.useGetAllCategory({ page: 1, size: 100 });
    const categoryList = categoryData?.payload?.data;
    const categoryOptions = useMemo(() => {
        if (!categoryList) return [];
        return categoryList.map((c: CategoryResponse) => ({
            label: c.name,
            value: String(c.id),
        }));
    }, [categoryList]);

    // Fetch brands list for brand filter options
    const { data: brandData } = useBrand.useGetAllBrand({ page: 1, size: 100 });
    const brandList = brandData?.payload?.data;
    const brandOptions = useMemo(() => {
        if (!brandList) return [];
        return brandList.map((b: BrandResponse) => ({
            label: b.name,
            value: String(b.id),
        }));
    }, [brandList]);

    // Fetch models list (filtered by selected category & brand)
    const { data: modelData } = useModel.GetAllModel({
        page: 1,
        size: 100,
        categoryId,
        brandId,
    });
    const modelList = modelData?.payload?.data;
    const modelOptions = useMemo(() => {
        if (!modelList) return [];
        return modelList.map((m: ModelResponse) => ({
            label: m.name,
            value: String(m.id),
        }));
    }, [modelList]);

    // Fetch products list (filtered by selected category, brand, and model)
    const { data: productData } = useProduct.useGetAllProduct({
        page: 1,
        size: 200,
        categoryId,
        brandId,
        modelId,
    });
    const productList = productData?.payload?.data;
    const productOptions = useMemo(() => {
        if (!productList) return [];
        return productList.map((p: ProductResponse) => ({
            label: p.name || p.modelName || p.code,
            value: String(p.id),
        }));
    }, [productList]);

    // Filter Groups for Filter + Toolbar
    const filterGroups: FilterGroup[] = useMemo(
        () => [
            {
                key: "storeId",
                label: t("inventory.store"),
                options: storeOptions,
            },
            {
                key: "categoryId",
                label: t("product.category"),
                options: categoryOptions,
            },
            {
                key: "brandId",
                label: t("product.brand"),
                options: brandOptions,
            },
            {
                key: "modelId",
                label: t("product.model"),
                options: modelOptions,
            },
            {
                key: "productId",
                label: t("nav.product"),
                options: productOptions,
            },
            {
                key: "stockStatus",
                label: t("common.status"),
                options: [
                    { label: t("pos.low_stock"), value: "LOW" },
                    { label: t("pos.in_stock"), value: "IN_STOCK" },
                    { label: t("pos.out_of_stock"), value: "OUT_OF_STOCK" },
                ],
            },
        ],
        [storeOptions, categoryOptions, brandOptions, modelOptions, productOptions, t]
    );

    const handleColumnToggle = (columnId: string) => {
        setColumnVisibility((prev) => ({
            ...prev,
            [columnId]: prev[columnId] === false ? true : false,
        }));
    };

    const handleFilterChange = (key: string, value: string) => {
        setPage(1);
        setFilterValues((prev) => {
            const next = { ...prev };
            if (!value || value === "all") {
                delete next[key];
            } else {
                next[key] = value;
            }

            // Cascading resets
            if (key === "categoryId" || key === "brandId") {
                delete next["modelId"];
                delete next["productId"];
            } else if (key === "modelId") {
                delete next["productId"];
            }

            return next;
        });
    };

    const handleReset = () => {
        setSearch("");
        setFilterValues({});
        setPage(1);
    };

    const stockList = data?.payload?.data;

    const searchedStocks = useSearch<StockResponse>(
        stockList,
        search,
        ["productName", "storeName", "modelName", "brandName", "categoryName"]
    );

    const filteredStocks = useMemo(() => {
        return searchedStocks.filter((item) => {
            if (storeId && item.storeId !== storeId) {
                return false;
            }
            if (productId && item.productId !== productId) {
                return false;
            }
            if (modelId && item.modelId && item.modelId !== modelId) {
                return false;
            }
            if (brandId && item.brandId && item.brandId !== brandId) {
                return false;
            }
            if (categoryId && item.categoryId && item.categoryId !== categoryId) {
                return false;
            }
            if (filterValues.stockStatus) {
                const qty = item.quantity ?? 0;
                const alertQty = item.alertQuantity ?? 0;

                if (filterValues.stockStatus === "OUT_OF_STOCK" && qty !== 0) {
                    return false;
                }
                if (filterValues.stockStatus === "LOW" && (qty === 0 || qty > alertQty)) {
                    return false;
                }
                if (filterValues.stockStatus === "IN_STOCK" && qty <= alertQty) {
                    return false;
                }
            }
            return true;
        });
    }, [searchedStocks, filterValues, storeId, productId, modelId, brandId, categoryId]);

    const columns = useMemo(() => StockColumns({ t }), [t]);

    const handleExportCsv = () => {
        exportTableToCsv(filteredStocks, columns, "stocks");
    };

    const handleDownloadPdf = () => {
        exportTableToPdf(filteredStocks, columns, "stocks", "Stock Inventory List");
    };

    const handlePrintPdf = () => {
        printTable("Stock Inventory List");
    };

    if (!canRead) {
        return <AccessDenied resource="stocks" showBackButton />;
    }

    return (
        <div className="space-y-4">
            {/* Top Header */}
            <PageHeader
                title={t("inventory.stock")}
            />

            {/* Main Card with Toolbar & Table */}
            <div className="rounded-2xl border border-border bg-card shadow-card overflow-hidden">
                {/* Toolbar row with Search, Filter+, Columns, Print, CSV */}
                <div className="px-5 py-4 border-b border-border">
                    <PageFilter
                        search={search}
                        onSearchChange={setSearch}
                        searchPlaceholder={t("common.search")}
                        filterGroups={filterGroups}
                        filterValues={filterValues}
                        onFilterChange={handleFilterChange}
                        columns={getColumnsForVisibility(columns, columnVisibility)}
                        onColumnToggle={handleColumnToggle}
                        onPrintPdf={handlePrintPdf}
                        onDownloadPdf={handleDownloadPdf}
                        onDownloadCsv={handleExportCsv}
                        onReset={handleReset}
                    />
                </div>

                {/* Table View */}
                <div className="px-0">
                    <QueryBoundary isLoading={isLoading} isError={isError}>
                        <DataTable
                            columns={columns}
                            data={filteredStocks}
                            columnVisibility={columnVisibility}
                            onColumnVisibilityChange={setColumnVisibility}
                            pagination={{
                                currentPage: page,
                                pageSize: size,
                                totalElements:
                                    data?.payload?.pagination?.totalElements || filteredStocks.length,
                                totalPages: data?.payload?.pagination?.totalPages || 1,
                                onPageChange: setPage,
                                onPageSizeChange: setSize,
                            }}
                        />
                    </QueryBoundary>
                </div>
            </div>
        </div>
    );
};

export default StockPage;
