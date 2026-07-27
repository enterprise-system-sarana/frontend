import { useState } from "react";
import { DataTable } from "@/components/ui/data-table";
import { QueryBoundary } from "@/components/ui/query-boundary";
import ConfirmDelete from "@/components/ui/confirmDelete";
import PageHeader from "@/components/ui/page-header";
import { PageFilter } from "@/utils/PageFilter";

import { useSearch } from "@/utils/useSearch";
import { usePermission } from "@/utils/UsePermission";
import { PERMISSION } from "@/constants/Permission";

import {
  useGetAllAdjustment,
  useDeleteAdjustment,
} from "@/hooks/inventory/useadjustment";
import type { AdjustmentResponse } from "@/types/inventory/Adjutment";

import FormAdjustment from "./FormAdjustment";
import { AdjustmentColumns } from "./AdjustmentColumn";

export const AdjustmentPage = () => {
  const { Can } = usePermission();

  const canCreate = Can(PERMISSION.ADJUSTMENT.CREATE);
  const canRead = Can(PERMISSION.ADJUSTMENT.READ);
  const canUpdate = Can(PERMISSION.ADJUSTMENT.UPDATE);
  const canDelete = Can(PERMISSION.ADJUSTMENT.DELETE);

  const [open, setOpen] = useState(false);
  const [adjustment, setAdjustment] = useState<AdjustmentResponse | null>(null);

  const [page, setPage] = useState(1);
  const [size, setSize] = useState(10);
  const [search, setSearch] = useState("");

  const [openConfirmDelete, setOpenConfirmDelete] = useState(false);

  const { data, isLoading, isError } = useGetAllAdjustment({ page, size });

  const { mutate: deleteAdjustmentMutate } = useDeleteAdjustment();

  const filteredAdjustments = useSearch<AdjustmentResponse>(
    data?.payload?.data,
    search,
    ["referenceNo", "note", "status"]
  );

  const handleEdit = (item: AdjustmentResponse) => {
    setAdjustment(item);
    setOpen(true);
  };

  const handleDelete = (id: number) => {
    const selected = data?.payload?.data?.find(
      (item: AdjustmentResponse) => item.id === id
    );

    if (selected) {
      setAdjustment(selected);
      setOpenConfirmDelete(true);
    }
  };

  const confirmDelete = () => {
    if (adjustment?.id) {
      deleteAdjustmentMutate(
        { id: adjustment.id },
        {
          onSuccess: () => {
            setOpenConfirmDelete(false);
          },
        }
      );
    }
  };

  if (!canRead) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] text-center p-4">
        <h2 className="text-xl font-semibold text-destructive mb-2">
          Access Denied
        </h2>
        <p className="text-muted-foreground">
          You do not have permission to view adjustments.
        </p>
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title="Adjustments"
        buttonText={canCreate ? "Add Adjustment" : undefined}
        onButtonClick={
          canCreate
            ? () => {
                setAdjustment(null);
                setOpen(true);
              }
            : undefined
        }
      />

      <PageFilter
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search adjustment..."
        onReset={() => setSearch("")}
      />

      <QueryBoundary isLoading={isLoading} isError={isError}>
        <DataTable
          columns={AdjustmentColumns({
            onEdit: handleEdit,
            onDelete: handleDelete,
            canEdit: canUpdate,
            canDelete: canDelete,
          })}
          data={filteredAdjustments}
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

      <FormAdjustment open={open} setOpen={setOpen} adjustment={adjustment} />

      <ConfirmDelete
        isOpen={openConfirmDelete}
        setIsOpen={setOpenConfirmDelete}
        entityName="Adjustment"
        confirmDelete={confirmDelete}
      />
    </>
  );
};

export default AdjustmentPage;
