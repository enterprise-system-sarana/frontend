import { useState } from "react";
import type { BankResponse } from "@/types/finance/Bank";
import { useBank, useDeleteBank } from "@/hooks/finance/useBank";
import { DataTable } from "@/components/ui/data-table";
import { BankColumns } from "./BankColumn";
import { QueryBoundary } from "@/components/ui/query-boundary";
import FormBank from "./BankForm";
import ConfirmDelete from "@/components/ui/confirmDelete";
import PageHeader from "@/components/ui/page-header";
import { usePermission } from "@/utils/UsePermission";
import { PERMISSION } from "@/constants/Permission";
import { useSearch } from "@/utils/useSearch";
import { PageFilter } from "@/utils/PageFilter";

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
    const { data, isError, isLoading } = useBank({ page, size });
    const { mutate: deleteBankMutate } = useDeleteBank();
    const [openConfirmDelete, setOpenConfirmDelete] = useState(false);

    const filteredBanks = useSearch<BankResponse>(data?.payload?.data || [], search, ["name", "number", "statement"]);

    const handleEdit = (bank: BankResponse) => {
        setBank(bank);
        setOpen(true);
    };

    const handleDelete = (id: number) => {
        const selected = data?.payload?.data?.find((b: BankResponse) => b.id === id);
        if (selected) {
            setBank(selected);
            setOpenConfirmDelete(true);
        }
    };

    const confirmDelete = () => {
        if (bank?.id) {
            deleteBankMutate(bank.id, {
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
                <p className="text-muted-foreground">You do not have permission to view banks.</p>
            </div>
        );
    }

    return (
        <>
            <PageHeader
                title="Banks"
                buttonText={canCreate ? "Add Bank" : undefined}
                onButtonClick={canCreate ? () => { setBank(null); setOpen(true); } : undefined}
            />
            <PageFilter
                search={search}
                onSearchChange={setSearch}
                searchPlaceholder="Search banks..."
                onReset={() => setSearch("")}
            />
            <QueryBoundary isLoading={isLoading} isError={isError}>
                <DataTable
                    columns={BankColumns({
                        onEdit: handleEdit,
                        onDelete: handleDelete,
                        canEdit: canUpdate,
                        canDelete: canDelete,
                    })}
                    data={filteredBanks}
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

            <FormBank
                open={open}
                setOpen={setOpen}
                bank={bank}
            />

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
