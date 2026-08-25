import { useMemo, useState } from "react";
import type { VisibilityState } from "@tanstack/react-table";
import { DataTable, exportTableToCsv, exportTableToPdf, printTable, getColumnsForVisibility } from "@/components/ui/data-table";
import { QueryBoundary } from "@/components/ui/query-boundary";
import ConfirmDelete from "@/components/ui/confirmDelete";
import type { StoreResponse } from "@/types/inventory/Store";
import { useSearch } from "@/utils/useSearch";
import { PageFilter, type FilterGroup } from "@/utils/PageFilter";
import { useStore } from "@/hooks/inventory/useStore";
import FormStore from "./StoreForm";
import { StoreColumns } from "./StoreColumn";
import { usePermission } from "@/utils/UsePermission";
import { PERMISSION } from "@/constants/Permission";
import { PageHeader } from "@/components/ui/page-header";
import { Status } from "@/types/enum/status";
import { AccessDenied } from "@/components/ui/access-denied";

export const StorePage = () => {
  const { Can } = usePermission();
  const canCreate = Can(PERMISSION.STORE.CREATE);
  const canRead = Can(PERMISSION.STORE.READ);
  const canUpdate = Can(PERMISSION.STORE.UPDATE);
  const canDelete = Can(PERMISSION.STORE.DELETE);

  const [open, setOpen] = useState(false);
  const [store, setStore] = useState<StoreResponse | null>(null);
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(10);
  const [search, setSearch] = useState("");
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [openConfirmDelete, setOpenConfirmDelete] = useState(false);

  const { data, isError, isLoading } = useStore.useGetAllStore({ page, size });
  const { mutate: deleteStoreMutate } = useStore.useDeleteStore();

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

  const searchedStores = useSearch<StoreResponse>(
    data?.payload?.data,
    search,
    ["code", "name", "status"]
  );

  const filteredStores = useMemo(() => {
    return searchedStores.filter((item) => {
      if (filterValues.status && item.status !== filterValues.status) {
        return false;
      }
      return true;
    });
  }, [searchedStores, filterValues]);

  const handleEdit = (s: StoreResponse) => {
    setStore(s);
    setOpen(true);
  };

  const handleDelete = (id: number) => {
    const selected = data?.payload?.data?.find((u: StoreResponse) => u.id === id);
    if (selected) {
      setStore(selected);
      setOpenConfirmDelete(true);
    }
  };

  const confirmDelete = () => {
    if (store?.id) {
      deleteStoreMutate(store.id, {
        onSuccess: () => {
          setOpenConfirmDelete(false);
        },
      });
    }
  };

  const columns = useMemo(
    () =>
      StoreColumns({
        onEdit: handleEdit,
        onDelete: handleDelete,
        canEdit: canUpdate,
        canDelete: canDelete,
      }),
    [canUpdate, canDelete]
  );

  const handleExportCsv = () => {
    exportTableToCsv(filteredStores, columns, "stores");
  };

  const handleDownloadPdf = () => {
    exportTableToPdf(filteredStores, columns, "stores", "Stores List");
  };

  const handlePrintPdf = () => {
    printTable("Stores List");
  };

  if (!canRead) {
    return <AccessDenied resource="stores" showBackButton />;
  }

  return (
    <>
      <div className="space-y-4">
        {/* Top Header */}
        <PageHeader
          title="Stores"
          featureName="Store"
          onCreate={
            canCreate
              ? () => {
                  setStore(null);
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
              searchPlaceholder="Search stores..."
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
                data={filteredStores}
                columnVisibility={columnVisibility}
                onColumnVisibilityChange={setColumnVisibility}
                pagination={{
                  currentPage: page,
                  pageSize: size,
                  totalElements: data?.payload?.pagination?.totalElements || filteredStores.length,
                  totalPages: data?.payload?.pagination?.totalPages || 1,
                  onPageChange: setPage,
                  onPageSizeChange: setSize,
                }}
              />
            </QueryBoundary>
          </div>
        </div>
      </div>

      <FormStore open={open} setOpen={setOpen} store={store} />

      <ConfirmDelete
        isOpen={openConfirmDelete}
        setIsOpen={setOpenConfirmDelete}
        entityName={"Store"}
        confirmDelete={confirmDelete}
      />
    </>
  );
};
