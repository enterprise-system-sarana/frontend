import { useMemo, useState } from "react";
import type { VisibilityState } from "@tanstack/react-table";
import { DataTable, exportTableToCsv, exportTableToPdf, printTable, getColumnsForVisibility } from "@/components/ui/data-table";
import { QueryBoundary } from "@/components/ui/query-boundary";
import ConfirmDelete from "@/components/ui/confirmDelete";
import { PageHeader } from "@/components/ui/page-header";
import { useSearch } from "@/utils/useSearch";
import { PageFilter, type FilterGroup } from "@/utils/PageFilter";
import type { ModelResponse } from "@/types/product/Model";
import { useModel } from "@/hooks/product/useModel";
import { useBrand } from "@/hooks/product/useBrand";
import { useCategory } from "@/hooks/product/useCategory";
import type { BrandResponse } from "@/types/product/Brand";
import type { CategoryResponse } from "@/types/product/Category";
import { Status } from "@/types/enum/status";
import { ModelColumns } from "./ModelColumn";
import ModelForm from "./ModelForm";
import { usePermission } from "@/utils/UsePermission";
import { PERMISSION } from "@/constants/Permission";
import { AccessDenied } from "@/components/ui/access-denied";

const ModelPage = () => {
    const { Can } = usePermission();
    const canCreate = Can(PERMISSION.MODEL.CREATE);
    const canRead = Can(PERMISSION.MODEL.READ);
    const canUpdate = Can(PERMISSION.MODEL.UPDATE);
    const canDelete = Can(PERMISSION.MODEL.DELETE);

    const [open, setOpen] = useState(false);
    const [model, setModel] = useState<ModelResponse | null>(null);
    const [page, setPage] = useState(1);
    const [size, setSize] = useState(10);
    const [search, setSearch] = useState("");
    const [filterValues, setFilterValues] = useState<Record<string, string>>({});
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
    const [openConfirmDelete, setOpenConfirmDelete] = useState(false);

    // Queries
    // Queries
    const { data, isError, isLoading } = useModel.GetAllModel({
        page,
        size,
    });

    const { data: brandData } = useBrand.useGetAllBrand({
        page: 1,
        size: 100,
    });

    const { data: categoryData } = useCategory.useGetAllCategory({
        page: 1,
        size: 100,
    });

    const { mutate: deleteModelMutate } = useModel.DeleteModel();

    // Dynamically build filter groups with options from brand and category APIs
    const filterGroups: FilterGroup[] = useMemo(() => {
        const groups: FilterGroup[] = [
            {
                key: "status",
                label: "Status",
                options: [
                    { label: "Active", value: Status.ACTIVE },
                    { label: "Inactive", value: Status.INACTIVE },
                ],
            },
        ];

        if (brandData?.payload?.data && brandData.payload.data.length > 0) {
            groups.push({
                key: "brandId",
                label: "Brand",
                options: brandData.payload.data.map((b: BrandResponse) => ({
                    label: b.name,
                    value: String(b.id),
                })),
            });
        }

        if (categoryData?.payload?.data && categoryData.payload.data.length > 0) {
            groups.push({
                key: "categoryId",
                label: "Category",
                options: categoryData.payload.data.map((c: CategoryResponse) => ({
                    label: c.name,
                    value: String(c.id),
                })),
            });
        }

        return groups;
    }, [brandData, categoryData]);

    const handleColumnToggle = (columnId: string) => {
        setColumnVisibility((prev) => ({
            ...prev,
            [columnId]: prev[columnId] === false ? true : false,
        }));
    };

    // Filter handlers
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

    // Apply search and dropdown filters
    const searchedModels = useSearch<ModelResponse>(
        data?.payload?.data,
        search,
        ["name", "status"]
    );

    const filteredModels = useMemo(() => {
        return searchedModels.filter((item) => {
            if (filterValues.status && item.status !== filterValues.status) {
                return false;
            }
            if (filterValues.brandId && String(item.brandId) !== filterValues.brandId) {
                return false;
            }
            if (filterValues.categoryId && String(item.categoryId) !== filterValues.categoryId) {
                return false;
            }
            return true;
        });
    }, [searchedModels, filterValues]);

    // Actions
    const handleEdit = (m: ModelResponse) => {
        if (!canUpdate) return;
        setModel(m);
        setOpen(true);
    };

    const handleDelete = (id: number) => {
        if (!canDelete) return;
        const selected = data?.payload?.data?.find(
            (u: ModelResponse) => u.id === id
        );
        if (selected) {
            setModel(selected);
            setOpenConfirmDelete(true);
        }
    };

    const confirmDelete = () => {
        if (model?.id) {
            deleteModelMutate(
                { id: model.id },
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
            ModelColumns({
                onEdit: handleEdit,
                onDelete: handleDelete,
            }),
        []
    );

    // Export handlers
    const handleExportCsv = () => {
        exportTableToCsv(filteredModels, columns, "models");
    };

    const handleDownloadPdf = () => {
        exportTableToPdf(filteredModels, columns, "models", "Models List");
    };

    const handlePrintPdf = () => {
        printTable("Models List");
    };

    if (!canRead) return <AccessDenied resource="models" showBackButton />;

    return (
        <>
            <div className="space-y-4">
                {/* Top Header */}
                <PageHeader
                    title="Models"
                    featureName="Model"
                    onCreate={canCreate ? () => {
                        setModel(null);
                        setOpen(true);
                    } : undefined}
                    hideButton={!canCreate}
                />

                {/* Main Card with Toolbar & Table */}
                <div className="rounded-2xl border border-border/60 bg-card shadow-2xs overflow-hidden">
                    {/* Toolbar row with Search, Filter+, Columns, Print, CSV */}
                    <div className="p-4 border-b border-border/60">
                        <PageFilter
                            search={search}
                            onSearchChange={setSearch}
                            searchPlaceholder="Search models..."
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
                                data={filteredModels}
                                columnVisibility={columnVisibility}
                                onColumnVisibilityChange={setColumnVisibility}
                                pagination={{
                                    currentPage: page,
                                    pageSize: size,
                                    totalElements: data?.payload?.pagination?.totalElements || filteredModels.length,
                                    totalPages: data?.payload?.pagination?.totalPages || 1,
                                    onPageChange: setPage,
                                    onPageSizeChange: setSize,
                                }}
                            />
                        </QueryBoundary>
                    </div>
                </div>
            </div>

            {/* Create / Edit Dialog */}
            <ModelForm open={open} setOpen={setOpen} model={model} />

            {/* Confirm Delete Dialog */}
            <ConfirmDelete
                isOpen={openConfirmDelete}
                setIsOpen={setOpenConfirmDelete}
                entityName={"Model"}
                confirmDelete={confirmDelete}
            />
        </>
    );
};

export default ModelPage;