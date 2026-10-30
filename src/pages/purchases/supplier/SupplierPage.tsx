import { useMemo, useState } from "react";
import type { VisibilityState } from "@tanstack/react-table";
import { DataTable, exportTableToCsv, exportTableToPdf, printTable, getColumnsForVisibility } from "@/components/ui/data-table";
import { QueryBoundary } from "@/components/ui/query-boundary";
import ConfirmDelete from "@/components/ui/confirmDelete";
import { useSearch } from "@/utils/useSearch";
import { PageFilter, type FilterGroup } from "@/utils/PageFilter";
import FormSupplier from "./SupplierForm";
import { SupplierColumns } from "./SupplierColumn";
import { useSupplier } from "@/hooks/purchases/useSupplier";
import type { SupplierResponse } from "@/types/purchases/Supplier";
import { PageHeader } from "@/components/ui/page-header";
import { usePermission } from "@/utils/UsePermission";
import { PERMISSION } from "@/constants/Permission";
import { Status } from "@/types/enum/status";
import { AccessDenied } from "@/components/ui/access-denied";
import { useLanguage } from "@/i18n/LanguageContext";

export const SupplierPage = () => {
  const { t } = useLanguage();
  const { Can } = usePermission();
  const canCreate = Can(PERMISSION.SUPPLIER.CREATE);
  const canRead = Can(PERMISSION.SUPPLIER.READ);
  const canUpdate = Can(PERMISSION.SUPPLIER.UPDATE);
  const canDelete = Can(PERMISSION.SUPPLIER.DELETE);

  const [open, setOpen] = useState(false);
  const [supplier, setSupplier] = useState<SupplierResponse | null>(null);
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(10);
  const [search, setSearch] = useState("");
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [openConfirmDelete, setOpenConfirmDelete] = useState(false);

  const { data, isError, isLoading } = useSupplier.useGetAllSupplier({ page, size });
  const { mutate: deleteSupplierMutate } = useSupplier.useDeleteSupplier();

  // Filter Groups for Filter +
  const filterGroups: FilterGroup[] = useMemo(
    () => [
      {
        key: "status",
        label: t("common.status"),
        options: [
          { label: t("common.active"), value: Status.ACTIVE },
          { label: t("common.inactive"), value: Status.INACTIVE },
        ],
      },
    ],
    [t]
  );

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

  const searchedSuppliers = useSearch<SupplierResponse>(
    data?.payload?.data,
    search,
    ["code", "name", "status"]
  );

  const filteredSuppliers = useMemo(() => {
    return searchedSuppliers.filter((item) => {
      if (filterValues.status && item.status !== filterValues.status) {
        return false;
      }
      return true;
    });
  }, [searchedSuppliers, filterValues]);

  const handleEdit = (s: SupplierResponse) => {
    setSupplier(s);
    setOpen(true);
  };

  const handleDelete = (id: number) => {
    const selected = data?.payload?.data?.find((u: SupplierResponse) => u.id === id);
    if (selected) {
      setSupplier(selected);
      setOpenConfirmDelete(true);
    }
  };

  const confirmDelete = () => {
    if (supplier?.id) {
      deleteSupplierMutate(supplier.id, {
        onSuccess: () => {
          setOpenConfirmDelete(false);
        },
      });
    }
  };

  const columns = useMemo(
    () =>
      SupplierColumns({
        onEdit: handleEdit,
        onDelete: handleDelete,
        canEdit: canUpdate,
        canDelete: canDelete,
        t,
      }),
    [canUpdate, canDelete, t]
  );

  const handleExportCsv = () => {
    exportTableToCsv(filteredSuppliers, columns, "Suppliers");
  };

  const handleDownloadPdf = () => {
    exportTableToPdf(filteredSuppliers, columns, "Suppliers", "Suppliers List");
  };

  const handlePrintPdf = () => {
    printTable("Suppliers List");
  };

  if (!canRead) {
    return <AccessDenied resource="suppliers" showBackButton />;
  }

  return (
    <>
      <div className="space-y-4">
        {/* Top Header */}
        <PageHeader
          title={t("nav.suppliers")}
          featureName={t("nav.supplier")}
          onCreate={
            canCreate
              ? () => {
                  setSupplier(null);
                  setOpen(true);
                }
              : undefined
          }
          hideButton={!canCreate}
        />

        {/* Main Card with Toolbar & Table */}
        <div className="rounded-2xl border border-border bg-card shadow-card overflow-hidden">
          {/* Toolbar row with Search, Filter+, Columns, Print, CSV */}
          <div className="px-5 py-4 border-b border-border">
            <PageFilter
              search={search}
              onSearchChange={setSearch}
              searchPlaceholder={t("common.search")}
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
                data={filteredSuppliers}
                columnVisibility={columnVisibility}
                onColumnVisibilityChange={setColumnVisibility}
                pagination={{
                  currentPage: page,
                  pageSize: size,
                  totalElements: data?.payload?.pagination?.totalElements || filteredSuppliers.length,
                  totalPages: data?.payload?.pagination?.totalPages || 1,
                  onPageChange: setPage,
                  onPageSizeChange: setSize,
                }}
              />
            </QueryBoundary>
          </div>
        </div>
      </div>

      <FormSupplier open={open} setOpen={setOpen} supplier={supplier} />

      <ConfirmDelete
        isOpen={openConfirmDelete}
        setIsOpen={setOpenConfirmDelete}
        entityName={t("nav.supplier")}
        confirmDelete={confirmDelete}
      />
    </>
  );
};
