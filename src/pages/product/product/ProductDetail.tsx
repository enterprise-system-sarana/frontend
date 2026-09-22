import { useParams, useNavigate } from "react-router-dom";
import { useState, useMemo } from "react";
import { useProduct } from "@/hooks/product/useProduct";
import { useProductSerial } from "@/hooks/product/useProductSerial";
import type { ProductResponse } from "@/types/product/Product";
import { ROUTERS } from "@/constants/Route";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { ImageCell } from "@/components/file/ImageCell";
import { Input } from "@/components/ui/input";
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
  TrendingUp,
  Search,
  Copy,
  Check,
  Store,
} from "lucide-react";

export const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [openConfirmDelete, setOpenConfirmDelete] = useState(false);
  const [serialSearch, setSerialSearch] = useState("");
  const [serialStatusFilter, setSerialStatusFilter] = useState("ALL");
  const [copiedSerial, setCopiedSerial] = useState<string | null>(null);

  const productId = Number(id);
  const isValidId = Boolean(id && !isNaN(productId) && productId > 0);

  const { data, isLoading, isError, refetch } = useProduct.useGetProductById(
    productId,
    isValidId,
  );

  const { data: serialsData, isLoading: isLoadingSerials } =
    useProductSerial.useGetAllProductSerial(
      { productId, size: 1000 },
      { enabled: isValidId },
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
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-6 animate-in fade-in zoom-in duration-500">
        <div className="h-20 w-20 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
          <AlertTriangle className="h-10 w-10 text-destructive" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">Invalid Product ID</h2>
        <p className="text-muted-foreground mt-2 mb-6 max-w-sm">
          The requested product identifier is not valid or could not be parsed.
        </p>
        <Button variant="default" onClick={() => navigate(ROUTERS.PRODUCT)} className="rounded-full px-6 shadow-md hover:shadow-lg transition-all">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Products
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6 w-full pb-16 animate-pulse">
        <div className="h-28 bg-muted/60 rounded-3xl" />
        <div className="h-24 bg-muted/60 rounded-3xl" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="h-[400px] bg-muted/60 rounded-3xl lg:col-span-1" />
          <div className="h-[400px] bg-muted/60 rounded-3xl lg:col-span-2" />
        </div>
      </div>
    );
  }

  if (isError || !product) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-6 animate-in fade-in zoom-in duration-500">
        <div className="h-20 w-20 rounded-full bg-muted/30 flex items-center justify-center mb-4 border border-border/50">
          <Package className="h-10 w-10 text-muted-foreground" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">Product Not Found</h2>
        <p className="text-muted-foreground mt-2 mb-6 max-w-sm">
          We couldn't find the details for this product. It may have been deleted or there is a network issue.
        </p>
        <div className="flex gap-4">
          <Button variant="outline" onClick={() => refetch()} className="rounded-full shadow-sm hover:bg-muted/50 transition-all">
            <RotateCcw className="h-4 w-4 mr-2" />
            Retry Connection
          </Button>
          <Button onClick={() => navigate(ROUTERS.PRODUCT)} className="rounded-full shadow-md hover:shadow-lg transition-all">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Products
          </Button>
        </div>
      </div>
    );
  }

  const infoFields = [
    { label: "Product Name", value: product.name || product.modelName },
    { label: "Product Code", value: product.code, mono: true },
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

      const barcodeVal =
        s.barcode ??
        s.barCode ??
        s.serialNumber ??
        "-";

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

  const soldCount = useMemo(() => {
    return allSerials
      .filter((s) => s.status === "SOLD")
      .reduce((acc, s) => acc + s.quantity, 0);
  }, [allSerials]);

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

  return (
    <>
      <div className="space-y-6 w-full pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* Dynamic Header */}
        <div className="relative overflow-hidden rounded-3xl border border-border/50 bg-background shadow-lg group">
          {/* Subtle gradient background effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 opacity-50 pointer-events-none" />
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-emerald-500 to-blue-500" />
          
          <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-6 px-6 py-8 sm:px-8">
            <div className="flex items-start sm:items-center gap-5 min-w-0">
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => navigate(ROUTERS.PRODUCT)}
                className="h-11 w-11 shrink-0 rounded-xl border-border/60 hover:bg-muted/80 hover:scale-105 transition-all shadow-sm"
                title={t("common.back") || "Back"}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="min-w-0 space-y-1.5">
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground truncate drop-shadow-sm">
                    {product.name || product.modelName || product.code}
                  </h1>
                  <div className="mt-1 sm:mt-0">
                    <StatusBadge status={product.status} />
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground font-medium">
                  {product.code && (
                    <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-muted/40 border border-border/50 transition-colors hover:bg-muted/60">
                      <Barcode className="h-4 w-4 text-primary" />
                      <span className="font-mono tracking-wider text-foreground">
                        {product.code}
                      </span>
                    </span>
                  )}
                  <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-muted/40 border border-border/50">
                    <Tag className="h-4 w-4 text-muted-foreground" />
                    ID #{product.id}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 self-start sm:self-auto shrink-0">
              <Button
                variant="outline"
                onClick={() => navigate(`/product/edit/${product.id}`)}
                className="rounded-xl h-11 px-5 gap-2 hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all duration-300 shadow-sm"
              >
                <Pencil className="h-4 w-4" />
                {t("common.edit") || "Edit"}
              </Button>
              <Button
                variant="destructive"
                onClick={() => setOpenConfirmDelete(true)}
                className="rounded-xl h-11 px-5 gap-2 hover:bg-destructive/90 transition-all duration-300 shadow-sm"
              >
                <Trash2 className="h-4 w-4" />
                {t("common.delete") || "Delete"}
              </Button>
            </div>
          </div>
        </div>

        {/* Premium Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-4">
          <div className="group px-6 py-5 rounded-3xl border border-border/40 bg-card/60 backdrop-blur-xl shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300">
            <div className="flex items-center gap-2 text-muted-foreground mb-3">
              <div className="p-1.5 rounded-md bg-emerald-500/10 text-emerald-600">
                <TrendingUp className="h-4 w-4" />
              </div>
              <p className="text-xs font-semibold uppercase tracking-wider">Sale Price</p>
            </div>
            <p className="text-2xl sm:text-3xl font-extrabold tabular-nums text-foreground group-hover:text-emerald-600 transition-colors">
              <span className="text-muted-foreground/50 font-medium text-xl">$</span>{formatPrice(product.salePrice)}
            </p>
          </div>
          
          <div className="group px-6 py-5 rounded-3xl border border-border/40 bg-card/60 backdrop-blur-xl shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300">
            <div className="flex items-center gap-2 text-muted-foreground mb-3">
              <div className="p-1.5 rounded-md bg-amber-500/10 text-amber-600">
                <Bookmark className="h-4 w-4" />
              </div>
              <p className="text-xs font-semibold uppercase tracking-wider">Cost Price</p>
            </div>
            <p className="text-2xl sm:text-3xl font-extrabold tabular-nums text-foreground">
              <span className="text-muted-foreground/50 font-medium text-xl">$</span>{formatPrice(product.costPrice)}
            </p>
          </div>

          <div className="group px-6 py-5 rounded-3xl border border-border/40 bg-card/60 backdrop-blur-xl shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300">
            <div className="flex items-center gap-2 text-muted-foreground mb-3">
              <div className="p-1.5 rounded-md bg-blue-500/10 text-blue-600">
                <Layers className="h-4 w-4" />
              </div>
              <p className="text-xs font-semibold uppercase tracking-wider">Total Quantity</p>
            </div>
            <div className="flex items-baseline gap-2">
              <p className="text-2xl sm:text-3xl font-extrabold tabular-nums text-foreground">
                {totalQuantity}
              </p>
              <span className="text-sm font-medium text-muted-foreground">units</span>
            </div>
          </div>

          <div className="group px-6 py-5 rounded-3xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 to-emerald-500/10 backdrop-blur-xl shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300">
            <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 mb-3">
              <div className="p-1.5 rounded-md bg-emerald-500/20">
                <Package className="h-4 w-4" />
              </div>
              <p className="text-xs font-semibold uppercase tracking-wider">Available Serials</p>
            </div>
            <div className="flex items-baseline gap-2">
              <p className="text-2xl sm:text-3xl font-extrabold tabular-nums text-emerald-700 dark:text-emerald-400">
                {availableCount}
              </p>
              <span className="text-sm font-medium text-emerald-700/70 dark:text-emerald-400/70">ready</span>
            </div>
          </div>

          <div className="group px-6 py-5 rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 backdrop-blur-xl shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 col-span-2 sm:col-span-1">
            <div className="flex items-center gap-2 text-primary mb-3">
              <div className="p-1.5 rounded-md bg-primary/20">
                <AlertTriangle className="h-4 w-4" />
              </div>
              <p className="text-xs font-semibold uppercase tracking-wider">Reorder Level</p>
            </div>
            <div className="flex items-baseline gap-2">
              <p className="text-2xl sm:text-3xl font-extrabold tabular-nums text-primary">
                {product.reorderLevel ?? 0}
              </p>
              <span className="text-sm font-medium text-primary/70">units</span>
            </div>
          </div>
        </div>

        {/* Content grid */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:items-start">
          {/* Left column */}
          <div className="space-y-6 lg:col-span-1 lg:sticky lg:top-6">
            <Card className="rounded-3xl border-border/40 bg-card/60 backdrop-blur-md shadow-md overflow-hidden hover:shadow-lg transition-all duration-300 group relative">
              <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none z-10" />
              <CardContent className="p-0 flex flex-col items-center text-center relative z-0">
                <div className="w-full aspect-square bg-muted/20 relative overflow-hidden">
                  <ImageCell
                    fileName={product.imageUrl}
                    name={product.code || product.name}
                    bucketName="product"
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                </div>
                <div className="p-5 w-full bg-card">
                  <p className="text-sm font-medium text-muted-foreground truncate max-w-full">
                    {product.imageUrl ? "Main Product Image" : "No image uploaded"}
                  </p>
                </div>
              </CardContent>
            </Card>

            <div className="rounded-3xl border border-amber-500/20 bg-gradient-to-br from-amber-500/10 to-amber-500/5 shadow-md p-6 hover:-translate-y-1 transition-all duration-300">
              <div className="flex items-start gap-4">
                <div className="h-10 w-10 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0">
                  <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <p className="text-base font-bold text-foreground">
                    Reorder Threshold
                  </p>
                  <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
                    Alerts trigger automatically when inventory drops to{" "}
                    <span className="font-bold text-amber-600 dark:text-amber-400">{product.reorderLevel ?? 0}</span> units or below.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right column */}
          <div className="space-y-6 lg:col-span-2">
            <Card className="rounded-3xl border-border/40 bg-card/60 backdrop-blur-md shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden">
              <CardHeader className="border-b border-border/40 bg-muted/10 px-6 py-5">
                <CardTitle className="text-base font-bold tracking-tight flex items-center gap-2.5 text-foreground">
                  <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                    <Layers className="h-4 w-4" />
                  </div>
                  General Information
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-border/40">
                  {infoFields.map((f, index) => (
                    <div
                      key={f.label}
                      className={`p-5 flex flex-col gap-1.5 hover:bg-muted/20 transition-colors ${
                        index % 2 === 0 ? "" : "sm:border-t-0"
                      } ${index > 1 ? "sm:border-t border-border/40" : ""}`}
                    >
                      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{f.label}</span>
                      <span
                        className={`text-sm font-semibold text-foreground ${
                          f.mono ? "font-mono bg-muted/50 px-2 py-0.5 rounded w-fit" : ""
                        }`}
                      >
                        {f.value || "-"}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Serials Table */}
            <Card className="rounded-3xl border-border/40 bg-card/60 backdrop-blur-md shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden">
              <CardHeader className="border-b border-border/40 bg-muted/10 px-6 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-base font-bold tracking-tight flex items-center gap-2.5 text-foreground">
                    <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                      <Barcode className="h-4 w-4" />
                    </div>
                    Product Serials & Inventory
                    <Badge variant="secondary" className="ml-1 rounded-full px-2.5 font-mono">
                      {totalQuantity} {totalQuantity === 1 ? "unit" : "units"}
                    </Badge>
                  </CardTitle>
                  <p className="text-xs text-muted-foreground mt-1">
                    Manage and view individual serial items, barcode numbers, and store quantities.
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">
                    {availableCount} Available
                  </span>
                  {soldCount > 0 && (
                    <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-500/10 border border-blue-500/20 px-3 py-1 rounded-full">
                      {soldCount} Sold
                    </span>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                {/* Search & Filter Toolbar */}
                {allSerials.length > 0 && (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="relative w-full sm:w-80">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search serial number, barcode, store..."
                        value={serialSearch}
                        onChange={(e) => setSerialSearch(e.target.value)}
                        className="h-9 pl-9 text-xs rounded-xl border-border/60"
                      />
                    </div>
                    <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
                      {["ALL", "AVAILABLE", "SOLD", "DAMAGED"].map((st) => (
                        <button
                          key={st}
                          type="button"
                          onClick={() => setSerialStatusFilter(st)}
                          className={`px-3 py-1 text-xs rounded-xl font-medium transition-all cursor-pointer shrink-0 ${
                            serialStatusFilter === st
                              ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                              : "bg-muted/50 hover:bg-muted text-muted-foreground"
                          }`}
                        >
                          {st === "ALL" ? `All (${allSerials.length})` : st}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Table */}
                {isLoadingSerials && allSerials.length === 0 ? (
                  <div className="p-10 text-center text-sm text-muted-foreground animate-pulse">
                    Loading serial numbers and inventory data...
                  </div>
                ) : filteredSerials.length > 0 ? (
                  <div className="overflow-x-auto rounded-2xl border border-border/50 bg-background/50">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                      <thead className="bg-muted/20 border-b border-border/40 text-muted-foreground font-semibold">
                        <tr>
                          <th className="py-3 px-4 w-12 text-center">#</th>
                          <th className="py-3 px-4 font-semibold">Serial Number</th>
                          <th className="py-3 px-4 font-semibold">Barcode</th>
                          <th className="py-3 px-4 font-semibold">Store / Branch</th>
                          <th className="py-3 px-4 font-semibold text-center">Qty</th>
                          <th className="py-3 px-4 font-semibold text-right">Cost</th>
                          <th className="py-3 px-4 font-semibold text-right">Price</th>
                          <th className="py-3 px-4 font-semibold text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/40">
                        {filteredSerials.map((s, idx) => (
                          <tr key={s.id ?? idx} className="hover:bg-muted/40 transition-colors group">
                            <td className="py-3 px-4 text-center font-mono text-xs text-muted-foreground">
                              {idx + 1}
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-primary group-hover:text-primary/80 transition-colors">
                                  {s.serialNumber}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => copyToClipboard(s.serialNumber)}
                                  className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground p-1 rounded transition-opacity cursor-pointer"
                                  title="Copy serial number"
                                >
                                  {copiedSerial === s.serialNumber ? (
                                    <Check className="h-3.5 w-3.5 text-emerald-500" />
                                  ) : (
                                    <Copy className="h-3.5 w-3.5" />
                                  )}
                                </button>
                              </div>
                            </td>
                            <td className="py-3 px-4 font-mono text-muted-foreground text-xs">
                              {s.barcode}
                            </td>
                            <td className="py-3 px-4 text-muted-foreground text-xs">
                              <span className="inline-flex items-center gap-1.5">
                                <Store className="h-3.5 w-3.5 text-muted-foreground/70" />
                                {s.storeName}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span className="inline-flex items-center justify-center min-w-[28px] px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20 tabular-nums">
                                {s.quantity}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-foreground font-medium text-right tabular-nums">
                              {formatPrice(s.costPrice)}
                            </td>
                            <td className="py-3 px-4 text-emerald-600 dark:text-emerald-400 font-medium text-right tabular-nums">
                              {formatPrice(s.sellingPrice)}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <StatusBadge status={s.status} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-10 flex flex-col items-center justify-center text-center">
                    <div className="h-16 w-16 rounded-full bg-muted/50 flex items-center justify-center mb-3">
                      <Barcode className="h-8 w-8 text-muted-foreground/50" />
                    </div>
                    <p className="text-base font-semibold text-foreground">
                      {serialSearch || serialStatusFilter !== "ALL"
                        ? "No matching serial numbers"
                        : "No serial numbers found"}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                      {serialSearch || serialStatusFilter !== "ALL"
                        ? "Try clearing your search query or status filter."
                        : "There are no serial numbers registered for this product yet."}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="rounded-3xl border-border/40 bg-card/60 backdrop-blur-md shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden">
              <CardHeader className="border-b border-border/40 bg-muted/10 px-6 py-5">
                <CardTitle className="text-base font-bold tracking-tight flex items-center gap-2.5 text-foreground">
                  <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  Variants & Options
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {product.variantValues && product.variantValues.length > 0 ? (
                  <div className="flex flex-wrap gap-3">
                    {product.variantValues.map((v) => (
                      <div
                        key={v.id}
                        className="flex items-center gap-2 rounded-xl border border-border/60 bg-background shadow-sm pl-4 pr-2 py-2 text-sm hover:border-primary/40 hover:shadow-md transition-all group"
                      >
                        <span className="text-muted-foreground font-medium">
                          {v.variantTypeName || "Variant"}:
                        </span>
                        <span className="font-bold text-foreground">
                          {v.name}
                        </span>
                        {v.code && (
                          <Badge
                            variant="secondary"
                            className="font-mono text-xs px-2 py-0.5 ml-1 bg-muted/80 group-hover:bg-primary/10 group-hover:text-primary transition-colors"
                          >
                            {v.code}
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground italic">
                    No variant attributes assigned to this product.
                  </p>
                )}
              </CardContent>
            </Card>

            {product.noted?.trim() && (
              <div className="rounded-3xl border-l-4 border-l-primary border-t border-r border-b border-border/40 bg-muted/10 px-6 py-5 shadow-sm hover:shadow-md transition-all duration-300">
                <div className="flex items-center gap-2 text-sm font-bold text-foreground mb-3 uppercase tracking-wider">
                  <FileText className="h-4 w-4 text-primary" />
                  Notes
                </div>
                <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground/90 font-medium">
                  {product.noted}
                </p>
              </div>
            )}
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
