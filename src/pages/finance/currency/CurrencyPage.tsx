import { useState, useMemo } from "react";
import type { CurrencyResponse } from "@/types/finance/Currency";
import { useCurrency } from "@/hooks/finance/useCurrency";
import { DataTable } from "@/components/ui/data-table";
import { CurrencyColumns } from "./CurrencyColumn";
import { QueryBoundary } from "@/components/ui/query-boundary";
import FormCurrency from "./CurrencyForm";
import ConfirmDelete from "@/components/ui/confirmDelete";
import { PageHeader } from "@/components/ui/page-header";
import { usePermission } from "@/utils/UsePermission";
import { PERMISSION } from "@/constants/Permission";
import { useSearch } from "@/utils/useSearch";
import { PageFilter } from "@/utils/PageFilter";
import { AccessDenied } from "@/components/ui/access-denied";
import { useLanguage } from "@/i18n/LanguageContext";

export const CurrencyPage = () => {
    const { t } = useLanguage();
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
    const [openConfirmDelete, setOpenConfirmDelete] = useState(false);

    const { data, isError, isLoading } = useCurrency.GetAllCurrency({ page, size });
    const { mutate: deleteCurrencyMutate } = useCurrency.DeleteCurrency();

    const currencyList: CurrencyResponse[] = useMemo(() => {
        const payload = data?.payload;
        if (Array.isArray(payload?.data)) return payload.data;
        if (Array.isArray(payload?.content)) return payload.content;
        if (Array.isArray(payload)) return payload;
        if (Array.isArray((data as any)?.data)) return (data as any).data;
        if (Array.isArray(data)) return data;
        return [];
    }, [data]);

    const filteredCurrencies = useSearch<CurrencyResponse>(currencyList, search, ["code", "name", "symbol"]);

    const handleEdit = (curr: CurrencyResponse) => {
        setCurrency(curr);
        setOpen(true);
    };

    const handleDelete = (id: number) => {
        const selected = currencyList.find((c: CurrencyResponse) => c.id === id);
        if (selected) {
            setCurrency(selected);
            setOpenConfirmDelete(true);
        }
    };

    const confirmDelete = () => {
        if (currency?.id) {
            deleteCurrencyMutate({ id: currency.id }, {
                onSuccess: () => {
                    setOpenConfirmDelete(false);
                }
            });
        }
    };

    const totalElements =
        data?.payload?.pagination?.totalElements ||
        data?.payload?.totalElements ||
        currencyList.length;
    const totalPages =
        data?.payload?.pagination?.totalPages ||
        data?.payload?.totalPages ||
        Math.max(1, Math.ceil(totalElements / size));

    if (!canRead) {
        return <AccessDenied resource="currencies" showBackButton />;
    }

    return (
        <>
            <div className="space-y-4">
                {/* Top Header */}
                <PageHeader
                    title={t("finance.currencies")}
                    buttonLabel={t("common.create")}
                    onCreate={canCreate ? () => { setCurrency(null); setOpen(true); } : undefined}
                    hideButton={!canCreate}
                />

                <div className="rounded-2xl border border-border bg-card shadow-card overflow-hidden">
                    <div className="px-5 py-4 border-b border-border">
                        <PageFilter
                            search={search}
                            onSearchChange={setSearch}
                            searchPlaceholder={t("common.search")}
                            onReset={() => setSearch("")}
                        />
                    </div>

                    <div className="px-0">
                        <QueryBoundary isLoading={isLoading} isError={isError}>
                            <DataTable
                                columns={CurrencyColumns({
                                    onEdit: handleEdit,
                                    onDelete: handleDelete,
                                    canEdit: canUpdate,
                                    canDelete: canDelete,
                                    t,
                                })}
                                data={filteredCurrencies}
                                pagination={{
                                    currentPage: page,
                                    pageSize: size,
                                    totalElements,
                                    totalPages,
                                    onPageChange: setPage,
                                    onPageSizeChange: setSize,
                                }}
                            />
                        </QueryBoundary>
                    </div>
                </div>
            </div>

            <FormCurrency
                open={open}
                setOpen={setOpen}
                currency={currency}
            />

            <ConfirmDelete
                isOpen={openConfirmDelete}
                setIsOpen={setOpenConfirmDelete}
                entityName={t("finance.currency")}
                confirmDelete={confirmDelete}
            />
        </>
    );
};

export default CurrencyPage;
