import { useEffect, useState, useMemo, useRef } from "react";
import { useForm, useStore as useFormStore } from "@tanstack/react-form";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import {
  Plus,
  Minus,
  ScanLine,
  Search,
  Trash2,
  Hash,
  ShoppingCart,
  Package,
  CheckCircle2,
  Calendar,
  UserPlus,
  Pause,
  Printer,
  ArrowRight,
  Check,
  AlertTriangle,
  Receipt,
  ShoppingBag,
  User,
  Tag,
  Wallet,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import {
  SaleSchema,
  SalePaymentStatus,
  SaleStatus,
  type SaleFormValues,
} from "@/types/sales/Sale";

import { useSale } from "@/hooks/sales/useSale";
import { usePayment } from "@/hooks/sales/usePayment";
import { useCustomer } from "@/hooks/sales/useCustomer";
import { useStore } from "@/hooks/inventory/useStore";
import { useBank } from "@/hooks/finance/useBank";
import { useProduct } from "@/hooks/product/useProduct";
import { useProductSerial } from "@/hooks/product/useProductSerial";
import { useCategory } from "@/hooks/product/useCategory";
import { useAuth } from "@/store/useAuth";

import FormCustomer from "@/pages/sales/customers/CustomerForm";
import PaymentForm from "@/pages/sales/payment/PaymentForm";
import ImageCell from "@/components/file/ImageCell";
import { ROUTERS } from "@/constants/Route";
import { toast } from "sonner";

import type { StoreResponse } from "@/types/inventory/Store";
import type { CustomerResponse } from "@/types/sales/Customer";
import type { ProductResponse } from "@/types/product/Product";
import type { PaymentRequest } from "@/types/sales/Payment";



/* =========================================================
   HELPERS
========================================================= */

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(Number(value) || 0);
}

function generateRef() {
  const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, "");
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `POS-${dateStr}-${rand}`;
}

/* =========================================================
   MAIN POS SALE FORM
========================================================= */

