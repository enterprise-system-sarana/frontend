import { DataTable } from "@/components/ui/data-table";
import { QueryBoundary } from "@/components/ui/query-boundary";
import { useUnit } from "@/hooks/product/useUnit";
import { useState } from "react"
import { unitColumn } from "./UnitColumn";
import type { UnitResponse } from "@/types/product/Unit";
import { UnitForm } from "./UnitForm";
import PageHeader from "@/components/ui/page-header";
import ConfirmDelete from "@/components/ui/confirmDelete";
import { usePermission } from "@/utils/UsePermission";
import { PERMISSION } from "@/constants/Permission";
import { useSearch } from "@/utils/useSearch";
import { PageFilter } from "@/utils/PageFilter";

const UnitPage = () => {
    const { Can } = usePermission();
    const canCreate = Can(PERMISSION.UNIT.CREATE);
    const canRead = Can(PERMISSION.UNIT.READ);
    const canUpdate = Can(PERMISSION.UNIT.UPDATE);
    const canDelete = Can(PERMISSION.UNIT.DELETE);

    const [open, setOpen] = useState(false);
    const [unit, setUnit] = useState<UnitResponse | null>(null);
    const [page, setPage] = useState(1);
    const [size, setSize] = useState(10);
    const [search, setSearch] = useState("");
    const { data, isError, isLoading } = useUnit.useUnitGetAll({ page, size })
    console.log(data)

    const filteredUnits = useSearch<UnitResponse>(data?.payload?.data, search, ["name", "code", "baseUnit"]);

    const { mutate: useUnitDelete } = useUnit.useUnitDelete()
    const [openConfirmDelete, setOpenConfirmDelete] = useState(false)
    const handleEdit = (unit: UnitResponse) => {
        setUnit(unit);
        setOpen(true);
    }

    const handleDelete = (id: number) => {
        const selected = data?.payload?.data?.find((u: UnitResponse) => u.id === id);
        if (selected) {
            setUnit(selected);
            setOpenConfirmDelete(true);
        }
    }

    const confirmDelete = () => {
        if (unit?.id) {
            useUnitDelete(unit.id, {
                onSuccess: () => {
                    setOpenConfirmDelete(false)
                }
            })
        }
    }

    if (!canRead) {
        return (
            <div className="flex flex-col items-center justify-center h-[50vh] text-center p-4">
                <h2 className="text-xl font-semibold text-destructive mb-2">Access Denied</h2>
                <p className="text-muted-foreground">You do not have permission to view units.</p>
            </div>
        );
    }

    return (
        <>
            <PageHeader
                title="Unit"
                buttonText={canCreate ? "Add Unit" : undefined}
                onButtonClick={canCreate ? () => { setUnit(null); setOpen(true); } : undefined}
            />
            <PageFilter
                search={search}
                onSearchChange={setSearch}
                searchPlaceholder="Search units..."
                onReset={() => setSearch("")}
            />
            <QueryBoundary isError={isError} isLoading={isLoading}>
                <DataTable
                    columns={unitColumn({
                        onEdit: handleEdit,
                        onDelete: handleDelete,
                        canEdit: canUpdate,
                        canDelete: canDelete,
                    })}
                    data={filteredUnits}
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

            <UnitForm
                open={open}
                setOpen={setOpen}
                unit={unit}
            />

            <ConfirmDelete
                isOpen={openConfirmDelete}
                setIsOpen={setOpenConfirmDelete}
                entityName="Unit"
                confirmDelete={confirmDelete}
            />


        </>
    )
}



export default UnitPage;