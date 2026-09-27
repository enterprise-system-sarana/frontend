import { useState, useEffect, useMemo, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  X,
  Plus,
  Calendar,
  ScanLine,
  Trash2,
  Package,
  Loader2,
  Barcode,
  Check,
} from "lucide-react";
import ImageCell from "@/components/file/ImageCell";
import { useCustomer } from "@/hooks/sales/useCustomer";
import { useProduct } from "@/hooks/product/useProduct";
import { useProductSerial } from "@/hooks/product/useProductSerial";
import { useSale } from "@/hooks/sales/useSale";
import FormCustomer from "@/pages/sales/customers/CustomerForm";
import type {
  SaleResponse,
  SaleItemResponse,
  SaleRequest,
} from "@/types/sales/Sale";
import type { CustomerResponse } from "@/types/sales/Customer";
import type { ProductResponse } from "@/types/product/Product";
import type { ProductSerialResponse } from "@/types/product/ProductSerial";
import { toast } from "sonner";

export interface EditSaleItemState {
  id?: number;
  productId: number;
  productName: string;
  price: number;
  stock: number;
  quantity: number;
  discount: number;
  tax: number;
  subtotal: number;
  imageUrl?: string;
  isSerialized: boolean;
  availableSerialIds: number[];
  selectedSerialIds: number[];
}

interface EditSaleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sale?: SaleResponse | null;
  saleId?: number | null;
  onSuccess?: () => void;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(Number(value) || 0);
}

