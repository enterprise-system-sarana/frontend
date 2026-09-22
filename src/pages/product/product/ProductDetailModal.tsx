import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useProduct } from "@/hooks/product/useProduct";
import { useProductSerial } from "@/hooks/product/useProductSerial";
import type { ProductResponse } from "@/types/product/Product";
import { ROUTERS } from "@/constants/Route";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { ImageCell } from "@/components/file/ImageCell";
import { formatDate } from "@/utils/formatDate";
import { useLanguage } from "@/i18n/LanguageContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Barcode,
  Pencil,
  Search,
  Copy,
  Check,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";

interface ProductDetailModalProps {
  productId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit?: (product: ProductResponse) => void;
  initialProduct?: ProductResponse | null;
}

export const ProductDetailModal = ({
  productId,
  open,
  onOpenChange,
  onEdit,
  initialProduct,
}: ProductDetailModalProps) => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const [serialSearch, setSerialSearch] = useState("");
  const [serialStatusFilter, setSerialStatusFilter] = useState("ALL");
  const [copiedSerial, setCopiedSerial] = useState<string | null>(null);

  const validId = productId ?? initialProduct?.id ?? 0;
  const isQueryEnabled = open && Boolean(validId && validId > 0);

  const { data, isLoading, isError } = useProduct.useGetProductById(
    validId,
    isQueryEnabled,
  );

  const { data: serialsData, isLoading: isLoadingSerials } =
    useProductSerial.useGetAllProductSerial(
      { productId: validId, size: 1000 },
      { enabled: isQueryEnabled },
    );

  const product: ProductResponse | undefined =
    data?.payload?.data ||
    data?.payload ||
    data?.data ||
    initialProduct ||
    undefined;

  const formatPrice = (value?: number) =>
    value == null
      ? "$0.00"
      : `$${Number(value).toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;

  // Normalized serial numbers
  const allSerials = useMemo(() => {
    const listFromApi =
      (serialsData as any)?.payload?.data ??
      (serialsData as any)?.payload?.content ??
      (serialsData as any)?.payload?.items ??
      (serialsData as any)?.payload ??
      (serialsData as any)?.data ??
      [];

    const apiSerials = Array.isArray(listFromApi) ? listFromApi : [];
    const productSerials = Array.isArray(product?.serials) ? product.serials : [];
    const source = apiSerials.length > 0 ? apiSerials : productSerials;

    return source.map((s: any, idx: number) => {
      const serialNum =
        s.serialNumber ??
        s.serial_number ??
        s.barcode ??
        s.barCode ??
        `SN-${s.id ?? idx + 1}`;

      const barcodeVal = s.barcode ?? s.barCode ?? s.serialNumber ?? "-";
      const qty = Number(s.quantity) || 1;
      const cost = s.costPrice ?? s.cost ?? product?.costPrice;
      const price = s.sellingPrice ?? s.price ?? product?.salePrice;
      const statusVal = String(s.status ?? "AVAILABLE").toUpperCase();
      const store = s.storeName ?? s.store?.name ?? "-";

      return {
        id: s.id ?? idx + 1,
        serialNumber: String(serialNum),
        barcode: String(barcodeVal),
        quantity: qty,
        costPrice: cost,
        sellingPrice: price,
        status: statusVal,
        storeName: store,
      };
    });
  }, [serialsData, product]);

  const totalQuantity = useMemo(() => {
    if (allSerials.length > 0) {
      return allSerials.reduce((acc, s) => acc + s.quantity, 0);
    }
    return product?.quantity ?? 0;
  }, [allSerials, product]);

  const availableCount = useMemo(() => {
    if (allSerials.length > 0) {
      return allSerials
        .filter((s) => s.status === "AVAILABLE")
        .reduce((acc, s) => acc + s.quantity, 0);
    }
    return product?.availableSerials ?? 0;
  }, [allSerials, product]);

  const filteredSerials = useMemo(() => {
    return allSerials.filter((s) => {
      if (serialStatusFilter !== "ALL" && s.status !== serialStatusFilter) {
        return false;
      }
      if (serialSearch.trim()) {
        const query = serialSearch.toLowerCase();
        return (
          s.serialNumber.toLowerCase().includes(query) ||
          s.barcode.toLowerCase().includes(query) ||
          s.storeName.toLowerCase().includes(query)
        );
      }
      return true;
    });
  }, [allSerials, serialSearch, serialStatusFilter]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSerial(text);
    toast.success(`Copied: ${text}`);
    setTimeout(() => setCopiedSerial(null), 2000);
  };

  const handleEditClick = () => {
    onOpenChange(false);
    if (product) {
      if (onEdit) {
        onEdit(product);
      } else {
        navigate(ROUTERS.PRODUCT_EDIT.replace(":id", String(product.id)));
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[88vh] flex flex-col p-0 gap-0 rounded-2xl border border-border/60 shadow-2xl overflow-hidden bg-background">
        {/* Header */}
        <DialogHeader className="px-6 py-4 border-b border-border/60 bg-muted/20 shrink-0">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0 space-y-1">
              <div className="flex items-center gap-2">
                <DialogTitle className="text-xl font-bold tracking-tight text-foreground truncate">
                  {product?.name || product?.modelName || product?.code || "Product Details"}
                </DialogTitle>
                {product?.status && <StatusBadge status={product.status} />}
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                {product?.code && (
                  <span className="font-mono bg-muted/60 px-2 py-0.5 rounded text-foreground font-medium border border-border/40">
                    {product.code}
                  </span>
                )}
                {product?.categoryName && <span>• {product.categoryName}</span>}
                {product?.id && <span>• ID #{product.id}</span>}
              </div>
            </div>
          </div>
        </DialogHeader>

        {/* Body */}
        {isLoading && !product ? (
          <div className="p-6 space-y-4 animate-pulse flex-1">
            <div className="h-20 bg-muted/60 rounded-xl" />
            <div className="h-44 bg-muted/60 rounded-xl" />
          </div>
        ) : isError && !product ? (
          <div className="p-10 text-center text-muted-foreground flex-1">
            <AlertTriangle className="h-10 w-10 text-destructive mx-auto mb-2" />
            <p className="text-base font-semibold">Failed to load product details</p>
            <p className="text-xs mt-1">Please try again or close this dialog.</p>
          </div>
        ) : product ? (
          <div className="p-6 space-y-5 overflow-y-auto flex-1">
            {/* Top Overview Bar */}
            <div className="p-4 rounded-xl border border-border/60 bg-muted/20 flex flex-col sm:flex-row items-start sm:items-center gap-4">
              {/* Product Thumbnail */}
              <div className="h-20 w-20 rounded-xl overflow-hidden border border-border/50 bg-background shrink-0 flex items-center justify-center shadow-xs">
                <ImageCell
                  fileName={product.imageUrl}
                  name={product.code || product.name}
                  bucketName="product"
                  className="h-full w-full object-cover"
                  aspectRatio="square"
                />
              </div>

              {/* 4 Essential Metrics */}
              <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-3 w-full">
                <div>
                  <span className="text-[11px] text-muted-foreground block font-medium">Sale Price</span>
                  <span className="text-base font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                    {formatPrice(product.salePrice)}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-muted-foreground block font-medium">Cost Price</span>
                  <span className="text-base font-bold text-foreground tabular-nums">
                    {formatPrice(product.costPrice)}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-muted-foreground block font-medium">Total Quantity</span>
                  <span className="text-base font-bold text-foreground tabular-nums">
                    {totalQuantity} <span className="text-xs font-normal text-muted-foreground">units</span>
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-muted-foreground block font-medium">Available</span>
                  <span className="inline-flex items-center text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md mt-0.5 border border-emerald-500/20">
                    {availableCount} ready
                  </span>
                </div>
              </div>
            </div>

            {/* Meta Tags Row */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              {product.modelName && (
                <span className="px-2.5 py-1 rounded-lg bg-muted/50 border border-border/50 text-foreground">
                  <span className="text-muted-foreground">Model:</span> <strong>{product.modelName}</strong>
                </span>
              )}
              {product.categoryName && (
                <span className="px-2.5 py-1 rounded-lg bg-muted/50 border border-border/50 text-foreground">
                  <span className="text-muted-foreground">Category:</span> <strong>{product.categoryName}</strong>
                </span>
              )}
              {product.brandName && (
                <span className="px-2.5 py-1 rounded-lg bg-muted/50 border border-border/50 text-foreground">
                  <span className="text-muted-foreground">Brand:</span> <strong>{product.brandName}</strong>
                </span>
              )}
              {product.reorderLevel != null && (
                <span className="px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400">
                  <span className="text-amber-600/70">Reorder Alert:</span> <strong>{product.reorderLevel} units</strong>
                </span>
              )}
              {product.createdAt && (
                <span className="px-2.5 py-1 rounded-lg bg-muted/50 border border-border/50 text-muted-foreground ml-auto">
                  Created: {formatDate(product.createdAt)}
                </span>
              )}
            </div>

            {/* Variant Values */}
            {product.variantValues && product.variantValues.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                <span className="text-muted-foreground mr-1">Variants:</span>
                {product.variantValues.map((v) => (
                  <span key={v.id} className="px-2.5 py-0.5 rounded-md bg-muted/60 border border-border/50 font-medium">
                    {v.variantTypeName ? `${v.variantTypeName}: ` : ""}{v.name}
                  </span>
                ))}
              </div>
            )}

            {/* Notes */}
            {product.noted && (
              <p className="text-xs text-muted-foreground bg-muted/30 p-2.5 rounded-lg border border-border/40 whitespace-pre-wrap">
                {product.noted}
              </p>
            )}

            {/* Serials Table Section */}
            <div className="space-y-2.5 pt-1">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                    <Barcode className="h-4 w-4 text-primary" />
                    Serials & Barcodes
                  </h4>
                  <Badge variant="secondary" className="font-mono text-xs px-2 py-0">
                    {filteredSerials.length} of {allSerials.length}
                  </Badge>
                </div>

                {allSerials.length > 0 && (
                  <div className="flex items-center gap-2">
                    <div className="relative w-44 sm:w-56">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                      <Input
                        placeholder="Search serial, barcode..."
                        value={serialSearch}
                        onChange={(e) => setSerialSearch(e.target.value)}
                        className="h-8 pl-8 text-xs rounded-lg border-border/60"
                      />
                    </div>
                    <div className="flex items-center gap-1">
                      {["ALL", "AVAILABLE", "SOLD"].map((st) => (
                        <button
                          key={st}
                          type="button"
                          onClick={() => setSerialStatusFilter(st)}
                          className={`px-2 py-1 text-[11px] rounded-md font-medium transition cursor-pointer ${serialStatusFilter === st
                              ? "bg-primary text-primary-foreground font-semibold"
                              : "bg-muted hover:bg-muted/80 text-muted-foreground"
                            }`}
                        >
                          {st}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Table */}
              <div className="rounded-xl border border-border/60 overflow-hidden bg-card">
                {isLoadingSerials && allSerials.length === 0 ? (
                  <div className="p-8 text-center text-xs text-muted-foreground animate-pulse">
                    Loading serial numbers...
                  </div>
                ) : (
                  <div className="overflow-x-auto max-h-[280px] overflow-y-auto">
                    <table className="w-full text-left text-xs whitespace-nowrap">
                      <thead className="bg-muted/60 border-b border-border/60 text-muted-foreground font-semibold sticky top-0 z-10 backdrop-blur-md">
                        <tr>
                          <th className="py-2 px-3 w-8 text-center">#</th>
                          <th className="py-2 px-3">Serial Number</th>
                          <th className="py-2 px-3">Barcode</th>
                          <th className="py-2 px-3">Store</th>
                          <th className="py-2 px-3 text-center">Qty</th>
                          <th className="py-2 px-3 text-right">Cost</th>
                          <th className="py-2 px-3 text-right">Price</th>
                          <th className="py-2 px-3 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/40">
                        {filteredSerials.length > 0 ? (
                          filteredSerials.map((s, idx) => (
                            <tr key={s.id ?? idx} className="hover:bg-muted/30 transition-colors group">
                              <td className="py-2 px-3 text-center text-muted-foreground font-mono text-[11px]">
                                {idx + 1}
                              </td>
                              <td className="py-2 px-3">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-mono font-bold text-primary">{s.serialNumber}</span>
                                  <button
                                    type="button"
                                    onClick={() => copyToClipboard(s.serialNumber)}
                                    className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground p-0.5 transition cursor-pointer"
                                    title="Copy serial"
                                  >
                                    {copiedSerial === s.serialNumber ? (
                                      <Check className="h-3 w-3 text-emerald-500" />
                                    ) : (
                                      <Copy className="h-3 w-3" />
                                    )}
                                  </button>
                                </div>
                              </td>
                              <td className="py-2 px-3 font-mono text-muted-foreground text-[11px]">{s.barcode}</td>
                              <td className="py-2 px-3 text-muted-foreground">{s.storeName}</td>
                              <td className="py-2 px-3 text-center font-bold">
                                <span className="inline-block px-2 py-0.5 rounded bg-primary/10 text-primary text-[11px]">
                                  {s.quantity}
                                </span>
                              </td>
                              <td className="py-2 px-3 text-right text-muted-foreground tabular-nums">
                                {formatPrice(s.costPrice)}
                              </td>
                              <td className="py-2 px-3 text-right font-medium text-emerald-600 dark:text-emerald-400 tabular-nums">
                                {formatPrice(s.sellingPrice)}
                              </td>
                              <td className="py-2 px-3 text-center">
                                <StatusBadge status={s.status} />
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={8} className="py-8 text-center text-muted-foreground text-xs">
                              {allSerials.length === 0
                                ? "No serial numbers registered for this product."
                                : "No serial numbers matched your search."}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : null}

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border/60 bg-muted/20 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0 rounded-b-2xl">
          <div className="flex items-center gap-2 text-xs text-muted-foreground w-full sm:w-auto">
            {product && (
              <>
                <span className="font-mono font-medium text-foreground bg-muted/60 px-2 py-0.5 rounded border border-border/40">
                  {product.code}
                </span>
                <span>•</span>
                <span>{totalQuantity} {totalQuantity === 1 ? "unit" : "units"} total</span>
                <span>•</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                  {availableCount} available
                </span>
              </>
            )}
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <Button
              type="button"
              variant="outline"
              size="default"
              onClick={() => onOpenChange(false)}
              className="h-9 px-4 text-xs font-medium rounded-xl border-border/60 hover:bg-muted transition cursor-pointer"
            >
              Close
            </Button>

            {product && (
              <Button
                type="button"
                size="default"
                onClick={handleEditClick}
                className="h-9 px-4 gap-2 text-xs font-semibold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm transition cursor-pointer"
              >
                <Pencil className="h-3.5 w-3.5" />
                {t("common.edit") || "Edit Product"}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProductDetailModal;
