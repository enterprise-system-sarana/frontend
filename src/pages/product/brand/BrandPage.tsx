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
import { usePermission } from "@/utils/UsePermission";
import { PERMISSION } from "@/constants/Permission";
import { AccessDenied } from "@/components/ui/access-denied";
import { useLanguage } from "@/i18n/LanguageContext";

const BrandPage = () => {
    const { t } = useLanguage();
    const { Can } = usePermission();
    const canCreate = Can(PERMISSION.BRAND.CREATE);
    const canRead = Can(PERMISSION.BRAND.READ);
    const canUpdate = Can(PERMISSION.BRAND.UPDATE);
    const canDelete = Can(PERMISSION.BRAND.DELETE);

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
    const filterGroups: FilterGroup[] = useMemo(
        () => [
            {
                key: "status",
                label: t("common.status"),
                options: [
                    { label: t("common.active"), value: Status.ACTIVE },
                    { label: t("common.inactive"), value: Status.INACTIVE },
                ],
            },
        ],
        [t]
    );

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
        if (!canUpdate) return;
        setBrand(b);
        setOpen(true);
    };

    const handleDelete = (id: number) => {
        if (!canDelete) return;
        const selected = data?.payload?.data?.find(
            (u: BrandResponse) => u.id === id
        );
        console.log("selected", selected)
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
                t,
            }),
        [t]
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

    if (!canRead) return <AccessDenied resource="brands" showBackButton />;

    return (
        <>
            <div className="space-y-4">
                {/* Top Header */}
                <PageHeader
                    title={t("nav.brand")}
                    featureName={t("common.brand")}
                    onCreate={canCreate ? () => {
                        setBrand(null);
                        setOpen(true);
                    } : undefined}
                    hideButton={!canCreate}
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