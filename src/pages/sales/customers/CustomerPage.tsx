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
import ConfirmDelete from "@/components/ui/confirmDelete";
import { PageHeader } from "@/components/ui/page-header";
import { useSearch } from "@/utils/useSearch";
import { PageFilter, type FilterGroup } from "@/utils/PageFilter";
import type { CustomerResponse } from "@/types/sales/Customer";
import { useCustomer } from "@/hooks/sales/useCustomer";
import FormCustomer from "./CustomerForm";
import { CustomerColumns } from "./CustomerColumn";
import { Status } from "@/types/enum/status";
import { usePermission } from "@/utils/UsePermission";
import { PERMISSION } from "@/constants/Permission";
import { AccessDenied } from "@/components/ui/access-denied";

export const CustomerPage = () => {
    const { Can } = usePermission();
    const canCreate = Can(PERMISSION.CUSTOMER.CREATE);
    const canRead = Can(PERMISSION.CUSTOMER.READ);
    const canUpdate = Can(PERMISSION.CUSTOMER.UPDATE);
    const canDelete = Can(PERMISSION.CUSTOMER.DELETE);

    const [open, setOpen] = useState(false);
    const [customer, setCustomer] = useState<CustomerResponse | null>(null);
    const [page, setPage] = useState(1);
    const [size, setSize] = useState(10);
    const [search, setSearch] = useState("");
    const [filterValues, setFilterValues] = useState<Record<string, string>>({});
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
    const [openConfirmDelete, setOpenConfirmDelete] = useState(false);

    const { data, isError, isLoading } = useCustomer.useGetAllCustomer({
        page,
        size,
    });

    const { mutate: deleteCustomerMutate } = useCustomer.useDeleteCustomer();

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

    const searchedCustomers = useSearch<CustomerResponse>(
        data?.payload?.data,
        search,
        ["name", "code"]
    );

    const filteredCustomers = useMemo(() => {
        return searchedCustomers.filter((item) => {
            if (filterValues.status && item.status !== filterValues.status) {
                return false;
            }
            return true;
        });
    }, [searchedCustomers, filterValues]);

    const handleEdit = (c: CustomerResponse) => {
        if (!canUpdate) return;
        setCustomer(c);
        setOpen(true);
    };

    const handleDelete = (id: number) => {
        if (!canDelete) return;
        const selected = data?.payload?.data?.find(
            (u: CustomerResponse) => u.id === id
        );
        if (selected) {
            setCustomer(selected);
            setOpenConfirmDelete(true);
        }
    };

    const confirmDelete = () => {
        if (customer?.id) {
            deleteCustomerMutate(
                { id: customer.id },
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
            CustomerColumns({
                onEdit: handleEdit,
                onDelete: handleDelete,
                // canEdit: canUpdate,
                // canDelete: canDelete,
            }),
        []
    );

    const handleExportCsv = () => {
        exportTableToCsv(filteredCustomers, columns, "customers");
    };

    const handleDownloadPdf = () => {
        exportTableToPdf(filteredCustomers, columns, "customers", "Customers List");
    };

    const handlePrintPdf = () => {
        printTable("Customers List");
    };

    if (!canRead) return <AccessDenied resource="customers" showBackButton />;

    return (
        <>
            <div className="space-y-4">
                {/* Top Header */}
                <PageHeader
                    title="Customers"
                    featureName="Customer"
                    onCreate={canCreate ? () => {
                        setCustomer(null);
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
                            searchPlaceholder="Search customers..."
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
                                data={filteredCustomers}
                                columnVisibility={columnVisibility}
                                onColumnVisibilityChange={setColumnVisibility}
                                pagination={{
                                    currentPage: page,
                                    pageSize: size,
                                    totalElements:
                                        data?.payload?.pagination?.totalElements ||
                                        filteredCustomers.length,
                                    totalPages: data?.payload?.pagination?.totalPages || 1,
                                    onPageChange: setPage,
                                    onPageSizeChange: setSize,
                                }}
                            />
                        </QueryBoundary>
                    </div>
                </div>
            </div>

            <FormCustomer open={open} setOpen={setOpen} customer={customer} />

            <ConfirmDelete
                isOpen={openConfirmDelete}
                setIsOpen={setOpenConfirmDelete}
                entityName={"Customer"}
                confirmDelete={confirmDelete}
            />
        </>
    );
};

export default CustomerPage;