import { useMemo, useState } from "react";
import type { VisibilityState } from "@tanstack/react-table";
import { DataTable, exportTableToCsv, exportTableToPdf, printTable, getColumnsForVisibility } from "@/components/ui/data-table";
import { QueryBoundary } from "@/components/ui/query-boundary";
import ConfirmDelete from "@/components/ui/confirmDelete";
import { PageHeader } from "@/components/ui/page-header";
import { useSearch } from "@/utils/useSearch";
import { PageFilter, type FilterGroup } from "@/utils/PageFilter";
import type { ExpenseTypeResponse } from "@/types/expense/expense.type";
import { Status } from "@/types/enum/status";
import FormExpenseType from "./ExpenseTypeForm";
import { ExpenseTypeColumns } from "./ExpenseTypeColumn";
import { useExpenseType } from "@/hooks/expense/useExpenseType";
import { usePermission } from "@/utils/UsePermission";
import { PERMISSION } from "@/constants/Permission";
import { AccessDenied } from "@/components/ui/access-denied";

const ExpenseTypePage = () => {
    const { Can } = usePermission();
    const canCreate = Can(PERMISSION.EXPENSES_TYPE.CREATE);
    const canRead = Can(PERMISSION.EXPENSES_TYPE.READ);
    const canUpdate = Can(PERMISSION.EXPENSES_TYPE.UPDATE);
    const canDelete = Can(PERMISSION.EXPENSES_TYPE.DELETE);

    const [open, setOpen] = useState(false);
    const [expenseType, setExpenseType] = useState<ExpenseTypeResponse | null>(null);
    const [page, setPage] = useState(1);
    const [size, setSize] = useState(10);
    const [search, setSearch] = useState("");
    const [filterValues, setFilterValues] = useState<Record<string, string>>({});
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
    const [openConfirmDelete, setOpenConfirmDelete] = useState(false);

    const { data, isError, isLoading } = useExpenseType.useGetAllExpenseType({
        page,
        size,
    });

    const { mutate: deleteExpenseTypeMutate } = useExpenseType.useDeleteExpenseType();

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

    const searchedExpenseTypes = useSearch<ExpenseTypeResponse>(
        data?.payload?.data,
        search,
        ["name", "code", "status"]
    );

    const filteredExpenseTypes = useMemo(() => {
        return searchedExpenseTypes.filter((item) => {
            if (filterValues.status && item.status !== filterValues.status) {
                return false;
            }
            return true;
        });
    }, [searchedExpenseTypes, filterValues]);

    const handleEdit = (expenseType: ExpenseTypeResponse) => {
        if (!canUpdate) return;
        setExpenseType(expenseType);
        setOpen(true);
    };

    const handleDelete = (id: number) => {
        if (!canDelete) return;
        const selected = data?.payload?.data?.find(
            (u: ExpenseTypeResponse) => u.id === id
        );
        if (selected) {
            setExpenseType(selected);
            setOpenConfirmDelete(true);
        }
    };

    const confirmDelete = () => {
        if (expenseType?.id) {
            deleteExpenseTypeMutate(
                { id: expenseType.id },
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
            ExpenseTypeColumns({
                onEdit: handleEdit,
                onDelete: handleDelete,
            }),
        []
    );

    const handleExportCsv = () => {
        exportTableToCsv(filteredExpenseTypes, columns, "expenseTypes");
    };

    const handleDownloadPdf = () => {
        exportTableToPdf(filteredExpenseTypes, columns, "expenseTypes", "Expense Types List");
    };

    const handlePrintPdf = () => {
        printTable("Expense Types List");
    };

    if (!canRead) return <AccessDenied resource="expense types" showBackButton />;

    return (
        <>
            <div className="space-y-4">
                {/* Top Header */}
                <PageHeader
                    title="Expense Types"
                    featureName="Expense Type"
                    onCreate={canCreate ? () => {
                        setExpenseType(null);
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
                            searchPlaceholder="Search expense types..."
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
                                data={filteredExpenseTypes}
                                columnVisibility={columnVisibility}
                                onColumnVisibilityChange={setColumnVisibility}
                                pagination={{
                                    currentPage: page,
                                    pageSize: size,
                                    totalElements: data?.payload?.pagination?.totalElements || filteredExpenseTypes.length,
                                    totalPages: data?.payload?.pagination?.totalPages || 1,
                                    onPageChange: setPage,
                                    onPageSizeChange: setSize,
                                }}
                            />
                        </QueryBoundary>
                    </div>
                </div>
            </div>

            <FormExpenseType open={open} setOpen={setOpen} expenseType={expenseType} />

            <ConfirmDelete
                isOpen={openConfirmDelete}
                setIsOpen={setOpenConfirmDelete}
                entityName={"Expense Type"}
                confirmDelete={confirmDelete}
            />
        </>
    );
};

export default ExpenseTypePage;