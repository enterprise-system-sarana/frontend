import { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
import type { ProductResponse } from "@/types/product/Product";
import { useProduct } from "@/hooks/product/useProduct";
import { Status } from "@/types/enum/status";
import { ProductColumns } from "./ProductColumn";
import { ProductDetailModal } from "./ProductDetailModal";
import { ROUTERS } from "@/constants/Route";
import { toast } from "sonner";
import { useModel } from "@/hooks/product/useModel";
import type { ModelResponse } from "@/types/product/Model";
import { useBrand } from "@/hooks/product/useBrand";
import type { BrandResponse } from "@/types/product/Brand";
import { useCategory } from "@/hooks/product/useCategory";
import type { CategoryResponse } from "@/types/product/Category";
import { useLanguage } from "@/i18n/LanguageContext";
import { usePermission } from "@/utils/UsePermission";
import { PERMISSION } from "@/constants/Permission";
import { AccessDenied } from "@/components/ui/access-denied";

export const ProductPage = () => {
  const { Can } = usePermission();
  const canCreate = Can(PERMISSION.PRODUCT.CREATE);
  const canRead = Can(PERMISSION.PRODUCT.READ);
  const canUpdate = Can(PERMISSION.PRODUCT.UPDATE);
  const canDelete = Can(PERMISSION.PRODUCT.DELETE);

  const navigate = useNavigate();
  const { t } = useLanguage();
  const [selectedProduct, setSelectedProduct] =
    useState<ProductResponse | null>(null);
  const [viewingProduct, setViewingProduct] =
    useState<ProductResponse | null>(null);
  const [openDetailModal, setOpenDetailModal] = useState(false);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [search, setSearch] = useState("");
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [openConfirmDelete, setOpenConfirmDelete] = useState(false);

  // Reset pagination on search change
  useEffect(() => {
    setPage(1);
  }, [search]);

  const { data, isError, isLoading } = useProduct.useGetAllProduct({
    page,
    size,
    status: filterValues.status as Status,
    categoryId: filterValues.categoryId
      ? Number(filterValues.categoryId)
      : undefined,
    brandId: filterValues.brandId
      ? Number(filterValues.brandId)
      : undefined,
    modelId: filterValues.modelId ? Number(filterValues.modelId) : undefined,
  });

  const { mutate: deleteProductMutate } = useProduct.useDeleteProduct();

  // Fetch categories & brands for filter dropdowns
  const { data: categoryData } = useCategory.useGetAllCategory({
    page: 1,
    size: 100,
  });

  const { data: brandData } = useBrand.useGetAllBrand({
    page: 1,
    size: 100,
  });

  // Fetch models filtered by selected category & brand (cascading filter)
  const { data: modelData } = useModel.GetAllModel({
    page: 1,
    size: 100,
    categoryId: filterValues.categoryId
      ? Number(filterValues.categoryId)
      : undefined,
    brandId: filterValues.brandId
      ? Number(filterValues.brandId)
      : undefined,
  });

  // Filter Groups
  const filterGroups: FilterGroup[] = useMemo(() => {
    const groups: FilterGroup[] = [
      {
        key: "status",
        label: t("common.status"),
        options: [
          { label: t("common.active"), value: Status.ACTIVE },
          { label: t("common.inactive"), value: Status.INACTIVE },
        ],
      },
    ];

    // Category filter
    if (categoryData?.payload?.data && categoryData.payload.data.length > 0) {
      groups.push({
        key: "categoryId",
        label: t("product.category"),
        options: categoryData.payload.data.map((c: CategoryResponse) => ({
          label: c.name,
          value: String(c.id),
        })),
      });
    }

    // Brand filter
    if (brandData?.payload?.data && brandData.payload.data.length > 0) {
      groups.push({
        key: "brandId",
        label: t("product.brand"),
        options: brandData.payload.data.map((b: BrandResponse) => ({
          label: b.name,
          value: String(b.id),
        })),
      });
    }

    // Model filter (already filtered by selected category/brand via API)
    if (modelData?.payload?.data && modelData.payload.data.length > 0) {
      groups.push({
        key: "modelId",
        label: t("product.model"),
        options: modelData.payload.data.map((m: ModelResponse) => ({
          label: m.name,
          value: String(m.id),
        })),
      });
    }

    return groups;
  }, [categoryData, brandData, modelData, t]);

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

      // Cascading clear: when category or brand changes, reset model selection
      // because the available models depend on the selected category/brand
      if (key === "categoryId" || key === "brandId") {
        delete next["modelId"];
      }

      return next;
    });
    setPage(1);
  };

  const handleReset = () => {
    setSearch("");
    setFilterValues({});
    setPage(1);
  };

  const productList: ProductResponse[] = data?.payload?.data || [];

  const searchedProducts = useSearch<ProductResponse>(productList, search, [
    "code",
    "modelId",
  ]);

  const filteredProducts = useMemo(() => {
    return searchedProducts.filter((item) => {
      if (filterValues.status && item.status !== filterValues.status) {
        return false;
      }
      if (
        filterValues.categoryId &&
        String(item.categoryId) !== filterValues.categoryId
      ) {
        return false;
      }
      if (
        filterValues.brandId &&
        String(item.brandId) !== filterValues.brandId
      ) {
        return false;
      }
      if (
        filterValues.modelId &&
        String(item.modelId) !== filterValues.modelId
      ) {
        return false;
      }
      return true;
    });
  }, [searchedProducts, filterValues]);

  const handleCreate = () => {
    navigate(ROUTERS.PRODUCT_CREATE);
  };

  const handleView = (product: ProductResponse) => {
    setViewingProduct(product);
    setOpenDetailModal(true);
  };

  const handleEdit = (product: ProductResponse) => {
    if (!canUpdate) return;
    navigate(ROUTERS.PRODUCT_EDIT.replace(":id", String(product.id)));
  };

  const handleDelete = (id: number) => {
    if (!canDelete) return;
    const selected = productList.find((p) => p.id === id);
    if (selected) {
      setSelectedProduct(selected);
      setOpenConfirmDelete(true);
    }
  };

  const confirmDelete = () => {
    if (selectedProduct?.id) {
      deleteProductMutate(
        { id: selectedProduct.id },
        {
          onSuccess: () => {
            toast.success(t("product.delete_success"));
            setOpenConfirmDelete(false);
            setSelectedProduct(null);
          },
        },
      );
    }
  };

  const columns = useMemo(
    () =>
      ProductColumns({
        onView: handleView,
        onEdit: handleEdit,
        onDelete: handleDelete,
        t,
      }),
    [productList, t],
  );

  const handleExportCsv = () => {
    exportTableToCsv(filteredProducts, columns, "products");
  };

  const handleDownloadPdf = () => {
    exportTableToPdf(filteredProducts, columns, "products", "Products List");
  };

  const handlePrintPdf = () => {
    printTable("Products List");
  };

  if (!canRead) return <AccessDenied resource="products" showBackButton />;

  return (
    <>
      <div className="space-y-4">
        {/* Top Header */}
        <PageHeader
          title={t("product.title")}
          featureName={t("nav.product")}
          onCreate={canCreate ? handleCreate : undefined}
          hideButton={!canCreate}
        />

        {/* Main Card with Toolbar & Table */}
        <div className="rounded-2xl border border-border/60 bg-card shadow-2xs overflow-hidden">
          {/* Toolbar row with Search, Filter+, Columns, Print, CSV */}
          <div className="p-4 border-b border-border/60">
            <PageFilter
              search={search}
              onSearchChange={setSearch}
              searchPlaceholder="Search products by code, notes..."
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
                data={filteredProducts}
                columnVisibility={columnVisibility}
                onColumnVisibilityChange={setColumnVisibility}
                pagination={{
                  currentPage: page,
                  pageSize: size,
                  totalElements:
                    data?.payload?.pagination?.totalElements ||
                    filteredProducts.length,
                  totalPages: data?.payload?.pagination?.totalPages || 1,
                  onPageChange: setPage,
                  onPageSizeChange: setSize,
                }}
              />
            </QueryBoundary>
          </div>
        </div>
      </div>

      <ProductDetailModal
        productId={viewingProduct?.id ?? null}
        initialProduct={viewingProduct}
        open={openDetailModal}
        onOpenChange={setOpenDetailModal}
        onEdit={handleEdit}
      />

      <ConfirmDelete
        isOpen={openConfirmDelete}
        setIsOpen={setOpenConfirmDelete}
        entityName={`Product "${selectedProduct?.code || ""}"`}
        confirmDelete={confirmDelete}
      />
    </>
  );
};

export default ProductPage;
