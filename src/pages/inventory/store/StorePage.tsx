import { useState } from "react";
import { DataTable } from "@/components/ui/data-table";
import { QueryBoundary } from "@/components/ui/query-boundary";
import ConfirmDelete from "@/components/ui/confirmDelete";
import type { StoreResponse } from "@/types/inventory/Store";
import { useSearch } from "@/utils/useSearch";
import PageHeader from "@/components/ui/page-header";
import { PageFilter } from "@/utils/PageFilter";
import { useStore } from "@/hooks/inventory/useStore";
import FormStore from "./FormStore";
import { StoreColumns } from "./StoreColumn";
import { usePermission } from "@/utils/UsePermission";
import { PERMISSION } from "@/constants/Permission";

export const StorePage = () => {
  const { Can } = usePermission();
  const canCreate = Can(PERMISSION.STORE.CREATE);
  const canRead = Can(PERMISSION.STORE.READ);
  const canUpdate = Can(PERMISSION.STORE.UPDATE);
  const canDelete = Can(PERMISSION.STORE.DELETE);

  const [open, setOpen] = useState(false)
  const [store, setStore] = useState<StoreResponse | null>(null);
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(10);
  const [search, setSearch] = useState("")
  const { data, isError, isLoading } = useStore.useGetAllStore({ page, size })
  const { mutate: deleteStoreMutate } = useStore.useDeleteStore()
  const [openConfirmDelete, setOpenConfirmDelete] = useState(false)

  const filteredStores = useSearch<StoreResponse>(data?.payload?.data, search, ["name", "code", "email", "phone", "city", "state", "country", "status"]);


  const handleEdit = (store: StoreResponse) => {
    setStore(store);
    setOpen(true);
  }



  const handleDelete = (id: number) => {
    const selected = data?.payload?.data?.find((u: StoreResponse) => u.id === id);
    if (selected) {
      setStore(selected);
      setOpenConfirmDelete(true);
    }
  }

  const confirmDelete = () => {
    if (store?.id) {
      deleteStoreMutate(store.id, {
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
        <p className="text-muted-foreground">You do not have permission to view stores.</p>
      </div>
    );
  }


  return (
    <>
      <PageHeader
        title="Stores"
        buttonText={canCreate ? "Add Store" : undefined}
        onButtonClick={canCreate ? () => { setStore(null); setOpen(true); } : undefined}
      />
      <PageFilter
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search store..."
        onReset={() => setSearch("")}
      />

      <QueryBoundary isLoading={isLoading} isError={isError}>
        <DataTable
          columns={StoreColumns({
            onEdit: handleEdit,
            onDelete: handleDelete,
            canEdit: canUpdate,
            canDelete: canDelete,
          })}
          data={filteredStores}
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
      <FormStore
        open={open}
        setOpen={setOpen}
        store={store}
      />

      <ConfirmDelete
        isOpen={openConfirmDelete}
        setIsOpen={setOpenConfirmDelete}
        entityName={"Stores"}
        confirmDelete={confirmDelete}
      />
    </>
  )
}

