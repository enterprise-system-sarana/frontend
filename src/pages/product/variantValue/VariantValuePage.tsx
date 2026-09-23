import { useMemo, useState } from "react";
import type { VisibilityState } from "@tanstack/react-table";
import { DataTable, exportTableToCsv, exportTableToPdf, printTable, getColumnsForVisibility } from "@/components/ui/data-table";
import { QueryBoundary } from "@/components/ui/query-boundary";
import ConfirmDelete from "@/components/ui/confirmDelete";
import { PageHeader } from "@/components/ui/page-header";
import { useSearch } from "@/utils/useSearch";
import { PageFilter, type FilterGroup } from "@/utils/PageFilter";
import type { VariantValueResponse } from "@/types/product/VariantValue";
import { useVariantValue } from "@/hooks/product/useVariantValue";
import { useVariantType } from "@/hooks/product/useVariantType";
import type { VariantTypeResponse } from "@/types/product/VariantType";
import { Status } from "@/types/enum/status";
import VariantValueForm from "./VariantValueForm";
import { VariantValueColumns } from "./VariantValueColumn";
import { usePermission } from "@/utils/UsePermission";
import { PERMISSION } from "@/constants/Permission";
import { AccessDenied } from "@/components/ui/access-denied";

const VariantValuePage = () => {
    const { Can } = usePermission();
    const canCreate = Can(PERMISSION.VARIANT_VALUE.CREATE);
    const canRead = Can(PERMISSION.VARIANT_VALUE.READ);
    const canUpdate = Can(PERMISSION.VARIANT_VALUE.UPDATE);
    const canDelete = Can(PERMISSION.VARIANT_VALUE.DELETE);

    const [open, setOpen] = useState(false);
    const [variantValue, setVariantValue] = useState<VariantValueResponse | null>(null);
    const [page, setPage] = useState(1);
    const [size, setSize] = useState(10);
    const [search, setSearch] = useState("");
    const [filterValues, setFilterValues] = useState<Record<string, string>>({});
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
    const [openConfirmDelete, setOpenConfirmDelete] = useState(false);

    // Queries
    const { data, isError, isLoading } = useVariantValue.useGetAllVariantValue({ page, size });
    const { mutate: deleteVariantValueMutate } = useVariantValue.useDeleteVariantValue();
    const { data: variantTypeData } = useVariantType.useGetAllVariantType({ page: 1, size: 100 });

    // Filter Groups for Filter +
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

        if (
            variantTypeData?.payload?.data &&
            variantTypeData.payload.data.length > 0
        ) {
            groups.push({
                key: "variantTypeId",
                label: "Variant Type",
                options: variantTypeData.payload.data.map(
                    (vt: VariantTypeResponse) => ({
                        label: vt.name,
                        value: String(vt.id),
                    })
                ),
            });
        }

        return groups;
    }, [variantTypeData]);

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

    const searchedVariantValues = useSearch<VariantValueResponse>(data?.payload?.data, search, [
        "name",
        "status",
    ]);

    const filteredVariantValues = useMemo(() => {
        return searchedVariantValues.filter((item) => {
            if (filterValues.status && item.status !== filterValues.status) {
                return false;
            }
            if (filterValues.variantTypeId && String(item.variantTypeId) !== filterValues.variantTypeId) {
                return false;
            }
            return true;
        });
    }, [searchedVariantValues, filterValues]);

    const handleEdit = (vv: VariantValueResponse) => {
        if (!canUpdate) return;
        setVariantValue(vv);
        setOpen(true);
    };

    const handleDelete = (id: number) => {
        if (!canDelete) return;
        const selected = data?.payload?.data?.find((u: VariantValueResponse) => u.id === id);
        if (selected) {
            setVariantValue(selected);
            setOpenConfirmDelete(true);
        }
    };

    const confirmDelete = () => {
        if (variantValue?.id) {
            deleteVariantValueMutate(
                { id: variantValue.id },
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
            VariantValueColumns({
                onEdit: handleEdit,
                onDelete: handleDelete,
            }),
        []
    );

    const handleExportCsv = () => {
        exportTableToCsv(filteredVariantValues, columns, "variant-values");
    };

    const handleDownloadPdf = () => {
        exportTableToPdf(filteredVariantValues, columns, "variant-values", "Variant Values List");
    };

    const handlePrintPdf = () => {
        printTable("Variant Values List");
    };

    if (!canRead) return <AccessDenied resource="variant values" showBackButton />;

    return (
        <>
            <div className="space-y-4">
                {/* Top Header */}
                <PageHeader
                    title="Variant Values"
                    featureName="Variant Value"
                    onCreate={canCreate ? () => {
                        setVariantValue(null);
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
                            searchPlaceholder="Search variant values..."
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
                                data={filteredVariantValues}
                                columnVisibility={columnVisibility}
                                onColumnVisibilityChange={setColumnVisibility}
                                pagination={{
                                    currentPage: page,
                                    pageSize: size,
                                    totalElements: data?.payload?.pagination?.totalElements || filteredVariantValues.length,
                                    totalPages: data?.payload?.pagination?.totalPages || 1,
                                    onPageChange: setPage,
                                    onPageSizeChange: setSize,
                                }}
                            />
                        </QueryBoundary>
                    </div>
                </div>
            </div>

            <VariantValueForm open={open} setOpen={setOpen} variantValue={variantValue} />

            <ConfirmDelete
                isOpen={openConfirmDelete}
                setIsOpen={setOpenConfirmDelete}
                entityName={"Variant Value"}
                confirmDelete={confirmDelete}
            />
        </>
    );
};

export default VariantValuePage;