export default function SaleForm() {
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  /* -------------------------------------------------------
     DATA FETCHING
  ------------------------------------------------------- */

  const { data: customers } = useCustomer.useGetAllCustomer({
    page: 0,
    size: 1000,
  });

  const { data: stores } = useStore.useGetAllStore({
    page: 0,
    size: 1000,
  });

  const { data: products } = useProduct.useGetAllProduct({
    page: 0,
    size: 1000,
  });

  const { data: dataCategory } = useCategory.useGetAllCategory({
    page: 0,
    size: 1000,
  });

  const listCategory = dataCategory?.payload?.data ?? [];
  const productList: ProductResponse[] = products?.payload?.data ?? [];
  const customerList: CustomerResponse[] = customers?.payload?.data ?? [];
  const storeList: StoreResponse[] = stores?.payload?.data ?? [];

  const { data: banks } = useBank.useGetAllBank({ page: 1, size: 1000 });
  const bankList: any[] = banks?.payload?.data ?? banks?.data ?? banks?.payload ?? [];

  const { data: existingSale } = useSale.GetSaleById(Number(id), {
    enabled: isEditing,
  });

  const saleDetail =
    existingSale?.payload?.data ??
    existingSale?.payload ??
    existingSale?.data ??
    existingSale;

  /* -------------------------------------------------------
     MUTATIONS
  ------------------------------------------------------- */

  const createSale = useSale.Create();
  const updateSale = useSale.Update();
  const completeSale = useSale.Complete();
  const createPayment = usePayment.createPayment();
  const isPending = createSale.isPending || updateSale.isPending || completeSale.isPending;

  /* -------------------------------------------------------
     LOCAL UI STATE
  ------------------------------------------------------- */

  const [productSearch, setProductSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [isCustomerDialogOpen, setIsCustomerDialogOpen] = useState(false);
  const [activeSerialRowIndex, setActiveSerialRowIndex] = useState<number | null>(null);



  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const paymentSubmittedRef = useRef(false);




  /* -------------------------------------------------------
     FORM INITIALIZATION
  ------------------------------------------------------- */

  const submitSale = async (paymentOverride?: PaymentRequest): Promise<number> => {
    const currentValues = form.state.values;

    if (!currentValues.items || currentValues.items.length === 0) {
      toast.error("Please add at least one product to the cart before checkout");
      return 0;
    }

    const items = currentValues.items.map((item: any) => {
      const price = Number(item.price) || 0;
      const quantity = Number(item.quantity) || 1;
      const itemDiscount = Number(item.itemDiscount) || 0;

      return {
        productId: Number(item.productId),
        quantity,
        price,
        itemDiscount,
        subtotal: price * quantity - itemDiscount,
        serialNumberIds: (item.serialNumberIds ?? []).filter(
          (sId: any) => Number(sId) > 0
        ),
      };
    });

    const subtotalCalc = items.reduce((sum: number, it: any) => sum + it.subtotal, 0);
    const discountVal = Number(currentValues.discount) || 0;
    const grandTotalCalc = Math.max(subtotalCalc - discountVal, 0);

    const paymentOption: "PAID" | "DUE" =
      currentValues.paymentOption === "DUE" ? "DUE" : "PAID";

    const finalPaidAmount =
      paymentOverride?.amount
        ? Number(paymentOverride.amount)
        : paymentOption === "PAID"
          ? (Number(currentValues.paidAmount) > 0 ? Number(currentValues.paidAmount) : grandTotalCalc)
          : (Number(currentValues.paidAmount) || 0);

    const customerIdNum = Number(currentValues.customerId);
    const walkInCustomer = customerList.find((c: any) => c.name?.toLowerCase().includes("walk"));
    const finalCustomerId = customerIdNum > 0 ? customerIdNum : (walkInCustomer?.id || (customerList.length > 0 ? customerList[0].id : null));

    const payload: any = {
      reference: currentValues.reference || generateRef(),
      saleDate: currentValues.saleDate || new Date().toISOString().split("T")[0],
      noted: currentValues.noted?.trim() || null,
      customerId: finalCustomerId,
      storeId: Number(currentValues.storeId) || storeList[0]?.id || 1,
      bankId: Number(currentValues.bankId) > 0 ? Number(currentValues.bankId) : null,
      discount: discountVal,
      totalAmount: subtotalCalc,
      grandTotal: grandTotalCalc,
      paidAmount: finalPaidAmount,
      dueAmount: Math.max(grandTotalCalc - finalPaidAmount, 0),
      paymentOption,
      paymentStatus: SalePaymentStatus.Pending,
      status: SaleStatus.Pending,
      items,
    };

    let savedSaleId = isEditing && id ? Number(id) : 0;
    if (isEditing && id) {
      await updateSale.mutateAsync({
        id: Number(id),
        request: payload,
      });
      toast.success("Sale updated successfully!");
      navigate(ROUTERS.SALE);
    } else {
      const createdSale: any = await createSale.mutateAsync(payload);
      const createdSaleData = createdSale?.payload?.data ?? createdSale?.data ?? createdSale?.payload ?? createdSale;
      savedSaleId = Number(createdSaleData?.id || 0);
      toast.success("Sale created successfully!");
    }

    // When called without a paymentOverride (direct submit flow), handle payment internally
    if (!paymentOverride && savedSaleId > 0 && finalPaidAmount > 0) {
      const paymentRequest: PaymentRequest = {
        paymentNo: `PAY-${payload.reference}-${Date.now()}`,
        paymentMethod: "CASH",
        bankId: null,
        saleId: savedSaleId,
        amount: finalPaidAmount,
        transactionNo: null,
        paymentDate: payload.saleDate,
        status: finalPaidAmount >= grandTotalCalc ? "PAID" : "PARTIAL",
      };
      const paymentResponse: any = await createPayment.mutateAsync(paymentRequest);
      const responseStatus = String(
        paymentResponse?.status ??
        paymentResponse?.payload?.status ??
        paymentResponse?.data?.status ??
        ""
      ).toUpperCase();
      const httpStatus = Number(responseStatus);
      const paymentSucceeded =
        !responseStatus ||
        (httpStatus >= 200 && httpStatus < 300) ||
        ["SUCCESS", "SUCCEEDED", "PAID", "COMPLETED"].includes(responseStatus);

      if (paymentSucceeded && finalPaidAmount >= grandTotalCalc) {
        await completeSale.mutateAsync(savedSaleId);
        await queryClient.invalidateQueries({ queryKey: useProduct.keys.all });
      }
    }

    if (!isEditing) {
      form.setFieldValue("items", []);
      form.setFieldValue("discount", 0);
      form.setFieldValue("paidAmount", 0);
      form.setFieldValue("paymentOption", "PAID");
      setIsPaymentModalOpen(false);
      await queryClient.invalidateQueries({ queryKey: useSale.keys.all });
    }

    return savedSaleId;
  };

  const form = useForm({
    defaultValues: {
      reference: generateRef(),
      saleDate: new Date().toISOString().split("T")[0],
      noted: "",
      customerId: 1,
      storeId: storeList[0]?.id || 1,
      bankId: 1,
      discount: 0,
      paidAmount: 0,
      paymentStatus: SalePaymentStatus.Pending,
      status: SaleStatus.Pending,
      paymentOption: "PAID",
      items: [] as any[],
    } as SaleFormValues,

    validators: {
      onSubmit: SaleSchema,
    },

    onSubmit: async ({ value }) => {
      form.setFieldValue("reference", value.reference || generateRef());
      await submitSale();
    },
  });

  /* -------------------------------------------------------
     FORM VALUES & TOTALS
  ------------------------------------------------------- */

  const formValues = useFormStore(form.store, (state) => state.values);

  useEffect(() => {
    if (storeList.length > 0 && !formValues.storeId) {
      form.setFieldValue("storeId", storeList[0].id);
    }
  }, [storeList, formValues.storeId, form]);

  useEffect(() => {
    if (bankList.length > 0 && !formValues.bankId) {
      form.setFieldValue("bankId", bankList[0].id);
    }
  }, [bankList, formValues.bankId, form]);

  useEffect(() => {
    if (customerList.length > 0 && !formValues.customerId) {
      const walkIn = customerList.find((c) =>
        c.name?.toLowerCase().includes("walk")
      );
      if (walkIn) {
        form.setFieldValue("customerId", walkIn.id);
      }
    }
  }, [customerList, formValues.customerId, form]);

  useEffect(() => {
    const itemsTotal = (formValues.items || []).reduce(
      (sum: number, item: any) =>
        sum +
        (Number(item.price) || 0) * (Number(item.quantity) || 0) -
        (Number(item.itemDiscount) || 0),
      0
    );

    const discount = Number(formValues.discount) || 0;
    const grandTotal = Math.max(itemsTotal - discount, 0);
    const paidAmount = Number(formValues.paidAmount) || 0;
    let targetPaid = paidAmount;

    if (!isEditing && (paidAmount === 0 || paidAmount === grandTotal)) {
      targetPaid = grandTotal;
      form.setFieldValue("paidAmount", grandTotal);
    }

    let paymentStatus: SalePaymentStatus = SalePaymentStatus.Pending;
    let saleStatus: SaleStatus = SaleStatus.Pending;

    if (grandTotal > 0 && targetPaid >= grandTotal) {
      paymentStatus = SalePaymentStatus.Paid;
      saleStatus = SaleStatus.Completed;
    } else if (targetPaid > 0 && targetPaid < grandTotal) {
      paymentStatus = SalePaymentStatus.Partial;
      saleStatus = SaleStatus.Pending;
    }

    if (formValues.paymentStatus !== paymentStatus) {
      form.setFieldValue("paymentStatus", paymentStatus);
    }

    if (formValues.status !== saleStatus) {
      form.setFieldValue("status", saleStatus);
    }
  }, [
    formValues.items,
    formValues.discount,
    formValues.paidAmount,
    formValues.paymentStatus,
    formValues.status,
    isEditing,
    form,
  ]);

  /* -------------------------------------------------------
     LOAD EXISTING SALE (EDIT MODE)
  ------------------------------------------------------- */

  useEffect(() => {
    const sale = saleDetail;
    if (!sale || typeof sale !== "object") return;

    form.reset({
      reference: sale.reference ?? generateRef(),
      noted: sale.noted ?? "",
      saleDate: sale.saleDate ?? new Date().toISOString().split("T")[0],
      customerId: sale.customerId ?? sale.customer?.id ?? 0,
      storeId: sale.storeId ?? sale.store?.id ?? 1,
      bankId: sale.bankId ?? sale.bank?.id ?? 1,
      discount: sale.discount ?? 0,
      paidAmount: sale.paidAmount ?? 0,
      paymentStatus: sale.paymentStatus ?? SalePaymentStatus.Pending,
      status: sale.status ?? SaleStatus.Pending,
      paymentOption: sale.paymentOption ?? "PAID",
      items: sale.items?.length
        ? sale.items.map((item: any) => {
          const price = item.price ?? item.product?.salePrice ?? 0;
          const quantity = item.quantity ?? 1;
          const itemDiscount = item.itemDiscount ?? 0;

          return {
            productId: item.productId ?? item.product?.id ?? 0,
            quantity,
            price,
            itemDiscount,
            subtotal: price * quantity - itemDiscount,
            serialNumberIds: item.serialNumberIds ?? [],
          };
        })
        : [],
    });
  }, [saleDetail, form]);

  /* -------------------------------------------------------
     ADD PRODUCT TO CART
  ------------------------------------------------------- */

  const handleAddProduct = (product: ProductResponse, itemsField: any) => {
    const currentItems = itemsField.state.value || [];
    const existingIndex = currentItems.findIndex(
      (item: any) => Number(item.productId) === Number(product.id)
    );

    if (existingIndex !== -1) {
      const existing = currentItems[existingIndex];
      const newQuantity = (Number(existing.quantity) || 1) + 1;
      const price = Number(existing.price) || Number(product.salePrice) || 0;

      form.setFieldValue(`items[${existingIndex}].quantity`, newQuantity);
      form.setFieldValue(
        `items[${existingIndex}].subtotal`,
        price * newQuantity - (Number(existing.itemDiscount) || 0)
      );
      setActiveSerialRowIndex(existingIndex);
    } else {
      const price = Number(product.salePrice) || 0;
      itemsField.pushValue({
        productId: product.id,
        quantity: 1,
        price,
        itemDiscount: 0,
        subtotal: price,
        serialNumberIds: [],
      });
      setActiveSerialRowIndex(currentItems.length);
    }
  };

  /* -------------------------------------------------------
     FILTER PRODUCTS
  ------------------------------------------------------- */

  const filteredProducts = useMemo(() => {
    const search = productSearch.toLowerCase().trim();
    return productList.filter((product) => {
      const matchesSearch =
        product.name?.toLowerCase().includes(search) ||
        (product as any).code?.toLowerCase().includes(search) ||
        (product as any).sku?.toLowerCase().includes(search);

      const matchesCategory =
        selectedCategory === "All" ||
        (product as any).categoryName === selectedCategory ||
        String((product as any).categoryId) === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [productList, productSearch, selectedCategory]);

  const handleVoidCart = () => {
    form.setFieldValue("items", []);
    form.setFieldValue("discount", 0);
  };



  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background text-foreground">
      {/* 1. DreamsPOS Header */}

      {/* 2. Main POS Workspace Split */}
      <div className="flex min-h-0 flex-1 overflow-hidden">
        {/* ===================================================
            LEFT SECTION: PRODUCT CATALOG
        =================================================== */}
        <section className="flex min-w-0 flex-1 flex-col overflow-hidden bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800">
          {/* Greeting Banner & Search Bar */}
          <div className="shrink-0 p-4 md:p-5 border-b border-slate-200/80 dark:border-slate-800">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              {/* Search Bar + Scan */}
              <div className="flex items-center gap-2 max-w-md w-full sm:w-auto">
                <div className="relative flex-1 sm:w-64 md:w-72">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    placeholder="Search Product..."
                    className="pl-9 h-9.5 text-xs bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 rounded-xl focus-visible:ring-1 focus-visible:ring-teal-500"
                  />
                  {productSearch && (
                    <button
                      type="button"
                      onClick={() => setProductSearch("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs"
                    >
                      ×
                    </button>
                  )}
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-9.5 px-3 gap-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                >
                  <ScanLine className="size-4 text-teal-600" />
                  <span className="hidden sm:inline">Scan</span>
                </Button>
              </div>
            </div>

            {/* Category Filter Tabs / Pills */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
              <button
                type="button"
                onClick={() => setSelectedCategory("All")}
                className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold transition cursor-pointer ${selectedCategory === "All"
                  ? "bg-teal-700 text-white shadow-sm"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                  }`}
              >
                All
              </button>
              {listCategory.map((cat: any) => {
                const isSelected = selectedCategory === cat.name;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(cat.name)}
                    className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold transition cursor-pointer ${isSelected
                      ? "bg-teal-600 text-white shadow-sm"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                      }`}
                  >
                    {cat.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Product Grid Catalog */}
          <div className="flex-1 overflow-y-auto p-4 md:p-5">
            <form.Field name="items" mode="array">
              {(itemsField) => {
                const cartItemIds = (itemsField.state.value || []).map((it: any) =>
                  Number(it.productId)
                );

                if (filteredProducts.length === 0) {
                  return (
                    <div className="flex h-full flex-col items-center justify-center text-center py-16">
                      <div className="size-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3">
                        <Package className="size-8 text-muted-foreground/40" />
                      </div>
                      <h3 className="font-semibold text-slate-800 dark:text-white text-sm">
                        No products found
                      </h3>
                      {/* <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                        Try searching with another keyword or select a different category.
                      </p> */}
                    </div>
                  );
                }

                return (
                  <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3.5">
                    {filteredProducts.map((product) => {
                      const stock = Number((product as any).qty ?? 0);
                      const inCart = cartItemIds.includes(product.id);

                      return (
                        <div
                          key={product.id}
                          onClick={() => {
                            if (stock > 0) {
                              handleAddProduct(product, itemsField);
                            }
                          }}
                          className={`group relative rounded-xl border bg-white dark:bg-slate-800/90 text-left transition duration-150 overflow-hidden cursor-pointer select-none flex flex-col ${inCart
                            ? "border-teal-500 ring-2 ring-teal-500/20 shadow-md"
                            : "border-slate-200/90 dark:border-slate-700/80 hover:border-teal-400 hover:shadow-md"
                            } ${stock <= 0 ? "opacity-50 cursor-not-allowed" : ""}`}
                        >
                          {/* Image Container */}
                          <div className="relative aspect-4/3 w-full overflow-hidden bg-slate-50 dark:bg-slate-900/60 flex items-center justify-center">
                            <ImageCell
                              fileName={product.imageUrl}
                              name={product.code}
                              bucketName="product"
                              className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                            />

                            {/* In-cart Checkmark */}
                            {inCart && (
                              <div className="absolute top-2 left-2 size-6 rounded-full bg-teal-600 text-white flex items-center justify-center shadow-xs">
                                <CheckCircle2 className="size-4" />
                              </div>
                            )}

                            {/* Quick Add Overlay Button */}
                            {stock > 0 && (
                              <div className="absolute top-2 right-2 size-7 rounded-lg bg-white/90 dark:bg-slate-800/90 text-slate-800 dark:text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition shadow-xs">
                                <Plus className="size-4" />
                              </div>
                            )}

                            {/* Stock Badge */}
                            <div className="absolute bottom-2 left-2">
                              <span
                                className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md shadow-2xs backdrop-blur-xs ${stock > 0
                                  ? "bg-emerald-500/90 text-white"
                                  : "bg-red-500/90 text-white"
                                  }`}
                              >
                                {stock > 0 ? `${stock} in stock` : "Out of stock"}
                              </span>
                            </div>
                          </div>

                          {/* Content */}
                          <div className="p-3 flex-1 flex flex-col justify-between">
                            <h4
                              title={product.name}
                              className="text-xs font-semibold text-slate-800 dark:text-slate-100 line-clamp-2 leading-snug group-hover:text-teal-600 dark:group-hover:text-teal-400 transition"
                            >
                              {product.name}
                            </h4>
                            <div className="mt-2 flex items-center justify-between">
                              <span className="text-sm font-extrabold text-teal-600 dark:text-teal-400">
                                {formatCurrency(Number(product.salePrice) || 0)}
                              </span>
                              {(product as any).code && (
                                <span className="text-[10px] text-muted-foreground font-mono">
                                  {(product as any).code}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              }}
            </form.Field>
          </div>
        </section>
        {/* ===================================================
            RIGHT: ORDER CART & CHECKOUT PANEL (Modern POS Style)
        =================================================== */}
        <aside className="w-107.5 xl:w-117.5 2xl:w-125 shrink-0 bg-card border-l border-border/60 flex flex-col h-full overflow-hidden select-none">
          {/* 1. Header Bar: Order Info & Customer */}
          <div className="p-3.5 border-b border-border/60 bg-muted/20 shrink-0 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="size-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <Receipt className="size-4" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-foreground">Order</span>
                    <span className="text-[11px] font-mono font-medium text-muted-foreground">
                      {formValues.reference || "NEW"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={handleVoidCart}
                  title="Clear Cart"
                  className="size-7 text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition cursor-pointer"
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            </div>

            {/* Compact Metadata Controls */}
            <div className="grid grid-cols-12 gap-2 text-xs">
              {/* Customer Selector */}
              <div className="col-span-8 flex items-center gap-1.5">
                <div className="relative flex-1">
                  <User className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
                  <select
                    value={formValues.customerId ? String(formValues.customerId) : "0"}
                    onChange={(e) =>
                      form.setFieldValue("customerId", Number(e.target.value))
                    }
                    className="w-full h-8 text-xs pl-8 pr-2 rounded-lg border border-border/60 bg-background text-foreground focus:outline-hidden focus:ring-1 focus:ring-primary/40 focus:border-primary transition cursor-pointer"
                  >
                    {customerList.map((cust) => (
                      <option key={cust.id} value={String(cust.id)}>
                        {cust.name} {cust.phone ? `(${cust.phone})` : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <Button
                  type="button"
                  size="icon"
                  onClick={() => setIsCustomerDialogOpen(true)}
                  title="Add New Customer"
                  className="size-8 shrink-0 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg shadow-2xs cursor-pointer"
                >
                  <UserPlus className="size-3.5" />
                </Button>
              </div>

              {/* Date Input */}
              <div className="col-span-4 relative">
                <input
                  type="date"
                  value={formValues.saleDate}
                  onChange={(e) => form.setFieldValue("saleDate", e.target.value)}
                  className="w-full h-8 text-[11px] px-2 pr-6 rounded-lg border border-border/60 bg-background text-foreground focus:outline-hidden focus:ring-1 focus:ring-primary/40 focus:border-primary transition"
                />
                <Calendar className="absolute right-2 top-1/2 -translate-y-1/2 size-3 text-muted-foreground pointer-events-none" />
              </div>
            </div>
          </div>

          {/* 2. Cart Items Table Header & Scrollable List */}
          <div className="flex-1 min-h-0 flex flex-col bg-background/50">
            {/* Header sub-bar */}
            <div className="px-3.5 py-2 bg-muted/40 border-b border-border/60 flex items-center justify-between shrink-0">
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <ShoppingBag className="size-3.5 text-primary" />
                Cart Items
              </span>
              {/* <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-background border border-border/60 text-foreground">
                {(formValues.items || []).length} items
              </span> */}
            </div>

            {/* Scrollable Cart List */}
            <div className="flex-1 overflow-y-auto">
              <form.Field name="items" mode="array">
                {(itemsField) => {
                  const items = itemsField.state.value || [];

                  if (items.length === 0) {
                    return (
                      <div className="h-full min-h-40 flex flex-col items-center justify-center text-center p-6 select-none">
                        <div className="size-12 rounded-2xl bg-muted/80 border border-border/60 text-muted-foreground flex items-center justify-center mb-2.5 shadow-2xs">
                          <ShoppingCart className="size-5 opacity-60" />
                        </div>
                        <p className="font-semibold text-xs text-foreground">
                          Your cart is empty
                        </p>
                      </div>
                    );
                  }

                  return (
                    <table className="w-full text-xs border-collapse">
                      {/* Shared header — rendered once */}
                      <thead className="sticky top-0 z-10 bg-muted/60 border-b border-border/60 backdrop-blur-sm">
                        <tr>
                          <th className="px-3.5 py-2 text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Product</th>
                          <th className="px-3 py-2 text-center text-[10px] font-semibold text-muted-foreground uppercase tracking-wider w-28">Qty</th>
                          <th className="px-3 py-2 text-center text-[10px] font-semibold text-muted-foreground uppercase tracking-wider w-24">Price</th>
                          <th className="px-3 py-2 text-center text-[10px] font-semibold text-muted-foreground uppercase tracking-wider w-24">Serial</th>
                          <th className="px-3 py-2 text-center text-[10px] font-semibold text-muted-foreground uppercase tracking-wider w-8"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/40">
                        {items.map((_: any, index: number) => (
                          <PosItemRow
                            key={index}
                            form={form}
                            index={index}
                            products={productList}
                            isOpenModal={activeSerialRowIndex === index}
                            onCloseModal={() => {
                              if (activeSerialRowIndex === index) {
                                setActiveSerialRowIndex(null);
                              }
                            }}
                            onRemove={() => itemsField.removeValue(index)}
                          />
                        ))}
                      </tbody>
                    </table>
                  );
                }}
              </form.Field>
            </div>
          </div>

          {/* 3. Bottom Checkout & Totals Panel */}
          <form.Subscribe
            selector={(state) =>
              [
                state.values.items,
                state.values.discount,
                state.values.paymentOption,
              ] as const
            }
          >
            {([items, discount, paymentOption]) => {
              const subtotal = (items || []).reduce(
                (sum: number, item: any) =>
                  sum +
                  (Number(item.price) || 0) * (Number(item.quantity) || 0) -
                  (Number(item.itemDiscount) || 0),
                0
              );

              const grandTotal = Math.max(subtotal - (Number(discount) || 0), 0);

              return (
                <div className="shrink-0 border-t border-border/70 bg-card p-3.5 space-y-3">
                  {/* Simple Summary & Total Section */}
                  <div className="space-y-2">
                    {/* Subtotal & Discount Rows */}
                    <div className="space-y-1.5 text-xs">
                      <div className="flex justify-between items-center text-muted-foreground text-[11px]">
                        <span className="font-medium flex items-center gap-1.5">
                          <Receipt className="size-3.5 text-muted-foreground/70" />
                          Subtotal
                          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-muted font-normal text-muted-foreground">
                            {items?.length || 0} {items?.length === 1 ? "item" : "items"}
                          </span>
                        </span>
                        <span className="font-semibold font-mono text-foreground text-xs">
                          {formatCurrency(subtotal)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-muted-foreground flex items-center gap-1.5">
                          <Tag className="size-3.5 text-amber-500" />
                          Discount
                        </span>
                        <div className="flex items-center gap-1.5">
                          {Number(discount) > 0 && (
                            <span className="text-[10px] font-mono font-bold text-rose-500 bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/20">
                              -{formatCurrency(Number(discount))}
                            </span>
                          )}
                          <div className="relative w-22">
                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground font-mono">
                              $
                            </span>
                            <Input
                              type="number"
                              min="0"
                              value={Number(discount) || 0}
                              onChange={(e) =>
                                form.setFieldValue("discount", Math.max(0, Number(e.target.value) || 0))
                              }
                              className="h-6.5 text-[11px] text-right font-mono pl-5 pr-1.5 bg-muted/40 hover:bg-muted/70 focus:bg-background rounded-md border-border/60 transition-colors"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Grand Total Row */}
                    <div className="pt-2 border-t border-border/60 flex items-center justify-between">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <Wallet className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                          <span className="text-[11px] font-black uppercase tracking-wider text-foreground">
                            Total Due
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-black font-mono tracking-tight text-emerald-600 dark:text-emerald-400">
                          {formatCurrency(grandTotal)}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl bg-slate-200/80 p-2">
                    <div className="grid grid-cols-4 gap-2">


                      <button
                        type="button"
                        disabled={!items || items.length === 0}
                        onClick={() => {
                          if (!items || items.length === 0) {
                            toast.error("Please add at least one product to the order");
                            return;
                          }
                          const totalDue = Math.max(subtotal - (Number(discount) || 0), 0);
                          setPaymentAmount(totalDue);
                          setPaymentMethod("CASH");
                          setPaymentBankId(Number(formValues.bankId) || 0);
                          setPaymentTransactionNo("");
                          setPaymentDate(formValues.saleDate || new Date().toISOString().split("T")[0]);
                          setIsPaymentModalOpen(true);
                        }}
                        className="flex h-20 flex-col items-center justify-center gap-2 rounded-lg border border-slate-300 bg-slate-100 text-slate-700 transition hover:bg-slate-200 cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <Wallet className="size-5" />
                        <span className="text-sm font-medium">Payment</span>
                      </button>
                    </div>
                  </div>



                  {/* Pay Now Button */}
                  <Button
                    type="button"
                    disabled={isPending || !items || items.length === 0}
                    onClick={() => {
                      if (!items || items.length === 0) {
                        toast.error("Please add at least one product to the order");
                        return;
                      }
                      setIsPaymentModalOpen(true);
                    }}
                    className="w-full h-11.5 rounded-xl  text-white font-bold text-sm shadow-md shadow-emerald-600/20 hover:shadow-emerald-600/30 transition-all flex items-center justify-between px-4 active:scale-[0.99] cursor-pointer group disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none disabled:active:scale-100"
                  >
                    {isPending ? (
                      <span className="w-full text-center flex items-center justify-center gap-2">
                        <span className="size-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                        <span>Processing Order...</span>
                      </span>
                    ) : (
                      <>
                        <span className="flex items-center justify-center gap-2">
                          <span className="size-5.5 rounded-md bg-white/20 flex items-center justify-center">
                            <CheckCircle2 className="size-3.5 text-white" />
                          </span>
                          <span className="tracking-wide">Completed</span>
                        </span>

                      </>
                    )}
                  </Button>
                </div>
              );
            }}
          </form.Subscribe>
        </aside>
      </div >

      <PaymentForm
        open={isPaymentModalOpen}
        setOpen={(open) => {
          // When modal closes after a successful payment, refresh stock & sales
          if (!open && paymentSubmittedRef.current) {
            paymentSubmittedRef.current = false;
            void queryClient.invalidateQueries({ queryKey: useProduct.keys.all });
            void queryClient.invalidateQueries({ queryKey: useProductSerial.keys.all });
            void queryClient.invalidateQueries({ queryKey: useSale.keys.all });
          }
          setIsPaymentModalOpen(open);
        }}
        payment={null}
        mode="sale"
        saleId={isEditing && id ? Number(id) : undefined}
        orderRef={formValues.reference}
        amount={Math.max(
          (formValues.items || []).reduce(
            (sum: number, item: any) =>
              sum +
              (Number(item.price) || 0) * (Number(item.quantity) || 0) -
              (Number(item.itemDiscount) || 0),
            0,
          ) - (Number(formValues.discount) || 0),
          0,
        )}
        onPaymentSubmit={async (request) => {
          try {
            const savedSaleId = await submitSale(request);
            if (!savedSaleId) return false;
            request.saleId = savedSaleId;
            paymentSubmittedRef.current = true;
            // Navigate to invoice page
            navigate(ROUTERS.SALE_INVOICE.replace(":id", String(savedSaleId)));
            return true;
          } catch (error: any) {
            const errorMsg =
              error?.response?.data?.message ||
              (typeof error?.response?.data === "string" ? error.response.data : null) ||
              error?.message ||
              "Failed to save sale.";
            toast.error(errorMsg);
            return false;
          }
        }}
      />

      {/* 5. Add Customer Modal */}
      <FormCustomer
        open={isCustomerDialogOpen}
        setOpen={setIsCustomerDialogOpen}
        customer={null}
        onCreated={(res: any) => {
          if (res?.payload?.id) {
            form.setFieldValue("customerId", res.payload.id);
          }
        }}
      />

      {/* Hidden Submit Form */}
      <form
        id="sale-form"
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
        className="hidden"
      />
    </div>
  );
}

/* ===========================================================
   POS CART ITEM ROW COMPONENT
=========================================================== */

function PosItemRow({
  form,
  index,
  products,
  onRemove,
  isOpenModal,
  onCloseModal,
}: {
  form: any;
  index: number;
  products: ProductResponse[];
  onRemove: () => void;
  isOpenModal: boolean;
  onCloseModal: () => void;
}) {
  const productId = useFormStore(
    form.store,
    (state: any) => state.values.items[index]?.productId
  );

  const quantity = useFormStore(
    form.store,
    (state: any) => Number(state.values.items[index]?.quantity) || 1
  );

  const price = useFormStore(
    form.store,
    (state: any) => Number(state.values.items[index]?.price) || 0
  );

  const serialNumberIds = useFormStore(
    form.store,
    (state: any) => state.values.items[index]?.serialNumberIds || []
  );

  const [isSerialModalOpen, setIsSerialModalOpen] = useState(isOpenModal);
  const [scanValue, setScanValue] = useState("");
  const [modalSearch, setModalSearch] = useState("");
  const [serialError, setSerialError] = useState("");

  useEffect(() => {
    setIsSerialModalOpen(isOpenModal);
  }, [isOpenModal]);

  const selectedProduct = products.find((p) => p.id === Number(productId));

  /* -------------------------------------------------------
     SERIALS DATA
  ------------------------------------------------------- */

  const { data: serialsResponse } = useProductSerial.useGetAllProductSerial(
    {
      productId: Number(productId),
      page: 0,
      size: 100,
    },
    {
      enabled: Number(productId) > 0,
    }
  );

  const availableSerials = (
    (serialsResponse as any)?.payload?.data ??
    (serialsResponse as any)?.data ??
    []
  ).filter(
    (serial: any) =>
      Number(serial.quantity ?? 0) > 0 && serial.status !== "OUT_OF_STOCK"
  );

  const filteredAvailableSerials = availableSerials.filter((s: any) => {
    if (!modalSearch.trim()) return true;
    const q = modalSearch.toLowerCase();
    const barcode = (s.barcode || s.barCode || s.serialNumber || `ID #${s.id}`).toLowerCase();
    const store = (s.storeName || s.store?.name || "").toLowerCase();
    return barcode.includes(q) || store.includes(q);
  });

  const handleAutoSelect = () => {
    const needed = quantity;
    const autoIds = availableSerials.slice(0, needed).map((s: any) => s.id);
    form.setFieldValue(`items[${index}].serialNumberIds`, autoIds);
    setSerialError("");
  };



  const subtotal = price * quantity;
  const serialsComplete = serialNumberIds.length === quantity;

  const toggleSerial = (serial: any) => {
    if (Number(serial.quantity ?? 0) <= 0 || serial.status === "SOLD") {
      setSerialError("This serial is not available.");
      return;
    }

    const current = [...serialNumberIds];
    const targetIndex = current.indexOf(serial.id);

    if (targetIndex >= 0) {
      current.splice(targetIndex, 1);
    } else {
      if (current.length >= quantity) {
        setSerialError(`Maximum ${quantity} serial numbers allowed.`);
        return;
      }
      current.push(serial.id);
    }

    setSerialError("");
    form.setFieldValue(`items[${index}].serialNumberIds`, current);
  };

  const handleModalScan = () => {
    const code = scanValue.trim().toLowerCase();
    if (!code) return;

    const matched = availableSerials.find(
      (serial: any) =>
        (serial.barcode || serial.barCode || "").toLowerCase() === code
    );

    if (!matched) {
      setSerialError("Barcode not found or unavailable.");
      return;
    }

    toggleSerial(matched);
    setScanValue("");
  };

  return (
    <>
      {/* Data row */}
      <tr className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
        {/* Product name */}
        <td className="px-3.5 py-2.5">
          <span className="font-semibold text-xs text-slate-800 dark:text-slate-100 truncate block max-w-[160px]">
            {selectedProduct?.name || `Product #${productId}`}
          </span>
        </td>

        {/* Qty Stepper */}
        <td className="px-3 py-2.5 text-center">
          <div className="flex items-center justify-center border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden h-7 bg-white dark:bg-slate-800 w-fit mx-auto">
            <button
              type="button"
              className="size-7 flex items-center justify-center text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
              onClick={() => {
                if (quantity <= 1) return;
                const newQuantity = quantity - 1;
                form.setFieldValue(`items[${index}].quantity`, newQuantity);
                if (serialNumberIds.length > newQuantity) {
                  form.setFieldValue(
                    `items[${index}].serialNumberIds`,
                    serialNumberIds.slice(0, newQuantity)
                  );
                }
              }}
            >
              <Minus className="size-3" />
            </button>
            <span className="w-8 text-center text-xs font-bold font-mono text-slate-800 dark:text-slate-200">
              {quantity}
            </span>
            <button
              type="button"
              className="size-7 flex items-center justify-center text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
              onClick={() => form.setFieldValue(`items[${index}].quantity`, quantity + 1)}
            >
              <Plus className="size-3" />
            </button>
          </div>
        </td>

        {/* Price */}
        <td className="px-3 py-2.5 text-center">
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 tabular-nums">
            {formatCurrency(price)}
          </span>
        </td>

        {/* Serial badge */}
        <td className="px-3 py-2.5 text-center">
          <button
            type="button"
            onClick={() => setIsSerialModalOpen(true)}
            className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-semibold border transition cursor-pointer ${serialsComplete && serialNumberIds.length > 0
              ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800"
              : "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800"
              }`}
          >
            <Hash className="size-3" />
            <span>{serialNumberIds.length}/{quantity}</span>
          </button>
        </td>

        {/* Delete */}
        <td className="px-3 py-2.5 text-center">
          <button
            type="button"
            onClick={onRemove}
            className="text-slate-400 hover:text-rose-500 transition p-1"
          >
            <Trash2 className="size-3.5" />
          </button>
        </td>
      </tr>

      {/* Serial Numbers Modal */}
      <Dialog
        open={isSerialModalOpen}
        onOpenChange={(open) => {
          setIsSerialModalOpen(open);
          if (!open) onCloseModal();
        }}
      >
        <DialogContent className="sm:max-w-135 max-h-[85vh] p-0 overflow-hidden bg-background rounded-2xl border border-border/60 shadow-2xl flex flex-col">
          {/* Modal Header */}
          <DialogHeader className="px-5 py-4 border-b border-border/60 bg-muted/20 shrink-0">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0 space-y-0.5">
                <DialogTitle className="text-base font-bold text-foreground flex items-center gap-2">
                  <Hash className="size-4 text-primary" />
                  Select Serial Numbers
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground truncate">
                  {selectedProduct?.name || `Product ${productId}`}
                </DialogDescription>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span
                  className={`px-2.5 py-1 text-xs font-bold rounded-lg border tabular-nums ${serialsComplete
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                    : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                    }`}
                >
                  {serialNumberIds.length} / {quantity} {serialsComplete ? "✓ Selected" : "needed"}
                </span>
              </div>
            </div>
          </DialogHeader>

          {/* Scanner & Quick Actions Toolbar */}
          <div className="p-3.5 border-b border-border/60 bg-muted/30 space-y-2.5 shrink-0">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <ScanLine className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  autoFocus
                  value={scanValue}
                  onChange={(e) => setScanValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleModalScan();
                    }
                  }}
                  placeholder="Scan serial or barcode and press Enter..."
                  className="pl-9 h-9 text-xs rounded-xl bg-background border-border/60"
                />
              </div>
              <Button
                type="button"
                size="sm"
                onClick={handleModalScan}
                className="h-9 px-4 rounded-xl text-xs font-semibold"
              >
                Add
              </Button>
            </div>

            {serialError && (
              <div className="flex items-center gap-1.5 text-xs text-rose-500 font-medium px-1">
                <AlertTriangle className="size-3.5 shrink-0" />
                <span>{serialError}</span>
              </div>
            )}

            {/* Quick action shortcuts */}
            <div className="flex items-center justify-between pt-0.5 text-xs">
              {/* <div className="relative w-44 sm:w-56">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3 text-muted-foreground" />
                <Input
                  value={modalSearch}
                  onChange={(e) => setModalSearch(e.target.value)}
                  placeholder="Filter serials..."
                  className="h-7 pl-7 text-[11px] rounded-lg bg-background border-border/60"
                />
              </div> */}

              <div className="flex items-center gap-1.5">
                {availableSerials.length > 0 && serialNumberIds.length < quantity && (
                  <button
                    type="button"
                    onClick={handleAutoSelect}
                    className="px-2 py-1 text-[11px] font-medium rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition cursor-pointer"
                  >
                    Auto-Fill ({Math.min(quantity, availableSerials.length)})
                  </button>
                )}
                {/* {serialNumberIds.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearSerials}
                    className="px-2 py-1 text-[11px] font-medium rounded-lg text-muted-foreground hover:bg-muted transition cursor-pointer"
                  >
                    Clear All
                  </button>
                )} */}
              </div>
            </div>
          </div>

          {/* Serial List */}
          <div className="max-h-75 overflow-y-auto p-3 space-y-1.5 flex-1">
            {filteredAvailableSerials.length === 0 ? (
              <div className="py-10 text-center text-xs text-muted-foreground">
                {modalSearch
                  ? "No serial numbers matched your filter."
                  : "No active serial numbers found for this product."}
              </div>
            ) : (
              filteredAvailableSerials.map((serial: any) => {
                const isSelected = serialNumberIds.includes(serial.id);
                const barcode = serial.barcode || serial.barCode || serial.serialNumber || `${serial.id}`;
                // const store = serial.storeName || serial.store?.name;

                return (
                  <div
                    key={serial.id}
                    onClick={() => toggleSerial(serial)}
                    className={`flex items-center justify-between p-2.5 rounded-xl border transition cursor-pointer text-xs ${isSelected
                      ? "border-primary bg-primary/10 text-foreground font-semibold shadow-xs"
                      : "border-border/60 hover:bg-muted/40 text-foreground/90"
                      }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`size-4.5 rounded-md border flex items-center justify-center text-[10px] shrink-0 transition-colors ${isSelected
                          ? "bg-primary border-primary text-primary-foreground font-bold"
                          : "border-border/70 bg-background"
                          }`}
                      >
                        {isSelected && "✓"}
                      </div>
                      <span className="font-mono text-xs truncate">{barcode}</span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {/* {store && (
                        <span className="text-[10px] text-muted-foreground bg-muted/60 px-1.5 py-0.5 rounded">
                          {store}
                        </span>
                      )} */}
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
                        Available
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Modal Footer */}
          <div className="px-5 py-3.5 border-t border-border/60 bg-muted/20 flex items-center justify-between gap-3 shrink-0 rounded-b-2xl">
            <div className="text-xs text-muted-foreground">
              <span className="font-semibold text-foreground">{serialNumberIds.length}</span> of{" "}
              <span className="font-semibold text-foreground">{quantity}</span> selected
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsSerialModalOpen(false);
                  onCloseModal();
                }}
                className="rounded-xl px-4 text-xs font-medium"
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() => {
                  setIsSerialModalOpen(false);
                  onCloseModal();
                }}
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl px-4 text-xs gap-1.5 shadow-sm"
              >
                <Check className="size-3.5" />
                Done
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}