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
import { useSearch } from "@/utils/useSearch";
import { PageFilter, type FilterGroup } from "@/utils/PageFilter";
import { useStock } from "@/hooks/inventory/useStock";
import { useStore } from "@/hooks/inventory/useStore";
import { StockColumns } from "./StockColumn";
import { usePermission } from "@/utils/UsePermission";
import { PERMISSION } from "@/constants/Permission";
import { AccessDenied } from "@/components/ui/access-denied";
import { PageHeader } from "@/components/ui/page-header";

export const StockPage = () => {
    const { Can } = usePermission();
    const canRead = Can(PERMISSION.STOCK.READ);
    const canUpdate = Can(PERMISSION.STOCK.UPDATE);

    const [page, setPage] = useState(1);
    const [size, setSize] = useState(10);
    const [search, setSearch] = useState("");
    const [filterValues, setFilterValues] = useState<Record<string, string>>({});
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});

    const storeId = filterValues.storeId ? Number(filterValues.storeId) : undefined;
    const productId = filterValues.productId ? Number(filterValues.productId) : undefined;

    // Fetch stocks with storeId and productId filters
    const { data, isError, isLoading } = useStock.useGetAllStock({
        page,
        size,
        storeId,
        productId,
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

    // Derive unique product options from stock records
    const stockList = data?.payload?.data;
    const productOptions = useMemo(() => {
        if (!stockList) return [];
        const map = new Map<number, string>();
        stockList.forEach((s: StockResponse) => {
            if (s.productId && s.productName) {
                map.set(s.productId, s.productName);
            }
        });
        return Array.from(map.entries()).map(([id, name]) => ({
            label: name,
            value: String(id),
        }));
    }, [stockList]);

    // Filter Groups for Filter + Toolbar
    const filterGroups: FilterGroup[] = useMemo(
        () => [
            {
                key: "storeId",
                label: "Store",
                options: storeOptions,
            },
            {
                key: "productId",
                label: "Product",
                options: productOptions,
            },
            {
                key: "stockStatus",
                label: "Stock Status",
                options: [
                    { label: "Low Stock", value: "LOW" },
                    { label: "In Stock", value: "IN_STOCK" },
                    { label: "Out of Stock", value: "OUT_OF_STOCK" },
                ],
            },
        ],
        [storeOptions, productOptions]
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
            if (!value) {
                delete next[key];
            } else {
                next[key] = value;
            }
            return next;
        });
    };

    const handleReset = () => {
        setSearch("");
        setFilterValues({});
        setPage(1);
    };

    const searchedStocks = useSearch<StockResponse>(
        stockList,
        search,
        ["productName", "storeName"]
    );

    const filteredStocks = useMemo(() => {
        return searchedStocks.filter((item) => {
            if (storeId && item.storeId !== storeId) {
                return false;
            }
            if (productId && item.productId !== productId) {
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
    }, [searchedStocks, filterValues, storeId, productId]);

    const columns = useMemo(
        () =>
            StockColumns({
                canEdit: canUpdate,
                canDelete: false,
            }),
        [canUpdate]
    );

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
                title="Stock Inventory"
                // description="Manage and track real-time stock levels across all stores and products."
            />

            {/* Main Card with Toolbar & Table */}
            <div className="rounded-2xl border border-border/60 bg-card shadow-2xs overflow-hidden">
                {/* Toolbar row with Search, Filter+, Columns, Print, CSV */}
                <div className="p-4 border-b border-border/60">
                    <PageFilter
                        search={search}
                        onSearchChange={setSearch}
                        searchPlaceholder="Search product or store..."
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
