import { useState } from "react";
import type { CurrencyResponse } from "@/types/finance/Currency";
import { useCurrency, useDeleteCurrency } from "@/hooks/finance/useCurrency";
import { DataTable } from "@/components/ui/data-table";
import { CurrencyColumns } from "./CurrencyColumn";
import { QueryBoundary } from "@/components/ui/query-boundary";
import FormCurrency from "./CurrencyForm";
import ConfirmDelete from "@/components/ui/confirmDelete";
import PageHeader from "@/components/ui/page-header";
import { usePermission } from "@/utils/UsePermission";
import { PERMISSION } from "@/constants/Permission";
import { useSearch } from "@/utils/useSearch";
import { PageFilter } from "@/utils/PageFilter";

export const CurrencyPage = () => {
    const { Can } = usePermission();
    const canCreate = Can(PERMISSION.CURRENCY.CREATE);
    const canRead = Can(PERMISSION.CURRENCY.READ);
    const canUpdate = Can(PERMISSION.CURRENCY.UPDATE);
    const canDelete = Can(PERMISSION.CURRENCY.DELETE);

    const [open, setOpen] = useState(false);
    const [currency, setCurrency] = useState<CurrencyResponse | null>(null);
    const [page, setPage] = useState(1);
    const [size, setSize] = useState(10);
    const [search, setSearch] = useState("");
    const { data, isError, isLoading } = useCurrency({ page, size });
    const { mutate: deleteCurrencyMutate } = useDeleteCurrency();
    const [openConfirmDelete, setOpenConfirmDelete] = useState(false);

    const filteredCurrencies = useSearch<CurrencyResponse>(data?.payload?.data || [], search, ["name", "code", "symbol"]);

    const handleEdit = (currency: CurrencyResponse) => {
        setCurrency(currency);
        setOpen(true);
    };

    const handleDelete = (id: number) => {
        const selected = data?.payload?.data?.find((c: CurrencyResponse) => c.id === id);
        if (selected) {
            setCurrency(selected);
            setOpenConfirmDelete(true);
        }
    };

    const confirmDelete = () => {
        if (currency?.id) {
            deleteCurrencyMutate(currency.id, {
                onSuccess: () => {
                    setOpenConfirmDelete(false);
                }
            });
        }
    };

    if (!canRead) {
        return (
            <div className="flex flex-col items-center justify-center h-[50vh] text-center p-4">
                <h2 className="text-xl font-semibold text-destructive mb-2">Access Denied</h2>
                <p className="text-muted-foreground">You do not have permission to view currencies.</p>
            </div>
        );
    }

    return (
        <>
            <PageHeader
                title="Currencies"
                buttonText={canCreate ? "Add Currency" : undefined}
                onButtonClick={canCreate ? () => { setCurrency(null); setOpen(true); } : undefined}
            />
            <PageFilter
                search={search}
                onSearchChange={setSearch}
                searchPlaceholder="Search currencies..."
                onReset={() => setSearch("")}
            />
            <QueryBoundary isLoading={isLoading} isError={isError}>
                <DataTable
                    columns={CurrencyColumns({
                        onEdit: handleEdit,
                        onDelete: handleDelete,
                        canEdit: canUpdate,
                        canDelete: canDelete,
                    })}
                    data={filteredCurrencies}
                    pagination={{
                        currentPage: page,
                        pageSize: size,
                        totalElements: data?.payload?.pagination?.totalElements || 0,
                        totalPages: data?.payload?.pagination?.totalPages || 1,
                        onPageChange: setPage,
                        onPageSizeChange: setSize,
                    }}
                />
            </QueryBoundary>

            <FormCurrency
                open={open}
                setOpen={setOpen}
                currency={currency}
            />

            <ConfirmDelete
                isOpen={openConfirmDelete}
                setIsOpen={setOpenConfirmDelete}
                entityName="Currency"
                confirmDelete={confirmDelete}
            />
        </>
    );
};

export default CurrencyPage;
