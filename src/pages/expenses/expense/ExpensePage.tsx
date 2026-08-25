import { useMemo, useState } from "react";
import type { VisibilityState } from "@tanstack/react-table";
import { DataTable, exportTableToCsv, exportTableToPdf, printTable, getColumnsForVisibility } from "@/components/ui/data-table";
import { QueryBoundary } from "@/components/ui/query-boundary";
import ConfirmDelete from "@/components/ui/confirmDelete";
import { PageHeader } from "@/components/ui/page-header";
import { useSearch } from "@/utils/useSearch";
import { PageFilter, type FilterGroup } from "@/utils/PageFilter";
import type { ExpenseResponse } from "@/types/expense/expense";
import { Status } from "@/types/enum/status";
import FormExpense from "./ExpenseForm";
import { ExpenseColumns } from "./ExpenseColumn";
import { useExpense } from "@/hooks/expense/useExpense";
import { useExpenseType } from "@/hooks/expense/useExpenseType";

const ExpensePage = () => {
    const [open, setOpen] = useState(false);
    const [expense, setExpense] = useState<ExpenseResponse | null>(null);
    const [page, setPage] = useState(1);
    const [size, setSize] = useState(10);
    const [search, setSearch] = useState("");
    const [filterValues, setFilterValues] = useState<Record<string, string>>({});
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
    const [openConfirmDelete, setOpenConfirmDelete] = useState(false);

    // Queries
    const { data, isError, isLoading } = useExpense.useGetAllExpense({
        page,
        size,
        status: filterValues.status,
        expenseTypeId: filterValues.expenseTypeId ? Number(filterValues.expenseTypeId) : undefined,
    });

    const { mutate: deleteExpenseMutate } = useExpense.useDeleteExpense();
    const { data: expenseTypeData } = useExpenseType.useGetAllExpenseType({ page: 1, size: 100 });

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

        const expenseTypes = expenseTypeData?.payload?.data || [];
        if (expenseTypes.length > 0) {
            groups.push({
                key: "expenseTypeId",
                label: "Expense Type",
                options: expenseTypes.map((et: any) => ({
                    label: et.name,
                    value: String(et.id),
                })),
            });
        }

        return groups;
    }, [expenseTypeData]);

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
        setPage(1);
    };

    const handleReset = () => {
        setSearch("");
        setFilterValues({});
        setPage(1);
    };

    const expenseList: ExpenseResponse[] = data?.payload?.data || [];

    const searchedExpenses = useSearch<ExpenseResponse>(
        expenseList,
        search,
        ["reference", "expenseTypeName", "storeName", "bankName", "note", "description", "status"]
    );

    const filteredExpenses = useMemo(() => {
        return searchedExpenses.filter((item) => {
            if (filterValues.status && item.status !== filterValues.status) {
                return false;
            }
            if (filterValues.expenseTypeId && String(item.expenseTypeId) !== filterValues.expenseTypeId) {
                return false;
            }
            return true;
        });
    }, [searchedExpenses, filterValues]);

    const handleEdit = (exp: ExpenseResponse) => {
        setExpense(exp);
        setOpen(true);
    };

    const handleDelete = (id: number) => {
        const selected = expenseList.find((u) => u.id === id);
        if (selected) {
            setExpense(selected);
            setOpenConfirmDelete(true);
        }
    };

    const confirmDelete = () => {
        if (expense?.id) {
            deleteExpenseMutate(
                { id: expense.id },
                {
                    onSuccess: () => {
                        setOpenConfirmDelete(false);
                        setExpense(null);
                    },
                }
            );
        }
    };

    const columns = useMemo(
        () =>
            ExpenseColumns({
                onEdit: handleEdit,
                onDelete: handleDelete,
            }),
        []
    );

    const handleExportCsv = () => {
        exportTableToCsv(filteredExpenses, columns, "expenses");
    };

    const handleDownloadPdf = () => {
        exportTableToPdf(filteredExpenses, columns, "expenses", "Expense List");
    };

    const handlePrintPdf = () => {
        printTable("Expense List");
    };

    return (
        <>
            <div className="space-y-4">
                {/* Top Header */}
                <PageHeader
                    title="Expenses"
                    featureName="Expense"
                    onCreate={() => {
                        setExpense(null);
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
                            searchPlaceholder="Search expenses by reference, type, store, or note..."
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
                                data={filteredExpenses}
                                columnVisibility={columnVisibility}
                                onColumnVisibilityChange={setColumnVisibility}
                                pagination={{
                                    currentPage: page,
                                    pageSize: size,
                                    totalElements: data?.payload?.pagination?.totalElements || filteredExpenses.length,
                                    totalPages: data?.payload?.pagination?.totalPages || 1,
                                    onPageChange: setPage,
                                    onPageSizeChange: setSize,
                                }}
                            />
                        </QueryBoundary>
                    </div>
                </div>
            </div>

            <FormExpense open={open} setOpen={setOpen} expense={expense} />

            <ConfirmDelete
                isOpen={openConfirmDelete}
                setIsOpen={setOpenConfirmDelete}
                entityName={"Expense"}
                confirmDelete={confirmDelete}
            />
        </>
    );
};

export default ExpensePage;
export { ExpensePage };