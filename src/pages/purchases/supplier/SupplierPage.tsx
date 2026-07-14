import { useState } from "react";
import { DataTable } from "@/components/ui/data-table";
import { QueryBoundary } from "@/components/ui/query-boundary";
import ConfirmDelete from "@/components/ui/confirmDelete";
import { useSearch } from "@/utils/useSearch";
import PageHeader from "@/components/ui/page-header";
import { PageFilter } from "@/utils/PageFilter";
import FormSupplier from "./FormSupplier";
import { SupplierColumns } from "./SupplierColumn";
import { useSupplier } from "@/hooks/purchases/useSupplier";
import type { SupplierResponse } from "@/types/purchases/Supplier";
import { usePermission } from "@/utils/UsePermission";
import { PERMISSION } from "@/constants/Permission";

export const SupplierPage = () => {
  const { Can } = usePermission();
  const canCreate = Can(PERMISSION.SUPPLIER.CREATE);
  const canRead = Can(PERMISSION.SUPPLIER.READ);
  const canUpdate = Can(PERMISSION.SUPPLIER.UPDATE);
  const canDelete = Can(PERMISSION.SUPPLIER.DELETE);

  const [open, setOpen] = useState(false)
  const [supplier, setSupplier] = useState<SupplierResponse | null>(null);
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(10);
  const [search, setSearch] = useState("")
  const { data, isError, isLoading } = useSupplier.useGetAllSupplier({ page, size })
  const { mutate: deleteSupplierMutate } = useSupplier.useDeleteSupplier()
  const [openConfirmDelete, setOpenConfirmDelete] = useState(false)

  const filteredSuppliers = useSearch<SupplierResponse>(data?.payload?.data, search, ["name", "email", "phone"]);


  const handleEdit = (supplier: SupplierResponse) => {
    setSupplier(supplier);
    setOpen(true);
  }



  const handleDelete = (id: number) => {
    const selected = data?.payload?.data?.find((u: SupplierResponse) => u.id === id);
    if (selected) {
      setSupplier(selected);
      setOpenConfirmDelete(true);
    }
  }

  const confirmDelete = () => {
    if (supplier?.id) {
      deleteSupplierMutate(supplier.id, {
        onSuccess: () => {
          setOpenConfirmDelete(false)
        }
      })
    }
  };

  if (!canRead) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] text-center p-4">
        <h2 className="text-xl font-semibold text-destructive mb-2">Access Denied</h2>
        <p className="text-muted-foreground">You do not have permission to view suppliers.</p>
      </div>
    );
  }


  return (
    <>
      <PageHeader
        title="Suppliers"
        buttonText={canCreate ? "Add Supplier" : undefined}
        onButtonClick={canCreate ? () => { setSupplier(null); setOpen(true); } : undefined}
      />
      <PageFilter
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search supplier..."
        onReset={() => setSearch("")}
      />

      <QueryBoundary isLoading={isLoading} isError={isError}>
        <DataTable
          columns={SupplierColumns({
            onEdit: handleEdit,
            onDelete: handleDelete,
            canEdit: canUpdate,
            canDelete: canDelete,
          })}
          data={filteredSuppliers}
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
      <FormSupplier
        open={open}
        setOpen={setOpen}
        supplier={supplier}
      />

      <ConfirmDelete
        isOpen={openConfirmDelete}
        setIsOpen={setOpenConfirmDelete}
        entityName={"Suppliers"}
        confirmDelete={confirmDelete}
      />
    </>
  )
}