export default function EditSaleModal({
  open,
  onOpenChange,
  sale: initialSale,
  saleId: initialSaleId,
  onSuccess,
}: EditSaleModalProps) {
  const effectiveSaleId = initialSale?.id || initialSaleId;

  // Fetch full sale detail
  const { data: saleDetailData, isLoading: isLoadingSale } =
    useSale.GetSaleById(effectiveSaleId ?? 0, {
      enabled: open && !!effectiveSaleId,
    });

  const fullSale: SaleResponse | undefined =
    saleDetailData?.payload?.data ||
    saleDetailData?.payload ||
    initialSale ||
    undefined;

  const { mutate: updateSaleMutate, isPending: isUpdating } = useSale.Update();

  // Customers
  const { data: customerData } = useCustomer.useGetAllCustomer(
    { page: 1, size: 200 },
    { enabled: open }
  );
  const customers: CustomerResponse[] = customerData?.payload?.data || [];

  // Products
  const { data: productData } = useProduct.useGetAllProduct(
    { page: 1, size: 500 },
    { enabled: open }
  );
  // Memoize products to prevent new reference on every render
  const products: ProductResponse[] = useMemo(
    () => productData?.payload?.data || [],
    [productData?.payload?.data]
  );

  // Product Serials Lookup
  const { data: serialsData } = useProductSerial.useGetAllProductSerial(
    { page: 1, size: 1000 },
    { enabled: open }
  );

  const serialLookup = useMemo(() => {
    const map = new Map<number, string>();
    const list: ProductSerialResponse[] =
      (serialsData as any)?.payload?.data ??
      (serialsData as any)?.payload?.content ??
      (serialsData as any)?.payload ??
      [];
    if (Array.isArray(list)) {
      list.forEach((s) => {
        if (s?.id) {
          map.set(s.id, s.barcode || `SN-${s.id}`);
        }
      });
    }
    return map;
  }, [serialsData]);

  const [openCustomerModal, setOpenCustomerModal] = useState(false);

  // Form State
  const [customerId, setCustomerId] = useState<string>("");
  const [saleDate, setSaleDate] = useState<string>("");
  const [reference, setReference] = useState<string>("");
  const [productSearch, setProductSearch] = useState<string>("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const initializedSaleIdRef = useRef<number | null>(null);

  const [items, setItems] = useState<EditSaleItemState[]>([]);
  const [orderTax, setOrderTax] = useState<number>(0);
  const [discount, setDiscount] = useState<number>(0);
  const [shipping, setShipping] = useState<number>(0);
  const [status, setStatus] = useState<string>("COMPLETED");

  // Sync state when fullSale or modal opens - runs ONCE per sale id
  useEffect(() => {
    if (!open || !fullSale) return;
    if (initializedSaleIdRef.current === fullSale.id && items.length > 0) return;
    initializedSaleIdRef.current = fullSale.id;

    setCustomerId(fullSale.customerId ? String(fullSale.customerId) : "");
    setSaleDate(
      fullSale.saleDate
        ? fullSale.saleDate.split("T")[0]
        : new Date().toISOString().split("T")[0]
    );
    setReference(fullSale.reference || "");

    const rawItems = fullSale.items || [];
    const mappedItems: EditSaleItemState[] = rawItems.map(
      (item: SaleItemResponse) => {
        const prod = products.find((p) => p.id === item.productId);
        const unitPrice = Number(item.price) || 0;
        const qty = Number(item.quantity) || 1;
        const itemDiscount = Number(item.itemDiscount) || 0;
        const itemTax = 0;

        // Serials
        const allSerials: number[] =
          item.productSerialIds || item.serialNumberIds || [];
        const isSerialized = allSerials.length > 0;
        const selectedSerialIds = isSerialized ? allSerials.slice(0, qty) : [];

        const lineSubtotal = Math.max(0, unitPrice * qty - itemDiscount);

        return {
          id: item.id,
          productId: item.productId,
          productName:
            item.productName || prod?.name || `Product #${item.productId}`,
          price: unitPrice,
          stock: prod?.quantity ?? qty,
          quantity: qty,
          discount: itemDiscount,
          tax: itemTax,
          subtotal: Number(item.subtotal) || lineSubtotal,
          imageUrl: prod?.imageUrl || "",
          isSerialized,
          availableSerialIds: allSerials,
          selectedSerialIds,
        };
      }
    );

    setItems(mappedItems);
    setOrderTax(0);
    setDiscount(Number(fullSale.discount) || 0);
    setShipping(0);
    setStatus(fullSale.status || "COMPLETED");
    setProductSearch("");
  }, [open, fullSale?.id, products.length]);

  // Click outside search results dropdown
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsSearchOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Update item field and recalculate subtotal
  const updateItem = (
    productId: number,
    field: "quantity" | "price" | "discount" | "tax",
    value: number
  ) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.productId !== productId) return item;

        const newQty = field === "quantity" ? Math.max(1, value) : item.quantity;
        let newSelectedSerials = item.selectedSerialIds;

        if (item.isSerialized && field === "quantity") {
          if (newQty > item.selectedSerialIds.length) {
            const needed = newQty - item.selectedSerialIds.length;
            const remainingPool = item.availableSerialIds.filter(
              (id) => !item.selectedSerialIds.includes(id)
            );
            newSelectedSerials = [
              ...item.selectedSerialIds,
              ...remainingPool.slice(0, needed),
            ];
          } else if (newQty < item.selectedSerialIds.length) {
            newSelectedSerials = item.selectedSerialIds.slice(0, newQty);
          }
        }

        const price = field === "price" ? Math.max(0, value) : item.price;
        const disc = field === "discount" ? Math.max(0, value) : item.discount;
        const taxRate = field === "tax" ? Math.max(0, value) : item.tax;

        const base = Math.max(0, price * newQty - disc);
        const subtotal = base + base * (taxRate / 100);

        return {
          ...item,
          [field]:
            field === "quantity"
              ? newQty
              : field === "price"
              ? price
              : field === "discount"
              ? disc
              : taxRate,
          quantity: newQty,
          selectedSerialIds: newSelectedSerials,
          subtotal: Math.round(subtotal * 100) / 100,
        };
      })
    );
  };

  // Toggle specific serial number selection
  const toggleSerial = (productId: number, serialId: number) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.productId !== productId) return item;
        const alreadySelected = item.selectedSerialIds.includes(serialId);
        const newSelected = alreadySelected
          ? item.selectedSerialIds.filter((id) => id !== serialId)
          : [...item.selectedSerialIds, serialId];

        const newQty = Math.max(1, newSelected.length);
        const base = Math.max(0, item.price * newQty - item.discount);
        const subtotal = base + base * (item.tax / 100);

        return {
          ...item,
          selectedSerialIds: newSelected,
          quantity: newQty,
          subtotal: Math.round(subtotal * 100) / 100,
        };
      })
    );
  };

  // Remove item from sale
  const removeItem = (productId: number) => {
    setItems((prev) => prev.filter((item) => item.productId !== productId));
  };

  // Add product from search
  const addProductToSale = (prod: ProductResponse) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.productId === prod.id);
      if (existing) {
        return prev.map((i) =>
          i.productId === prod.id
            ? {
                ...i,
                quantity: i.quantity + 1,
                subtotal: Math.round((i.quantity + 1) * i.price * 100) / 100,
              }
            : i
        );
      }

      const price = Number(prod.salePrice || prod.costPrice || 0);
      const isSerialized = Boolean(
        prod.serialized || prod.isSerialized || prod.hasSerialNumber
      );
      const serialIds = (prod.serials || []).map((s) => s.id);

      return [
        ...prev,
        {
          productId: prod.id,
          productName: prod.name,
          price,
          stock: prod.quantity ?? 0,
          quantity: 1,
          discount: 0,
          tax: 0,
          subtotal: price,
          imageUrl: prod.imageUrl || "",
          isSerialized,
          availableSerialIds: serialIds,
          selectedSerialIds: serialIds.slice(0, 1),
        },
      ];
    });

    setProductSearch("");
    setIsSearchOpen(false);
  };

  // Filter products for the search box
  const searchFilteredProducts = useMemo(() => {
    if (!productSearch.trim()) return [];
    const q = productSearch.toLowerCase();
    return products
      .filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.code && p.code.toLowerCase().includes(q))
      )
      .slice(0, 8);
  }, [productSearch, products]);

  // Calculations
  const itemsSubtotal = useMemo(() => {
    return items.reduce((sum, item) => sum + (Number(item.subtotal) || 0), 0);
  }, [items]);

  const grandTotal = useMemo(() => {
    const total =
      itemsSubtotal +
      Number(orderTax || 0) -
      Number(discount || 0) +
      Number(shipping || 0);
    return Math.max(0, Math.round(total * 100) / 100);
  }, [itemsSubtotal, orderTax, discount, shipping]);

  const selectedCustomer = useMemo(() => {
    return customers.find((c) => String(c.id) === customerId);
  }, [customers, customerId]);

  const handleCancel = () => {
    initializedSaleIdRef.current = null;
    onOpenChange(false);
  };

  const handleSave = () => {
    if (!effectiveSaleId) return;

    if (items.length === 0) {
      toast.error("Please add at least one product to the sale.");
      return;
    }

    // Validate serialized items
    for (const it of items) {
      if (it.isSerialized && it.availableSerialIds.length > 0) {
        if (it.selectedSerialIds.length !== it.quantity) {
          toast.error(
            `Product "${it.productName}" has ${it.selectedSerialIds.length} serials selected, but quantity is ${it.quantity}. Serials count must match quantity.`
          );
          return;
        }
      }
    }

    const request: SaleRequest = {
      reference,
      saleDate,
      storeId: fullSale?.storeId || 1,
      customerId: customerId ? Number(customerId) : null,
      bankId: fullSale?.bankId || null,
      discount: Number(discount) || 0,
      paidAmount: fullSale?.paidAmount || 0,
      noted: fullSale?.noted || null,
      status: status || fullSale?.status || "COMPLETED",
      paymentStatus: fullSale?.paymentStatus || "PAID",
      paymentOption: (fullSale?.dueAmount ?? 0) > 0 ? "DUE" : "PAID",
      items: items.map((it) => ({
        productId: it.productId,
        quantity: it.quantity,
        price: it.price,
        itemDiscount: it.discount,
        subtotal: it.subtotal,
        serialNumberIds:
          it.isSerialized && it.selectedSerialIds.length > 0
            ? it.selectedSerialIds
            : undefined,
      })),
    };

    updateSaleMutate(
      { id: effectiveSaleId, request },
      {
        onSuccess: () => {
          toast.success(`Sale #${reference} updated successfully.`);
          onOpenChange(false);
          onSuccess?.();
        },
        onError: (err: any) => {
          const msg =
            err?.response?.data?.message ||
            (typeof err?.response?.data === "string"
              ? err.response.data
              : null) ||
            err?.message ||
            "Failed to update sale. Please try again.";
          toast.error(msg);
        },
      }
    );
  };

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(v) => {
          if (!v) handleCancel();
        }}
      >
        <DialogContent
          showCloseButton={false}
          className="sm:max-w-5xl md:max-w-6xl w-[95vw] gap-0 overflow-hidden rounded-xl border border-border/80 bg-white dark:bg-card p-0 shadow-2xl"
        >
          {/* Header */}
          <DialogHeader className="flex flex-row items-center justify-between border-b border-border/60 px-6 py-4">
            <DialogTitle className="text-xl font-bold tracking-tight text-foreground">
              Edit Sale
            </DialogTitle>
            <button
              type="button"
              onClick={handleCancel}
              aria-label="Close"
              className="h-6 w-6 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-red-400 cursor-pointer"
            >
              <X className="h-3.5 w-3.5 stroke-[2.5]" />
            </button>
          </DialogHeader>

          {isLoadingSale ? (
            <div className="flex h-72 items-center justify-center space-x-2 text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span className="text-sm font-medium">Loading sale details…</span>
            </div>
          ) : (
            <div className="max-h-[calc(90vh-130px)] overflow-y-auto px-6 py-5 space-y-5">
              {/* Row 1: Customer Name, Date, Reference */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* Customer Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">
                    Customer Name <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-center gap-1.5">
                    <Select value={customerId} onValueChange={setCustomerId}>
                      <SelectTrigger className="h-10 flex-1 border-border/80 bg-background text-sm">
                        <SelectValue placeholder="Choose Customer" />
                      </SelectTrigger>
                      <SelectContent className="max-h-56">
                        {customers.map((c) => (
                          <SelectItem key={c.id} value={String(c.id)}>
                            {c.name} {c.phone ? `(${c.phone})` : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      size="icon"
                      onClick={() => setOpenCustomerModal(true)}
                      className="h-10 w-10 shrink-0 rounded-md bg-[#1c2437] hover:bg-[#2b354f] text-white cursor-pointer"
                      title="Add Customer"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Date */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">
                    Date <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Input
                      type="date"
                      value={saleDate}
                      onChange={(e) => setSaleDate(e.target.value)}
                      className="h-10 border-border/80 bg-background pr-9 text-sm"
                    />
                    <Calendar className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  </div>
                </div>

                {/* Reference */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">
                    Reference <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="text"
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                    placeholder="Reference"
                    className="h-10 border-border/80 bg-background font-mono text-sm"
                  />
                </div>
              </div>

              {/* Row 2: Product Search */}
              <div className="space-y-1.5" ref={searchRef}>
                <label className="text-xs font-semibold text-foreground">
                  Product <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Input
                    type="text"
                    value={productSearch}
                    onChange={(e) => {
                      setProductSearch(e.target.value);
                      setIsSearchOpen(true);
                    }}
                    onFocus={() => {
                      if (productSearch.trim()) setIsSearchOpen(true);
                    }}
                    placeholder="Search product by name, code or barcode to add..."
                    className="h-10 border-border/80 bg-background pr-10 text-sm"
                  />
                  <ScanLine className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                  {/* Autocomplete Dropdown */}
                  {isSearchOpen && searchFilteredProducts.length > 0 && (
                    <div className="absolute left-0 top-full z-50 mt-1 max-h-60 w-full overflow-y-auto rounded-md border border-border bg-popover p-1 shadow-lg">
                      {searchFilteredProducts.map((p) => (
                        <div
                          key={p.id}
                          className="flex w-full items-center justify-between rounded-sm px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground cursor-pointer"
                          onClick={() => addProductToSale(p)}
                        >
                          <div className="flex items-center gap-2">
                            <Package className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{p.name}</span>
                            <span className="text-xs text-muted-foreground font-mono">
                              ({p.code})
                            </span>
                          </div>
                          <span className="font-semibold text-primary">
                            {formatCurrency(p.salePrice || p.costPrice || 0)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Row 3: Items Table */}
              <div className="rounded-lg border border-border/80 overflow-hidden">
                <table className="w-full text-left text-sm table-fixed">
                  <thead className="bg-[#eaedf1] dark:bg-muted/60 text-xs font-semibold text-foreground">
                    <tr>
                      <th className="px-4 py-3 w-[30%]">Product Name</th>
                      <th className="px-3 py-3 text-center w-[14%]">
                        Net Unit Price($)
                      </th>
                      <th className="px-3 py-3 text-center w-[10%]">Stock</th>
                      <th className="px-3 py-3 text-center w-[11%]">QTY</th>
                      <th className="px-3 py-3 text-center w-[11%]">Discount($)</th>
                      <th className="px-3 py-3 text-center w-[9%]">Tax %</th>
                      <th className="px-3 py-3 text-center w-[11%]">Subtotal ($)</th>
                      <th className="px-2 py-3 text-center w-[4%]"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60 bg-background">
                    {items.length === 0 ? (
                      <tr>
                        <td
                          colSpan={8}
                          className="py-8 text-center text-sm text-muted-foreground"
                        >
                          No items in this sale. Use the search bar above to add products.
                        </td>
                      </tr>
                    ) : (
                      items.map((item) => (
                        <tr
                          key={item.productId}
                          className="hover:bg-muted/30 transition-colors"
                        >
                          {/* Product Name + Serials */}
                          <td className="px-4 py-3 align-top">
                            <div className="flex items-start gap-3 min-w-0">
                              <div className="h-9 w-9 shrink-0 overflow-hidden rounded border border-border/80 bg-muted/40 flex items-center justify-center mt-0.5">
                                {item.imageUrl ? (
                                  <ImageCell
                                    fileName={item.imageUrl}
                                    name={item.productName}
                                    bucketName="product"
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <Package className="h-4 w-4 text-muted-foreground" />
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <span
                                  className="font-medium text-foreground text-sm block truncate"
                                  title={item.productName}
                                >
                                  {item.productName}
                                </span>

                                {/* Serial Numbers Selection if Serialized */}
                                {item.isSerialized && (
                                  <div className="mt-1.5 space-y-1">
                                    <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                                      <Barcode className="h-3 w-3" />
                                      <span>
                                        Serials ({item.selectedSerialIds.length}/
                                        {item.quantity}):
                                      </span>
                                    </div>
                                    <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
                                      {item.availableSerialIds.map((sid) => {
                                        const isSelected =
                                          item.selectedSerialIds.includes(sid);
                                        const label =
                                          serialLookup.get(sid) || `SN-${sid}`;
                                        return (
                                          <button
                                            key={sid}
                                            type="button"
                                            onClick={() =>
                                              toggleSerial(item.productId, sid)
                                            }
                                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono transition-colors border cursor-pointer ${
                                              isSelected
                                                ? "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/40 font-semibold"
                                                : "bg-muted/40 text-muted-foreground border-border/60 hover:bg-muted"
                                            }`}
                                          >
                                            {isSelected && (
                                              <Check className="h-3 w-3" />
                                            )}
                                            {label}
                                          </button>
                                        );
                                      })}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Net Unit Price */}
                          <td className="px-3 py-3 text-center align-top">
                            <Input
                              type="number"
                              min={0}
                              step={0.5}
                              value={item.price}
                              onChange={(e) =>
                                updateItem(
                                  item.productId,
                                  "price",
                                  Number(e.target.value) || 0
                                )
                              }
                              className="h-8 w-24 text-center border-border/80 mx-auto"
                            />
                          </td>

                          {/* Stock */}
                          <td className="px-3 py-3 text-center text-muted-foreground align-top pt-4">
                            {item.stock}
                          </td>

                          {/* QTY */}
                          <td className="px-3 py-3 text-center align-top">
                            <Input
                              type="number"
                              min={1}
                              value={item.quantity}
                              onChange={(e) =>
                                updateItem(
                                  item.productId,
                                  "quantity",
                                  Math.max(1, Number(e.target.value) || 1)
                                )
                              }
                              className="h-8 w-20 text-center font-bold border-border/80 mx-auto"
                            />
                          </td>

                          {/* Discount */}
                          <td className="px-3 py-3 text-center align-top">
                            <Input
                              type="number"
                              min={0}
                              step={0.5}
                              value={item.discount}
                              onChange={(e) =>
                                updateItem(
                                  item.productId,
                                  "discount",
                                  Math.max(0, Number(e.target.value) || 0)
                                )
                              }
                              className="h-8 w-20 text-center border-border/80 mx-auto"
                            />
                          </td>

                          {/* Tax % */}
                          <td className="px-3 py-3 text-center align-top">
                            <Input
                              type="number"
                              min={0}
                              max={100}
                              step={0.5}
                              value={item.tax}
                              onChange={(e) =>
                                updateItem(
                                  item.productId,
                                  "tax",
                                  Math.max(0, Number(e.target.value) || 0)
                                )
                              }
                              className="h-8 w-16 text-center border-border/80 mx-auto"
                            />
                          </td>

                          {/* Subtotal */}
                          <td className="px-3 py-3 text-center font-semibold text-foreground align-top pt-4">
                            {formatCurrency(item.subtotal)}
                          </td>

                          {/* Delete Item */}
                          <td className="px-2 py-3 text-center align-top pt-3">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removeItem(item.productId)}
                              className="h-7 w-7 text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded cursor-pointer"
                              title="Remove item from sale"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Row 4: Summary Table (Right Aligned) */}
              <div className="flex justify-end">
                <div className="w-full sm:w-96 overflow-hidden rounded-md border border-border/80 text-sm">
                  <div className="grid grid-cols-2 border-b border-border/60">
                    <div className="border-r border-border/60 px-4 py-2.5 text-muted-foreground font-medium">
                      Order Tax
                    </div>
                    <div className="px-4 py-2.5 text-right font-semibold text-foreground">
                      {formatCurrency(Number(orderTax) || 0)}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 border-b border-border/60">
                    <div className="border-r border-border/60 px-4 py-2.5 text-muted-foreground font-medium">
                      Discount
                    </div>
                    <div className="px-4 py-2.5 text-right font-semibold text-foreground">
                      {formatCurrency(Number(discount) || 0)}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 border-b border-border/60">
                    <div className="border-r border-border/60 px-4 py-2.5 text-muted-foreground font-medium">
                      Shipping
                    </div>
                    <div className="px-4 py-2.5 text-right font-semibold text-foreground">
                      {formatCurrency(Number(shipping) || 0)}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 bg-muted/20">
                    <div className="border-r border-border/60 px-4 py-3 font-bold text-foreground">
                      Grand Total
                    </div>
                    <div className="px-4 py-3 text-right font-bold text-base text-[#10b981] dark:text-[#34d399]">
                      {formatCurrency(grandTotal)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Row 5: Order Tax, Discount, Shipping, Status Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-1">
                {/* Order Tax */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">
                    Order Tax <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="number"
                    min={0}
                    step={0.5}
                    value={orderTax}
                    onChange={(e) => setOrderTax(Number(e.target.value) || 0)}
                    className="h-10 border-border/80 bg-background text-sm"
                  />
                </div>

                {/* Discount */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">
                    Discount <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="number"
                    min={0}
                    step={0.5}
                    value={discount}
                    onChange={(e) => setDiscount(Number(e.target.value) || 0)}
                    className="h-10 border-border/80 bg-background text-sm"
                  />
                </div>

                {/* Shipping */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">
                    Shipping <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="number"
                    min={0}
                    step={0.5}
                    value={shipping}
                    onChange={(e) => setShipping(Number(e.target.value) || 0)}
                    className="h-10 border-border/80 bg-background text-sm"
                  />
                </div>

                {/* Status */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">
                    Status <span className="text-red-500">*</span>
                  </label>
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger className="h-10 border-border/80 bg-background text-sm">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="COMPLETED">Completed</SelectItem>
                      <SelectItem value="PENDING">Pending</SelectItem>
                      <SelectItem value="CANCELLED">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 border-t border-border/70 bg-card px-6 py-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isUpdating}
              className="h-10 rounded-md bg-[#1c2437] hover:bg-[#2b354f] text-white border-none px-6 font-medium text-sm transition-colors cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              disabled={isUpdating || items.length === 0}
              className="h-10 rounded-md bg-[#ff9f43] hover:bg-[#f08c2a] text-white font-semibold px-6 shadow-sm disabled:opacity-60 transition-colors cursor-pointer"
            >
              {isUpdating ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving…
                </span>
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Customer Create Modal */}
      {openCustomerModal && (
        <FormCustomer
          open={openCustomerModal}
          setOpen={setOpenCustomerModal}
          customer={null}
          onCreated={(newCustomer) => {
            if (newCustomer?.id) {
              setCustomerId(String(newCustomer.id));
            }
          }}
        />
      )}
    </>
  );
}
