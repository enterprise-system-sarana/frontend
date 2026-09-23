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
import type { BankResponse } from "@/types/finance/Bank";
import { useBank } from "@/hooks/finance/useBank";
import { usePermission } from "@/utils/UsePermission";
import { PERMISSION } from "@/constants/Permission";
import { AccessDenied } from "@/components/ui/access-denied";
import FormBank from "./BankForm";
import { BankColumns } from "./BankColumn";
import { Status } from "@/types/enum/status";

export const BankPage = () => {
    const { Can } = usePermission();
    const canCreate = Can(PERMISSION.BANK.CREATE);
    const canRead = Can(PERMISSION.BANK.READ);
    const canUpdate = Can(PERMISSION.BANK.UPDATE);
    const canDelete = Can(PERMISSION.BANK.DELETE);

    const [open, setOpen] = useState(false);
    const [bank, setBank] = useState<BankResponse | null>(null);
    const [page, setPage] = useState(1);
    const [size, setSize] = useState(10);
    const [search, setSearch] = useState("");
    const [filterValues, setFilterValues] = useState<Record<string, string>>({});
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
    const [openConfirmDelete, setOpenConfirmDelete] = useState(false);

    const { data, isError, isLoading } = useBank.useGetAllBank({
        page,
        size,
    });

    const { mutate: deleteBankMutate } = useBank.useDeleteBank();

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

    const searchedBanks = useSearch<BankResponse>(
        data?.payload?.data,
        search,
        ["name", "accountName", "accountNumber"]
    );

    const filteredBanks = useMemo(() => {
        return searchedBanks.filter((item) => {
            if (filterValues.status && item.status !== filterValues.status) {
                return false;
            }
            return true;
        });
    }, [searchedBanks, filterValues]);

    const handleEdit = (b: BankResponse) => {
        if (!canUpdate) return;
        setBank(b);
        setOpen(true);
    };

    const handleDelete = (id: number) => {
        if (!canDelete) return;
        const selected = data?.payload?.data?.find(
            (u: BankResponse) => u.id === id
        );
        if (selected) {
            setBank(selected);
            setOpenConfirmDelete(true);
        }
    };

    const confirmDelete = () => {
        if (bank?.id) {
            deleteBankMutate(
                { id: bank.id },
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
            BankColumns({
                onEdit: handleEdit,
                onDelete: handleDelete,
                canEdit: canUpdate,
                canDelete: canDelete,
            }),
        []
    );

    const handleExportCsv = () => {
        exportTableToCsv(filteredBanks, columns, "banks");
    };

    const handleDownloadPdf = () => {
        exportTableToPdf(filteredBanks, columns, "banks", "Banks List");
    };

    const handlePrintPdf = () => {
        printTable("Banks List");
    };

    if (!canRead) {
        return <AccessDenied resource="banks" showBackButton />;
    }

    return (
        <>
            <div className="space-y-4">
                {/* Top Header */}
                <PageHeader
                    title="Banks"
                    featureName="Bank"
                    onCreate={
                        canCreate
                            ? () => {
                                setBank(null);
                                setOpen(true);
                            }
                            : undefined
                    }
                    hideButton={!canCreate}
                />

                {/* Main Card with Toolbar & Table */}
                <div className="rounded-2xl border border-border/60 bg-card shadow-2xs overflow-hidden">
                    {/* Toolbar row with Search, Filter+, Columns, Print, CSV */}
                    <div className="p-4 border-b border-border/60">
                        <PageFilter
                            search={search}
                            onSearchChange={setSearch}
                            searchPlaceholder="Search banks..."
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
                                data={filteredBanks}
                                columnVisibility={columnVisibility}
                                onColumnVisibilityChange={setColumnVisibility}
                                pagination={{
                                    currentPage: page,
                                    pageSize: size,
                                    totalElements:
                                        data?.payload?.pagination?.totalElements ||
                                        filteredBanks.length,
                                    totalPages: data?.payload?.pagination?.totalPages || 1,
                                    onPageChange: setPage,
                                    onPageSizeChange: setSize,
                                }}
                            />
                        </QueryBoundary>
                    </div>
                </div>
            </div>

            <FormBank open={open} setOpen={setOpen} bank={bank} />

            <ConfirmDelete
                isOpen={openConfirmDelete}
                setIsOpen={setOpenConfirmDelete}
                entityName="Bank"
                confirmDelete={confirmDelete}
            />
        </>
    );
};

export default BankPage;
