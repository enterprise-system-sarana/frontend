import { useCallback, useMemo, useState } from "react";
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
import type { CategoryResponse } from "@/types/product/Category";
import { useCategory } from "@/hooks/product/useCategory";
import { Status } from "@/types/enum/status";
import FormCategory from "./CategoryForm";
import { CategoryColumns } from "./CategoryColumn";
import { usePermission } from "@/utils/UsePermission";
import { PERMISSION } from "@/constants/Permission";
import { AccessDenied } from "@/components/ui/access-denied";

const CategoryPage = () => {
  const { Can } = usePermission();
  const canCreate = Can(PERMISSION.CATEGORY.CREATE);
  const canRead = Can(PERMISSION.CATEGORY.READ);
  const canUpdate = Can(PERMISSION.CATEGORY.UPDATE);
  const canDelete = Can(PERMISSION.CATEGORY.DELETE);

  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState<CategoryResponse | null>(null);
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(10);
  const [search, setSearch] = useState("");
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [openConfirmDelete, setOpenConfirmDelete] = useState(false);

  const { data, isError, isLoading } = useCategory.useGetAllCategory({
    page,
    size,
  });

  const { mutate: deleteCategoryMutate } = useCategory.useDeleteCategory();

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

  const searchedCategories = useSearch<CategoryResponse>(
    data?.payload?.data,
    search,
    ["name", "status"],
  );

  const filteredCategories = useMemo(() => {
    return searchedCategories.filter((item) => {
      if (filterValues.status && item.status !== filterValues.status) {
        return false;
      }
      return true;
    });
  }, [searchedCategories, filterValues]);

  const handleEdit = useCallback((c: CategoryResponse) => {
    if (!canUpdate) return;
    setCategory(c);
    setOpen(true);
  }, []);

  const handleDelete = useCallback(
    (id: number) => {
      if (!canDelete) return;
      const selected = data?.payload?.data?.find(
        (u: CategoryResponse) => u.id === id,
      );

      if (selected) {
        setCategory(selected);
        setOpenConfirmDelete(true);
      }
    },
    [data],
  );

  const confirmDelete = () => {
    if (category?.id) {
      deleteCategoryMutate(
        { id: category.id },
        {
          onSuccess: () => {
            setOpenConfirmDelete(false);
          },
        },
      );
    }
  };

  const columns = useMemo(
    () =>
      CategoryColumns({
        onEdit: handleEdit,
        onDelete: handleDelete,
      }),
    [handleEdit, handleDelete],
  );

  const handleExportCsv = () => {
    exportTableToCsv(filteredCategories, columns, "categories");
  };

  const handleDownloadPdf = () => {
    exportTableToPdf(
      filteredCategories,
      columns,
      "categories",
      "Categories List",
    );
  };

  const handlePrintPdf = () => {
    printTable("Categories List");
  };

  if (!canRead) return <AccessDenied resource="categories" showBackButton />;

  return (
    <>
      <div className="space-y-4">
        {/* Top Header */}
        <PageHeader
          title="Categories"
          featureName="Category"
          onCreate={canCreate ? () => {
            setCategory(null);
            setOpen(true);
          } : undefined}
          hideButton={!canCreate}
        />

        {/* Main Card with Toolbar & Table */}
        <div className="rounded-2xl border border-border/60 bg-card shadow-2xs overflow-hidden">
          {/* Toolbar row with Search, Filter+, Columns, Print, CSV */}
          <div className="p-4 border-b border-border/60">
            <PageFilter
              search={search}
              onSearchChange={setSearch}
              searchPlaceholder="Search categories..."
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
                data={filteredCategories}
                columnVisibility={columnVisibility}
                onColumnVisibilityChange={setColumnVisibility}
                pagination={{
                  currentPage: page,
                  pageSize: size,
                  totalElements:
                    data?.payload?.pagination?.totalElements ||
                    filteredCategories.length,
                  totalPages: data?.payload?.pagination?.totalPages || 1,
                  onPageChange: setPage,
                  onPageSizeChange: setSize,
                }}
              />
            </QueryBoundary>
          </div>
        </div>
      </div>

      <FormCategory open={open} setOpen={setOpen} category={category} />

      <ConfirmDelete
        isOpen={openConfirmDelete}
        setIsOpen={setOpenConfirmDelete}
        entityName={"Category"}
        confirmDelete={confirmDelete}
      />
    </>
  );
};

export default CategoryPage;
