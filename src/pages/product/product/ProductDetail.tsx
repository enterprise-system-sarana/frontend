import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useProduct } from "@/hooks/product/useProduct";
import type { ProductResponse } from "@/types/product/Product";
import { ROUTERS } from "@/constants/Route";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { ImageCell } from "@/components/file/ImageCell";
import ConfirmDelete from "@/components/ui/confirmDelete";
import { formatDate } from "@/utils/formatDate";
import { useLanguage } from "@/i18n/LanguageContext";
import { toast } from "sonner";
import {
  ArrowLeft,
  Calendar,
  Layers,
  Package,
  Pencil,
  RotateCcw,
  Sparkles,
  Tag,
  Trash2,
  FileText,
  AlertTriangle,
  Barcode,
  Building2,
  Bookmark,
} from "lucide-react";

export const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [openConfirmDelete, setOpenConfirmDelete] = useState(false);

  const productId = Number(id);
  const isValidId = Boolean(id && !isNaN(productId) && productId > 0);

  const { data, isLoading, isError, refetch } = useProduct.useGetProductById(
    productId,
    isValidId,
  );

  const { mutate: deleteProductMutate, isPending: isDeleting } =
    useProduct.useDeleteProduct();

  const product: ProductResponse | undefined =
    data?.payload?.data || data?.payload || data?.data || data;

  const handleDelete = () => {
    if (!product?.id) return;
    deleteProductMutate(
      { id: product.id },
      {
        onSuccess: () => {
          toast.success(
            t("product.delete_success") || "Product deleted successfully",
          );
          setOpenConfirmDelete(false);
          navigate(ROUTERS.PRODUCT);
        },
        onError: (err: any) => {
          toast.error(
            err?.response?.data?.message ||
              t("product.delete_failed") ||
              "Failed to delete product",
          );
        },
      },
    );
  };

  const formatPrice = (value?: number) =>
    value == null
      ? "-"
      : new Intl.NumberFormat(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(value);

  if (!isValidId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-6">
        <AlertTriangle className="h-12 w-12 text-destructive/80 mb-3" />
        <h2 className="text-xl font-semibold">Invalid Product ID</h2>
        <p className="text-muted-foreground text-sm mt-1 mb-4">
          The requested product identifier is not valid.
        </p>
        <Button variant="outline" onClick={() => navigate(ROUTERS.PRODUCT)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Products
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6 w-full pb-16 animate-pulse">
        <div className="h-24 bg-muted/70 rounded-2xl" />
        <div className="h-16 bg-muted/70 rounded-2xl" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="h-80 bg-muted/70 rounded-2xl lg:col-span-1" />
          <div className="h-80 bg-muted/70 rounded-2xl lg:col-span-2" />
        </div>
      </div>
    );
  }

  if (isError || !product) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-6">
        <Package className="h-12 w-12 text-muted-foreground/60 mb-3" />
        <h2 className="text-xl font-semibold">Product Not Found</h2>
        <p className="text-muted-foreground text-sm mt-1 mb-4">
          Could not find or retrieve details for this product.
        </p>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => refetch()}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Retry
          </Button>
          <Button onClick={() => navigate(ROUTERS.PRODUCT)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Products
          </Button>
        </div>
      </div>
    );
  }

  const infoFields = [
    { label: "Product code", value: product.code, mono: true },
    { label: "Model", value: product.modelName },
    { label: "Category", value: product.categoryName },
    { label: "Brand", value: product.brandName },
    {
      label: "Created",
      value: product.createdAt ? formatDate(product.createdAt) : undefined,
    },
    {
      label: "Last updated",
      value: product.updatedAt ? formatDate(product.updatedAt) : undefined,
    },
  ];

  return (
    <>
      <div className="space-y-5 w-full pb-16">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-border/60 bg-card px-5 py-4 shadow-xs">
          <div className="flex items-center gap-3 min-w-0">
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => navigate(ROUTERS.PRODUCT)}
              className="h-9 w-9 shrink-0 rounded-md border-border/60 hover:bg-muted/60"
              title={t("common.back") || "Back"}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-2xl font-bold tracking-tight text-foreground truncate">
                  {product.modelName || product.code}
                </h1>
                <StatusBadge status={product.status} />
              </div>
              <p className="text-sm text-muted-foreground mt-0.5 flex items-center gap-3">
                <span className="flex items-center gap-1.5">
                  <Barcode className="h-3.5 w-3.5" />
                  <span className="font-mono text-foreground/80">
                    {product.code}
                  </span>
                </span>
                <span>ID #{product.id}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
            <Button
              variant="outline"
              onClick={() => navigate(`/product/edit/${product.id}`)}
              className="rounded-lg gap-1.5"
            >
              <Pencil className="h-4 w-4" />
              {t("common.edit") || "Edit"}
            </Button>
            <Button
              variant="destructive"
              onClick={() => setOpenConfirmDelete(true)}
              className="rounded-lg gap-1.5"
            >
              <Trash2 className="h-4 w-4" />
              {t("common.delete") || "Delete"}
            </Button>
          </div>
        </div>

        {/* Snapshot strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-border/60 rounded-2xl border border-border/60 bg-card shadow-xs overflow-hidden">
          <div className="px-5 py-4">
            <p className="text-xs text-muted-foreground">Sale price</p>
            <p className="mt-1 text-xl font-bold tabular-nums text-foreground">
              {formatPrice(product.salePrice)}
            </p>
          </div>
          <div className="px-5 py-4">
            <p className="text-xs text-muted-foreground">Cost price</p>
            <p className="mt-1 text-xl font-bold tabular-nums text-foreground">
              {formatPrice(product.costPrice)}
            </p>
          </div>
          <div className="px-5 py-4 bg-primary/[0.04]">
            <p className="text-xs text-primary/75">Reorder level</p>
            <p className="mt-1 text-xl font-bold tabular-nums text-primary">
              {product.reorderLevel ?? 0}{" "}
              <span className="text-sm font-medium">units</span>
            </p>
          </div>
        </div>

        {/* Content grid */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          {/* Left column */}
          <div className="space-y-5 lg:col-span-1">
            <Card className="rounded-2xl border-border/60 shadow-xs overflow-hidden py-0 gap-0">
              <CardContent className="p-6 flex flex-col items-center text-center">
                <ImageCell
                  fileName={product.imageUrl}
                  name={product.code}
                  bucketName="product"
                  className="h-52 w-52 rounded-xl shadow-xs"
                  aspectRatio="square"
                />
                <p className="mt-3 text-xs text-muted-foreground truncate max-w-full">
                  {product.imageUrl || "No image uploaded"}
                </p>
              </CardContent>
            </Card>

            <div className="rounded-2xl border border-border/60 bg-card shadow-xs p-5">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    Reorder at {product.reorderLevel ?? 0} units
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    Replenishment alerts trigger automatically once stock falls
                    at or below this level.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right column */}
          <div className="space-y-5 lg:col-span-2">
            <Card className="rounded-2xl border-border/60 shadow-xs">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2 text-foreground/90">
                  <Layers className="h-4 w-4 text-primary" />
                  General information
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 text-sm">
                  {infoFields.map((f) => (
                    <div
                      key={f.label}
                      className="flex justify-between sm:block border-b sm:border-0 border-border/40 pb-2 sm:pb-0"
                    >
                      <span className="text-muted-foreground">{f.label}</span>
                      <div
                        className={`sm:mt-0.5 font-medium text-foreground text-right sm:text-left ${
                          f.mono ? "font-mono" : ""
                        }`}
                      >
                        {f.value || "-"}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-border/60 shadow-xs">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2 text-foreground/90">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Variants & options
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-2">
                {product.variantValues && product.variantValues.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {product.variantValues.map((v) => (
                      <div
                        key={v.id}
                        className="flex items-center gap-1.5 rounded-full border border-border/60 bg-muted/30 pl-3 pr-2 py-1 text-sm"
                      >
                        <span className="text-muted-foreground">
                          {v.variantTypeName || "Variant"}:
                        </span>
                        <span className="font-medium text-foreground">
                          {v.name}
                        </span>
                        {v.code && (
                          <Badge
                            variant="secondary"
                            className="font-mono text-[10px] px-1.5 py-0"
                          >
                            {v.code}
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground py-2">
                    No variant attributes assigned to this product.
                  </p>
                )}
              </CardContent>
            </Card>

            <div className="rounded-2xl border-l-4 border-border bg-muted/20 px-5 py-4">
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                <FileText className="h-3.5 w-3.5" />
                Notes
              </div>
              <p
                className={`text-sm leading-relaxed whitespace-pre-wrap ${
                  product.noted?.trim()
                    ? "text-foreground/90"
                    : "text-muted-foreground italic"
                }`}
              >
                {product.noted?.trim() ||
                  "No additional notes or description provided for this product."}
              </p>
            </div>
          </div>
        </div>
      </div>

      <ConfirmDelete
        isOpen={openConfirmDelete}
        setIsOpen={setOpenConfirmDelete}
        entityName={`Product "${product.code}"`}
        confirmDelete={handleDelete}
        isLoading={isDeleting}
      />
    </>
  );
};

export default ProductDetail;
