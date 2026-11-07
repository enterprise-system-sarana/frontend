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
import { useLanguage } from "@/i18n/LanguageContext";
import { toast } from "sonner";

const CategoryPage = () => {
  const { t } = useLanguage();
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
    status:
      filterValues.status && filterValues.status !== "all"
        ? (filterValues.status as Status)
        : undefined,
  });

  const { mutate: deleteCategoryMutate } = useCategory.useDeleteCategory();
  const { mutate: updateCategoryMutate } = useCategory.useUpdateCategory();

  // Filter Groups for Filter +
  const filterGroups: FilterGroup[] = useMemo(
    () => [
      {
        key: "status",
        label: t("common.status", "Status"),
        options: [
          { label: t("common.active", "Active"), value: Status.ACTIVE },
          { label: t("common.inactive", "Inactive"), value: Status.INACTIVE },
        ],
      },
    ],
    [t],
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
      if (!value || value === "all") {
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

  const handleRestore = useCallback(
    (c: CategoryResponse) => {
      updateCategoryMutate(
        {
          id: c.id,
          req: {
            code: c.code,
            name: c.name,
            imageUrl: c.imageUrl,
            status: Status.ACTIVE,
          },
        },
        {
          onSuccess: () => {
            toast.success(t("common.save", "Saved successfully"));
          },
        },
      );
    },
    [updateCategoryMutate, t],
  );

  const columns = useMemo(
    () =>
      CategoryColumns({
        onEdit: handleEdit,
        onDelete: handleDelete,
        onRestore: handleRestore,
        t,
      }),
    [handleEdit, handleDelete, handleRestore, t],
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
          title={t("nav.category")}
          featureName={t("common.category")}
          onCreate={canCreate ? () => {
            setCategory(null);
            setOpen(true);
          } : undefined}
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
