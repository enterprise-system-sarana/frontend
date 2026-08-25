import { useMemo, useState } from "react";
import type { VisibilityState } from "@tanstack/react-table";
import type { BrandResponse } from "@/types/product/Brand";
import { useBrand } from "@/hooks/product/useBrand";
import { DataTable, exportTableToCsv, exportTableToPdf, printTable, getColumnsForVisibility } from "@/components/ui/data-table";
import { BrandColumns } from "./BrandColumn";
import { QueryBoundary } from "@/components/ui/query-boundary";
import FormBrand from "./BrandForm";
import ConfirmDelete from "@/components/ui/confirmDelete";
import { PageHeader } from "@/components/ui/page-header";
import { useSearch } from "@/utils/useSearch";
import { PageFilter, type FilterGroup } from "@/utils/PageFilter";
import { Status } from "@/types/enum/status";

const BrandPage = () => {
    const [open, setOpen] = useState(false);
    const [brand, setBrand] = useState<BrandResponse | null>(null);
    const [page, setPage] = useState(1);
    const [size, setSize] = useState(10);
    const [search, setSearch] = useState("");
    const [filterValues, setFilterValues] = useState<Record<string, string>>({});
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
    const [openConfirmDelete, setOpenConfirmDelete] = useState(false);

    const { data, isError, isLoading } = useBrand.useGetAllBrand({
        page,
        size,
    });

    const { mutate: deleteBrandMutate } = useBrand.useDeleteBrand();

    // Filter Groups for Filter +
    const filterGroups: FilterGroup[] = [
        {
            key: "status",
            label: "Status",
            options: [
                { label: "Active", value: Status.ACTIVE },
                { label: "Inactive", value: Status.INACTIVE },
            ],
        },
    ];

    const handleColumnToggle = (columnId: string) => {
        setColumnVisibility((prev) => ({
            ...prev,
            [columnId]: prev[columnId] === false ? true : false,
        }));
    };

    const handleFilterChange = (key: string, value: string) => {
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
    };

    const searchedBrands = useSearch<BrandResponse>(
        data?.payload?.data,
        search,
        ["name", "status"]
    );

    const filteredBrands = useMemo(() => {
        return searchedBrands.filter((item) => {
            if (filterValues.status && item.status !== filterValues.status) {
                return false;
            }
            return true;
        });
    }, [searchedBrands, filterValues]);

    const handleEdit = (b: BrandResponse) => {
        setBrand(b);
        setOpen(true);
    };

    const handleDelete = (id: number) => {
        const selected = data?.payload?.data?.find(
            (u: BrandResponse) => u.id === id
        );
        if (selected) {
            setBrand(selected);
            setOpenConfirmDelete(true);
        }
    };

    const confirmDelete = () => {
        if (brand?.id) {
            deleteBrandMutate(
                { id: brand.id },
                {
                    onSuccess: () => {
                        setOpenConfirmDelete(false);
                    },
                }
            );
        }
    };

    const columns = useMemo(
        () =>
            BrandColumns({
                onEdit: handleEdit,
                onDelete: handleDelete,
            }),
        []
    );

    const handleExportCsv = () => {
        exportTableToCsv(filteredBrands, columns, "brands");
    };

    const handleDownloadPdf = () => {
        exportTableToPdf(filteredBrands, columns, "brands", "Brands List");
    };

    const handlePrintPdf = () => {
        printTable("Brands List");
    };

    return (
        <>
            <div className="space-y-4">
                {/* Top Header */}
                <PageHeader
                    title="Brands"
                    featureName="Brand"
                    onCreate={() => {
                        setBrand(null);
                        setOpen(true);
                    }}
                />

                {/* Main Card with Toolbar & Table */}
                <div className="rounded-2xl border border-border/60 bg-card shadow-2xs overflow-hidden">
                    {/* Toolbar row with Search, Filter+, Columns, Print, CSV */}
                    <div className="p-4 border-b border-border/60">
                        <PageFilter
                            search={search}
                            onSearchChange={setSearch}
                            searchPlaceholder="Search brands..."
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
                                data={filteredBrands}
                                columnVisibility={columnVisibility}
                                onColumnVisibilityChange={setColumnVisibility}
                                pagination={{
                                    currentPage: page,
                                    pageSize: size,
                                    totalElements: data?.payload?.pagination?.totalElements || filteredBrands.length,
                                    totalPages: data?.payload?.pagination?.totalPages || 1,
                                    onPageChange: setPage,
                                    onPageSizeChange: setSize,
                                }}
                            />
                        </QueryBoundary>
                    </div>
                </div>
            </div>

            <FormBrand open={open} setOpen={setOpen} brand={brand} />

            <ConfirmDelete
                isOpen={openConfirmDelete}
                setIsOpen={setOpenConfirmDelete}
                entityName={"Brand"}
                confirmDelete={confirmDelete}
            />
        </>
    );
};

export default BrandPage;