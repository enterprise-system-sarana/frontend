import { useMemo, useState } from "react";
import type { VisibilityState } from "@tanstack/react-table";
import { DataTable, exportTableToCsv, exportTableToPdf, printTable, getColumnsForVisibility } from "@/components/ui/data-table";
import { QueryBoundary } from "@/components/ui/query-boundary";
import ConfirmDelete from "@/components/ui/confirmDelete";
import { PageHeader } from "@/components/ui/page-header";
import { useSearch } from "@/utils/useSearch";
import { PageFilter, type FilterGroup } from "@/utils/PageFilter";
import type { VariantTypeResponse } from "@/types/product/VariantType";
import { useVariantType } from "@/hooks/product/useVariantType";
import { Status } from "@/types/enum/status";
import VariantTypeForm from "./VariantTypeForm";
import { VariantTypeColumns } from "./VariantTypeColumn";
import { usePermission } from "@/utils/UsePermission";
import { PERMISSION } from "@/constants/Permission";
import { AccessDenied } from "@/components/ui/access-denied";

const VariantTypePage = () => {
    const { Can } = usePermission();
    const canCreate = Can(PERMISSION.VARIANT_TYPE.CREATE);
    const canRead = Can(PERMISSION.VARIANT_TYPE.READ);
    const canUpdate = Can(PERMISSION.VARIANT_TYPE.UPDATE);
    const canDelete = Can(PERMISSION.VARIANT_TYPE.DELETE);

    const [open, setOpen] = useState(false);
    const [variantType, setVariantType] = useState<VariantTypeResponse | null>(null);
    const [page, setPage] = useState(1);
    const [size, setSize] = useState(10);
    const [search, setSearch] = useState("");
    const [filterValues, setFilterValues] = useState<Record<string, string>>({});
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
    const [openConfirmDelete, setOpenConfirmDelete] = useState(false);

    const { data, isError, isLoading } = useVariantType.useGetAllVariantType({
        page,
        size,
    });

    const { mutate: deleteVariantTypeMutate } =
        useVariantType.useDeleteVariantType();

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

    const searchedVariantTypes = useSearch<VariantTypeResponse>(
        data?.payload?.data,
        search,
        ["name", "status"]
    );

    const filteredVariantTypes = useMemo(() => {
        return searchedVariantTypes.filter((item) => {
            if (filterValues.status && item.status !== filterValues.status) {
                return false;
            }
            return true;
        });
    }, [searchedVariantTypes, filterValues]);

    const handleEdit = (v: VariantTypeResponse) => {
        if (!canUpdate) return;
        setVariantType(v);
        setOpen(true);
    };

    const handleDelete = (id: number) => {
        if (!canDelete) return;
        const selected = data?.payload?.data?.find(
            (u: VariantTypeResponse) => u.id === id
        );
        if (selected) {
            setVariantType(selected);
            setOpenConfirmDelete(true);
        }
    };

    const confirmDelete = () => {
        if (variantType?.id) {
            deleteVariantTypeMutate(
                { id: variantType.id },
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
            VariantTypeColumns({
                onEdit: handleEdit,
                onDelete: handleDelete,
            }),
        []
    );

    const handleExportCsv = () => {
        exportTableToCsv(filteredVariantTypes, columns, "variant-types");
    };

    const handleDownloadPdf = () => {
        exportTableToPdf(filteredVariantTypes, columns, "variant-types", "Variant Types List");
    };

    const handlePrintPdf = () => {
        printTable("Variant Types List");
    };

    if (!canRead) return <AccessDenied resource="variant types" showBackButton />;

    return (
        <>
            <div className="space-y-4">
                {/* Top Header */}
                <PageHeader
                    title="Variant Types"
                    featureName="Variant Type"
                    onCreate={canCreate ? () => {
                        setVariantType(null);
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
                            searchPlaceholder="Search variant types..."
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
                                data={filteredVariantTypes}
                                columnVisibility={columnVisibility}
                                onColumnVisibilityChange={setColumnVisibility}
                                pagination={{
                                    currentPage: page,
                                    pageSize: size,
                                    totalElements: data?.payload?.pagination?.totalElements || filteredVariantTypes.length,
                                    totalPages: data?.payload?.pagination?.totalPages || 1,
                                    onPageChange: setPage,
                                    onPageSizeChange: setSize,
                                }}
                            />
                        </QueryBoundary>
                    </div>
                </div>
            </div>

            <VariantTypeForm open={open} setOpen={setOpen} variantType={variantType} />

            <ConfirmDelete
                isOpen={openConfirmDelete}
                setIsOpen={setOpenConfirmDelete}
                entityName={"Variant Type"}
                confirmDelete={confirmDelete}
            />
        </>
    );
};

export default VariantTypePage;