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
    isValidId
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
          toast.success(t("product.delete_success") || "Product deleted successfully");
          setOpenConfirmDelete(false);
          navigate(ROUTERS.PRODUCT);
        },
        onError: (err: any) => {
          toast.error(
            err?.response?.data?.message ||
              t("product.delete_failed") ||
              "Failed to delete product"
          );
        },
      }
    );
  };

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
        <div className="flex items-center justify-between pb-3 border-b border-border/60">
          <div className="h-9 w-48 bg-muted rounded-md" />
          <div className="flex gap-2">
            <div className="h-9 w-20 bg-muted rounded-md" />
            <div className="h-9 w-20 bg-muted rounded-md" />
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="h-80 bg-muted rounded-md lg:col-span-1" />
          <div className="h-80 bg-muted rounded-md lg:col-span-2" />
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

  return (
    <>
      <div className="space-y-6 w-full pb-16">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/60">
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => navigate(ROUTERS.PRODUCT)}
              className="h-9 w-9 rounded-md border-border/60 hover:bg-muted/60"
              title={t("common.back") || "Back"}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl font-bold tracking-tight text-foreground">
                  {product.modelName || product.code}
                </h1>
                <StatusBadge status={product.status} />
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5">
                <Barcode className="h-3.5 w-3.5" />
                Product Code: <span className="font-mono font-medium text-foreground">{product.code}</span>
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <Button
              variant="outline"
              onClick={() => navigate(`/product/edit/${product.id}`)}
              className="rounded-md gap-1.5"
            >
              <Pencil className="h-4 w-4" />
              {t("common.edit") || "Edit"}
            </Button>
            <Button
              variant="destructive"
              onClick={() => setOpenConfirmDelete(true)}
              className="rounded-md gap-1.5"
            >
              <Trash2 className="h-4 w-4" />
              {t("common.delete") || "Delete"}
            </Button>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Product Image & Media */}
          <div className="space-y-6 lg:col-span-1">
            <Card className="rounded-md border-border/60 shadow-xs overflow-hidden">
              <CardHeader className="pb-3 border-b border-border/40 bg-muted/20">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Package className="h-4 w-4 text-primary" />
                  Product Media
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 flex flex-col items-center justify-center text-center">
                <div className="w-full flex justify-center py-2">
                  <ImageCell
                    fileName={product.imageUrl}
                    name={product.code}
                    bucketName="product"
                    className="h-56 w-56 rounded-md shadow-xs"
                    aspectRatio="square"
                  />
                </div>
                <div className="mt-4 w-full pt-4 border-t border-border/40 text-left space-y-2 text-xs">
                  <div className="flex justify-between py-1">
                    <span className="text-muted-foreground">Image File</span>
                    <span className="font-mono text-foreground truncate max-w-[160px]">
                      {product.imageUrl || "No image uploaded"}
                    </span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-muted-foreground">Product ID</span>
                    <span className="font-semibold text-foreground">#{product.id}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Metrics / Reorder Alert */}
            <Card className="rounded-md border-border/60 shadow-xs">
              <CardHeader className="pb-3 border-b border-border/40 bg-muted/20">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  Inventory Threshold
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5 space-y-3 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Reorder Level</span>
                  <Badge variant="outline" className="font-mono text-xs font-semibold px-2.5 py-0.5">
                    {product.reorderLevel ?? 0} units
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  When stock falls at or below {product.reorderLevel ?? 0} units, replenishment alerts will trigger automatically.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Specifications & Variant Values */}
          <div className="space-y-6 lg:col-span-2">
            {/* Primary Details Card */}
            <Card className="rounded-md border-border/60 shadow-xs">
              <CardHeader className="pb-3 border-b border-border/40 bg-muted/20">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Layers className="h-4 w-4 text-primary" />
                  General Information
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5 text-sm">
                  <div className="space-y-1">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                      <Barcode className="h-3.5 w-3.5 text-muted-foreground" />
                      Product Code
                    </span>
                    <div className="font-mono font-semibold text-base text-foreground">
                      {product.code || "-"}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                      <Bookmark className="h-3.5 w-3.5 text-muted-foreground" />
                      Model
                    </span>
                    <div className="font-semibold text-base text-foreground">
                      {product.modelName || "-"}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                      <Tag className="h-3.5 w-3.5 text-muted-foreground" />
                      Category
                    </span>
                    <div className="font-medium text-foreground">
                      {product.categoryName || "-"}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                      <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                      Brand
                    </span>
                    <div className="font-medium text-foreground">
                      {product.brandName || "-"}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                      Created Date
                    </span>
                    <div className="text-foreground">
                      {product.createdAt ? formatDate(product.createdAt) : "-"}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                      Last Updated
                    </span>
                    <div className="text-foreground">
                      {product.updatedAt ? formatDate(product.updatedAt) : "-"}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Product Variants Card */}
            <Card className="rounded-md border-border/60 shadow-xs">
              <CardHeader className="pb-3 border-b border-border/40 bg-muted/20">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Product Variants & Options
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {product.variantValues && product.variantValues.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {product.variantValues.map((v) => (
                      <div
                        key={v.id}
                        className="flex items-center justify-between p-3 rounded-md border border-border/60 bg-card/60 hover:bg-muted/30 transition-colors"
                      >
                        <div>
                          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                            {v.variantTypeName || "Variant"}
                          </span>
                          <span className="text-sm font-medium text-foreground">
                            {v.name}
                          </span>
                        </div>
                        {v.code && (
                          <Badge variant="secondary" className="font-mono text-[11px]">
                            {v.code}
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-muted-foreground text-sm">
                    No variant attributes assigned to this product.
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Notes & Remarks Card */}
            <Card className="rounded-md border-border/60 shadow-xs">
              <CardHeader className="pb-3 border-b border-border/40 bg-muted/20">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" />
                  Notes & Remarks
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap">
                  {product.noted?.trim() || "No additional notes or description provided for this product."}
                </p>
              </CardContent>
            </Card>
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
