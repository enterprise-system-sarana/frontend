import { useEffect, useMemo, useRef, useState } from "react";
import { useForm, useStore as useFormStore } from "@tanstack/react-form";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Check,
  Package,
  Plus,
  ScanLine,
  Search,
  Trash2,
  Wallet,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FieldGroup } from "@/components/ui/field";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import FormTextField, {
  FormSelectField,
} from "@/components/ui/FormTextField";

import { Status } from "@/types/enum/status";
import {
  PurchaseSchema,
  type PurchaseFormValues,
} from "@/types/purchases/Purchase";

import { usePurchase } from "@/hooks/purchases/usePurchase";
import { useSupplier } from "@/hooks/purchases/useSupplier";
import { useStore } from "@/hooks/inventory/useStore";
import { useProduct } from "@/hooks/product/useProduct";
import { useBank } from "@/hooks/finance/useBank";

import FormSupplier from "@/pages/purchases/supplier/SupplierForm";
import FormBank from "@/pages/finance/bank/BankForm";
import PaymentForm from "@/pages/sales/payment/PaymentForm";

import { ROUTERS } from "@/constants/Route";

import type { StoreResponse } from "@/types/inventory/Store";
import type { SupplierResponse } from "@/types/purchases/Supplier";
import type { ProductResponse } from "@/types/product/Product";

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value || 0);
}

function emptyItem() {
  return {
    productId: 0,
    productName: "",
    quantity: 1,
    cost: 0,
    price: 0,
    subtotal: 0,
    serialNumbers: [] as string[],
  };
}

function getTodayDate() {
  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

function initials(name?: string) {
  if (!name) return "?";
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

/* -------------------------------------------------------------------------- */
/* Main Form                                                                  */
/* -------------------------------------------------------------------------- */

export default function PurchaseForm() {
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id);
  const navigate = useNavigate();

  /* ------------------------------- Load data ------------------------------ */

  const { data: suppliers } = useSupplier.useGetAllSupplier({ page: 1, size: 1000 });
  const { data: banks } = useBank.useGetAllBank({ page: 1, size: 1000 });
  const { data: stores } = useStore.useGetAllStore({ page: 1, size: 1000 });
  const { data: products } = useProduct.useGetAllProduct({ page: 1, size: 1000 });

  const productList: ProductResponse[] =
    products?.payload?.data ?? products?.data ?? products?.payload ?? [];
  const supplierList: SupplierResponse[] =
    suppliers?.payload?.data ?? suppliers?.data ?? suppliers?.payload ?? [];
  const storeList: StoreResponse[] =
    stores?.payload?.data ?? stores?.data ?? stores?.payload ?? [];
  const bankList: any[] =
    banks?.payload?.data ?? banks?.data ?? banks?.payload ?? [];

  const { data: existingPurchase, isLoading: isPurchaseLoading } =
    usePurchase.GetPurchaseById(Number(id), {
      enabled: isEditing,
    });

  const purchaseDetail =
    existingPurchase?.payload?.data ??
    existingPurchase?.payload ??
    existingPurchase?.data ??
    existingPurchase;

  /* ------------------------------- Mutations ------------------------------ */

  const createPurchase = usePurchase.Create();
  const updatePurchase = usePurchase.Update();
  const isPending = createPurchase.isPending || updatePurchase.isPending;

  /* -------------------------------- State -------------------------------- */

  const [productSearch, setProductSearch] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [serialError, setSerialError] = useState("");
  const [isSupplierDialogOpen, setIsSupplierDialogOpen] = useState(false);
  const [bankFormOpen, setBankFormOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  const searchBoxRef = useRef<HTMLDivElement>(null);

  /* -------------------------------- Form --------------------------------- */

  const form = useForm({
    defaultValues: {
      referenceNo: "",
      purchaseDate: getTodayDate(),
      note: "",
      supplierId: 1,
      storeId: 1,
      bankId: 1,
      discount: 0,
      total: 0,
      grandTotal: 0,
      paidAmount: 0,
      paymentStatus: "PENDING",
      status: Status.ACTIVE,
      items: [emptyItem()],
    } as PurchaseFormValues,

    validators: {
      onSubmit: PurchaseSchema,
    },

    onSubmit: async ({ value }) => {
      const missingSerials = value.items.some((item: any) => {
        const serials = (item.serialNumbers ?? [])
          .map((serial: string) => serial.trim())
          .filter(Boolean);
        const quantity = Math.max(0, Number(item.quantity) || 0);
        return serials.length !== quantity || new Set(serials).size !== serials.length;
      });

      if (missingSerials) {
        setSerialError("Each product needs one unique serial number for every unit.");
        return;
      }

      setSerialError("");

      const items = value.items.map((item: any) => ({
        productId: Number(item.productId),
        quantity: Number(item.quantity),
        costPrice: Number(item.cost),
        price: Number(item.price) || 0,
        serialNumbers: (item.serialNumbers ?? []).filter(Boolean),
      }));

      const total = items.reduce(
        (sum: number, item: any) => sum + item.costPrice * item.quantity,
        0,
      );

      const discount = Number(value.discount) || 0;
      const grandTotal = Math.max(total - discount, 0);
      const paidAmount = Number(value.paidAmount) || 0;

      const paymentStatus =
        paidAmount >= grandTotal && grandTotal > 0
          ? "PAID"
          : paidAmount > 0
            ? "PARTIAL"
            : "PENDING";

      const payload = {
        ...value,
        supplierId: Number(value.supplierId),
        storeId: Number(value.storeId),
        bankId: Number(value.bankId),
        discount,
        paidAmount,
        paymentStatus,
        total,
        grandTotal,
        items,
      };

      if (isEditing && id) {
        await updatePurchase.mutateAsync({ id: Number(id), request: payload });
      } else {
        await createPurchase.mutateAsync(payload);
      }

      navigate(ROUTERS.PURCHASE);
    },
  });

  /* ----------------------------- Form values ----------------------------- */

  const formValues = useFormStore(form.store, (state) => state.values);

  /* ------------------------- Calculate totals ---------------------------- */

  useEffect(() => {
    const itemsTotal = (formValues.items || []).reduce(
      (sum: number, item: any) =>
        sum + (Number(item.cost) || 0) * (Number(item.quantity) || 0),
      0,
    );

    const discount = Number(formValues.discount) || 0;
    const grandTotal = Math.max(itemsTotal - discount, 0);
    const paidAmount = Number(formValues.paidAmount) || 0;

    if (!isEditing && (paidAmount === 0 || paidAmount === grandTotal)) {
      form.setFieldValue("paidAmount", grandTotal);
    }

    form.setFieldValue("total", itemsTotal);
    form.setFieldValue("grandTotal", grandTotal);

    const paymentStatus =
      paidAmount >= grandTotal && grandTotal > 0
        ? "PAID"
        : paidAmount > 0
          ? "PARTIAL"
          : "PENDING";

    if (formValues.paymentStatus !== paymentStatus) {
      form.setFieldValue("paymentStatus", paymentStatus);
    }
  }, [formValues.items, formValues.discount, formValues.paidAmount, isEditing]);

  /* ----------------------------- Edit mode ------------------------------- */

  useEffect(() => {
    const purchase = purchaseDetail;
    if (!purchase || typeof purchase !== "object") return;

    const supplierId = purchase.supplierId ?? purchase.supplier?.id ?? 0;
    const storeId = purchase.storeId ?? purchase.store?.id ?? 1;
    const bankId = purchase.bankId ?? purchase.bank?.id ?? 1;

    const formattedDate = purchase.purchaseDate
      ? String(purchase.purchaseDate).split("T")[0]
      : getTodayDate();

    const rawItems =
      purchase.items ??
      purchase.purchaseItems ??
      purchase.purchaseDetails ??
      [];

    form.reset({
      referenceNo: purchase.referenceNo ?? "",
      purchaseDate: formattedDate,
      note: purchase.note ?? "",
      supplierId,
      storeId,
      bankId,
      discount: purchase.discount ?? 0,
      total: purchase.total ?? 0,
      grandTotal: purchase.grandTotal ?? 0,
      paidAmount: purchase.paidAmount ?? 0,
      paymentStatus: purchase.paymentStatus ?? "PENDING",
      status: purchase.status ?? Status.ACTIVE,
      items: rawItems.length
        ? rawItems.map((item: any) => ({
          productId:
            item.productId ??
            item.product?.id ??
            item.product_id ??
            0,
          productName:
            item.productName ??
            item.product?.name ??
            item.product_name ??
            item.name ??
            "",
          quantity: item.quantity ?? 1,
          cost: item.costPrice ?? item.cost ?? item.product?.costPrice ?? 0,
          price: item.price ?? item.product?.salePrice ?? 0,
          subtotal:
            (item.costPrice ?? item.cost ?? item.product?.costPrice ?? 0) *
            (item.quantity ?? 1),
          serialNumbers: (item.serialNumbers ?? []).map((serial: any) =>
            typeof serial === "string"
              ? serial
              : serial?.barcode ?? serial?.serialNumber ?? "",
          ),
        }))
        : [emptyItem()],
    });
  }, [purchaseDetail]);

  /* ------------------------------ Products ------------------------------- */

  const filteredProducts = useMemo(() => {
    const search = productSearch.trim().toLowerCase();
    if (!search) return [];

    return productList
      .filter((item) =>
        [item.code, item.modelName, item.brandName, item.categoryName, item.name]
          .filter(Boolean)
          .some((value) => value.toLowerCase().includes(search)),
      )
      .slice(0, 6);
  }, [productSearch, productList]);

  const addProduct = (product: ProductResponse) => {
    const cost = Number(product.costPrice ?? 0);

    form.setFieldValue("items", [
      ...formValues.items,
      {
        ...emptyItem(),
        productId: product.id,
        productName: product.name,
        cost,
        price: Number(product.salePrice ?? 0),
        subtotal: cost,
      },
    ]);

    setProductSearch("");
    setIsSearchOpen(false);
  };

  const addProductFromSearch = () => {
    if (filteredProducts[0]) addProduct(filteredProducts[0]);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchBoxRef.current &&
        !searchBoxRef.current.contains(event.target as Node)
      ) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (isEditing && isPurchaseLoading && !purchaseDetail) {
    return (
      <div className="flex min-h-[60vh] w-full items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-3 size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading purchase details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-muted/30 pb-16">
      {/* ------------------------------------------------------------------ */}
      {/* Header                                                            */}
      {/* ------------------------------------------------------------------ */}

      <div className="border-b bg-background/95 backdrop-blur supports-\[backdrop-filter]:bg-background/80">
        <div className="w-full px-4 py-3">
          {/* Breadcrumb */}
          {/* <div className="mb-3 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Package className="size-3.5" />
            <span className="font-medium text-primary">Purchasing & Inventory</span>
            {/* <span className="mx-1">›</span> */}
          {/* <span>{isEditing ? "Edit Purchase" : "Stock Receiving"}</span> */}


          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => navigate(-1)}
                className="shrink-0 rounded-full"
              >
                <ArrowLeft className="size-5" />
              </Button>

              <div className="flex items-center gap-3">
                <form.Subscribe selector={(state) => state.values.referenceNo}>
                  {(refNo) => (
                    <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
                      {refNo || (isEditing ? "Edit Purchase" : "New Purchase")}
                    </h1>
                  )}
                </form.Subscribe>

                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${isEditing
                      ? "bg-blue-500/15 text-blue-600 border border-blue-500/25"
                      : "bg-amber-500/15 text-amber-600 border border-amber-500/25"
                      }`}
                  >
                    <span
                      className={`size-1.5 rounded-full ${isEditing ? "bg-blue-500" : "bg-amber-500"
                        }`}
                    />
                    {isEditing ? "Editing" : "Draft Intake"}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                className="hidden rounded-lg text-muted-foreground sm:inline-flex"
                onClick={() => navigate(-1)}
              >
                Discard
              </Button>

              <Button
                type="submit"
                form="purchase-form"
                variant="outline"
                disabled={isPending}
                className="hidden rounded-lg sm:inline-flex"
              >
                Save Draft
              </Button>

              <Button
                type="submit"
                form="purchase-form"
                disabled={isPending}
                className="rounded-lg bg-emerald-600 text-white hover:bg-emerald-700"
              >
                {isPending ? (
                  "Saving..."
                ) : (
                  <>
                    <Check className="mr-1.5 size-4" />
                    {isEditing ? "Update Purchase" : "Receive & Finalize Stock"}
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Main                                                               */}
      {/* ------------------------------------------------------------------ */}

      <div className="w-full p-4">
        <form
          id="purchase-form"
          onSubmit={(event) => {
            event.preventDefault();
            event.stopPropagation();
            form.handleSubmit();
          }}
        >
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
            {/* ========================================================== */}
            {/* LEFT                                                         */}
            {/* ========================================================== */}

            <div className="min-w-0 space-y-6">
              {/* -------------------------------------------------------- */}
              {/* Purchase Information                                     */}
              {/* -------------------------------------------------------- */}

              <section className="rounded-2xl border bg-card shadow-sm">
                <div className="border-b px-5 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <Package className="size-4" />
                      </div>
                      <div>
                        <h2 className="font-semibold">Purchase Information</h2>
                        {/* <p className="text-xs text-muted-foreground">
                          Origin details, supplier credentials, and intake location.
                        </p> */}
                      </div>
                    </div>
                    <span className="hidden text-xs font-medium text-muted-foreground sm:block">
                      Step 1 of 3
                    </span>
                  </div>
                </div>

                <div className="p-5">
                  <FieldGroup className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
                    <FormTextField
                      form={form}
                      name="referenceNo"
                      label="Reference number"
                      placeholder="e.g. PO-2026-001"
                      type="text"
                    />

                    <FormTextField
                      form={form}
                      name="purchaseDate"
                      label="Purchase date"
                      type="date"
                      required
                    />

                    <FormSelectField
                      form={form}
                      name="supplierId"
                      label="Supplier"
                      placeholder="Select supplier"
                      options={supplierList.map((supplier: SupplierResponse) => ({
                        value: String(supplier.id),
                        label: supplier.name,
                      }))}
                      required
                      onAdd={() => setIsSupplierDialogOpen(true)}
                    />

                    <FormSelectField
                      form={form}
                      name="storeId"
                      label="Store"
                      placeholder="Select store"
                      options={storeList.map((store: StoreResponse) => ({
                        value: String(store.id),
                        label: store.name,
                      }))}
                      required
                      onAdd={() => window.open(ROUTERS.STORE_CREATE, "_blank")}
                    />

                    <div className="md:col-span-2">
                      <FormTextField
                        form={form}
                        name="note"
                        label="Note"
                        placeholder="Add a note for this purchase..."
                        type="text"
                      />
                    </div>
                  </FieldGroup>
                </div>
              </section>

              {/* -------------------------------------------------------- */}
              {/* Products                                                   */}
              {/* -------------------------------------------------------- */}

              <section className="rounded-2xl border bg-card shadow-sm">
                <div className="border-b px-5 py-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600">
                        <Package className="size-4" />
                      </div>
                      <div>
                        <h2 className="font-semibold">Products & Inventory Intake</h2>
                        {/* <p className="text-xs text-muted-foreground">
                          Verify item costs, physical counts, and register serialized equipment.
                        </p> */}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <form.Subscribe selector={(state) => state.values.items.length}>
                        {(count) => {
                          const totalUnits = formValues.items.reduce(
                            (sum: number, item: any) => sum + (Number(item.quantity) || 0),
                            0,
                          );
                          return (
                            <div className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
                              {count} {count === 1 ? "Item" : "Items"}
                              <span className="ml-1 text-muted-foreground/60">
                                ({totalUnits}  Total)
                              </span>
                            </div>
                          );
                        }}
                      </form.Subscribe>
                      <span className="hidden text-xs font-medium text-muted-foreground sm:block">
                        Step 2 of 3
                      </span>
                    </div>
                  </div>
                </div>

                <form.Field name="items" mode="array">
                  {(itemsField) => (
                    <>
                      {/* Product search */}
                      <div className="border-b bg-muted/20 p-4">
                        <div ref={searchBoxRef} className="relative flex items-center gap-3">
                          <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

                            <Input
                              value={productSearch}
                              onChange={(event) => {
                                setProductSearch(event.target.value);
                                setIsSearchOpen(true);
                              }}
                              onFocus={() => setIsSearchOpen(true)}
                              onKeyDown={(event) => {
                                if (event.key === "Enter") {
                                  event.preventDefault();
                                  addProductFromSearch();
                                }
                                if (event.key === "Escape") {
                                  setIsSearchOpen(false);
                                }
                              }}
                              placeholder="Search product, code, model, or brand..."
                              className="h-11 rounded-xl border bg-background pl-9"
                            />

                            {isSearchOpen && productSearch.trim() && (
                              <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-20 max-h-72 overflow-y-auto rounded-xl border bg-popover p-1.5 shadow-lg">
                                {filteredProducts.length === 0 ? (
                                  <div className="px-3 py-4 text-center text-sm text-muted-foreground">
                                    No products match "{productSearch}"
                                  </div>
                                ) : (
                                  filteredProducts.map((product) => (
                                    <button
                                      key={product.id}
                                      type="button"
                                      onClick={() => addProduct(product)}
                                      className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left transition-colors hover:bg-accent"
                                    >
                                      <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-[11px] font-semibold text-primary">
                                        {initials(product.name)}
                                      </div>

                                      <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm font-medium">
                                          {product.name}
                                        </p>
                                        <p className="truncate text-xs text-muted-foreground">
                                          {[product.brandName, product.code]
                                            .filter(Boolean)
                                            .join(" · ")}
                                        </p>
                                      </div>

                                      <span className="shrink-0 text-xs font-medium text-muted-foreground">
                                        {formatCurrency(Number(product.costPrice ?? 0))}
                                      </span>
                                    </button>
                                  ))
                                )}
                              </div>
                            )}
                          </div>

                          <Button
                            type="button"
                            variant="outline"
                            className="h-11 shrink-0 rounded-xl px-4"
                            onClick={() => itemsField.pushValue(emptyItem())}
                          >
                            <Plus className="mr-2 size-4" />
                            Add another product
                          </Button>
                        </div>
                      </div>

                      {/* Serial error */}
                      {serialError && (
                        <div className="mx-4 mt-4 flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/5 px-3 py-2.5 text-sm text-destructive">
                          <X className="mt-0.5 size-4 shrink-0" />
                          <span>{serialError}</span>
                        </div>
                      )}

                      {/* Items */}
                      <div>
                        {itemsField.state.value.length === 0 ? (
                          <div className="px-5 py-16 text-center">
                            <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-2xl bg-muted">
                              <Package className="size-5 text-muted-foreground" />
                            </div>
                            <p className="font-medium">No products added yet</p>
                            <p className="mt-1 text-sm text-muted-foreground">
                              Search for a product above to start this purchase.
                            </p>
                          </div>
                        ) : (
                          <>
                            {/* Single table header for products */}
                            <div className="hidden md:grid md:grid-cols-12 gap-3 border-b bg-muted/40 px-5 py-3 text-xs font-semibold text-muted-foreground">
                              <div className="md:col-span-5">Product</div>
                              <div className="md:col-span-2">Qty</div>
                              <div className="md:col-span-2">Purchase Price($)</div>
                              <div className="md:col-span-2">Subtotal</div>
                              <div className="md:col-span-1 text-center">Action</div>
                            </div>

                            <div className="divide-y">
                              {itemsField.state.value.map((item: any, index: number) => (
                                <PurchaseItemRow
                                  key={item?.productId ? `item-${item.productId}-${index}` : `item-${index}`}
                                  form={form}
                                  index={index}
                                  products={productList}
                                  onRemove={() => itemsField.removeValue(index)}
                                />
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    </>
                  )}
                </form.Field>
              </section>
            </div>

            {/* ========================================================== */}
            {/* RIGHT / SUMMARY                                             */}
            {/* ========================================================== */}

            <aside className="xl:sticky xl:top-6 xl:self-start">
              <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
                {/* Header */}
                <div className="border-b px-5 py-4">
                  <div className="flex items-center gap-2.5">
                    <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600">
                      <Wallet className="size-4" />
                    </div>
                    <div>
                      <h2 className="font-semibold leading-tight">Purchase Summary</h2>
                      {/* <p className="text-xs text-muted-foreground">
                        Review before completing the purchase.
                      </p> */}
                    </div>
                  </div>
                </div>

                {/* Payment Fields */}
                <div className="space-y-4 border-b p-5">
                  <FormSelectField
                    form={form}
                    name="bankId"
                    label="Bank"
                    placeholder="Select bank"
                    options={bankList.map((bank: any) => ({
                      value: String(bank.id),
                      label: bank.name,
                    }))}
                    required
                    onAdd={() => setBankFormOpen(true)}
                  />

                  <FormTextField
                    form={form}
                    name="discount"
                    label="Discount"
                    placeholder="0.00"
                    type="number"
                  />

                  <div className="">
                    <FormTextField
                      form={form}
                      name="paidAmount"
                      label="Paid amount"
                      placeholder="0.00"
                      type="number"
                    />

                    <form.Subscribe
                      selector={(state) => [
                        state.values.items,
                        state.values.discount,
                        state.values.paidAmount,
                      ]}
                    >
                      {([items, discount, paidAmount]) => {
                        const subtotal = (items || []).reduce(
                          (sum: number, item: any) =>
                            sum + (Number(item.cost) || 0) * (Number(item.quantity) || 0),
                          0,
                        );
                        const discountAmount = Number(discount) || 0;
                        const grandTotal = Math.max(subtotal - discountAmount, 0);
                        const paid = Number(paidAmount) || 0;
                        const returnBack = Math.max(paid - grandTotal, 0);

                        return (
                          <div>
                            <label className="text-sm font-medium">Return</label>
                            <Input
                              readOnly
                              disabled
                              value={formatCurrency(returnBack)}
                              className="mt-2 h-10 rounded-xl bg-muted/50 font-semibold text-emerald-600 dark:text-emerald-400 cursor-not-allowed"
                            />
                          </div>
                        );
                      }}
                    </form.Subscribe>
                  </div>
                </div>

                {/* Totals & Payment Breakdown */}
                <form.Subscribe
                  selector={(state) => [
                    state.values.items,
                    state.values.discount,
                    state.values.paidAmount,
                  ]}
                >
                  {([items, discount, paidAmount]) => {
                    const subtotal = (items || []).reduce(
                      (sum: number, item: any) =>
                        sum + (Number(item.cost) || 0) * (Number(item.quantity) || 0),
                      0,
                    );

                    const discountAmount = Number(discount) || 0;
                    const grandTotal = Math.max(subtotal - discountAmount, 0);
                    const paid = Number(paidAmount) || 0;
                    const balance = Math.max(grandTotal - paid, 0);
                    const returnBack = Math.max(paid - grandTotal, 0);

                    return (
                      <div className="space-y-3 p-5">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Subtotal</span>
                          <span className="font-medium">{formatCurrency(subtotal)}</span>
                        </div>

                        {discountAmount > 0 && (
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Discount</span>
                            <span className="font-medium text-destructive">
                              -{formatCurrency(discountAmount)}
                            </span>
                          </div>
                        )}

                        <div className="mt-2 rounded-xl bg-muted/40 p-3.5">
                          <div className="flex items-baseline justify-between">
                            <span className="text-sm font-semibold">Grand total</span>
                            <span className="text-2xl font-bold tracking-tight text-primary">
                              {formatCurrency(grandTotal)}
                            </span>
                          </div>
                        </div>

                        <div className="border-t pt-3 space-y-2.5">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Paid amount</span>
                            <span className="font-semibold">{formatCurrency(paid)}</span>
                          </div>

                          {returnBack > 0 ? (
                            <div className="flex justify-between text-sm">
                              <span className="font-medium text-emerald-600 dark:text-emerald-400">
                                Return back
                              </span>
                              <span className="font-bold text-emerald-600 dark:text-emerald-400">
                                {formatCurrency(returnBack)}
                              </span>
                            </div>
                          ) : balance > 0 ? (
                            <div className="flex justify-between text-sm">
                              <span className="font-medium text-destructive">Balance due</span>
                              <span className="font-bold text-destructive">
                                {formatCurrency(balance)}
                              </span>
                            </div>
                          ) : (
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Balance due</span>
                              <span className="font-medium text-emerald-600">
                                {formatCurrency(0)}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  }}
                </form.Subscribe>
                <PaymentForm
                  open={isPaymentModalOpen}
                  setOpen={setIsPaymentModalOpen}
                  payment={null}
                  mode="purchase"
                  purchaseId={isEditing && id ? Number(id) : undefined}
                  amount={Math.max(
                    (formValues.items || []).reduce(
                      (sum: number, item: any) =>
                        sum + (Number(item.cost) || 0) * (Number(item.quantity) || 0),
                      0,
                    ) - (Number(formValues.discount) || 0),
                    0,
                  )}

                />
                {/* Actions */}
                <div className="border-t p-4">
                  <Button
                    type="button"
                    disabled={isPending}
                    onClick={() => setIsPaymentModalOpen(true)}
                    className="h-11 w-full rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
                  >
                    {isPending ? (
                      "Saving..."
                    ) : (
                      <>
                        <Check className="mr-2 size-4" />
                        {isEditing ? "Update purchase" : "Complete purchase"}
                      </>
                    )}
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    className="mt-2 h-11 w-full rounded-xl"
                    onClick={() => navigate(-1)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </aside>
          </div>
        </form>
      </div>


      {/* ------------------------------------------------------------------ */}
      {/* Dialogs                                                           */}
      {/* ------------------------------------------------------------------ */}

      <FormSupplier
        open={isSupplierDialogOpen}
        setOpen={setIsSupplierDialogOpen}
        supplier={null}
        onCreated={(response) => {
          const supplier = (response as any)?.payload ?? response;
          if (supplier?.id) {
            form.setFieldValue("supplierId", supplier.id);
          }
        }}
      />

      <FormBank open={bankFormOpen} setOpen={setBankFormOpen} bank={null} />
    </div >
  );
}

/* ========================================================================= */
/* Purchase Item Row                                                        */
/* ========================================================================= */

function PurchaseItemRow({
  form,
  index,
  products,
  onRemove,
}: {
  form: any;
  index: number;
  products: ProductResponse[];
  onRemove: () => void;
}) {
  const productId = useFormStore(
    form.store,
    (state: any) => state.values.items[index]?.productId,
  );

  const productName = useFormStore(
    form.store,
    (state: any) => state.values.items[index]?.productName,
  );

  const quantity = useFormStore(
    form.store,
    (state: any) => state.values.items[index]?.quantity,
  );

  const cost = useFormStore(
    form.store,
    (state: any) => Number(state.values.items[index]?.cost) || 0,
  );

  const serialNumbers = useFormStore(form.store, (state: any) =>
    Array.isArray(state.values.items[index]?.serialNumbers)
      ? state.values.items[index].serialNumbers
      : [],
  );

  const [isSerialDialogOpen, setIsSerialDialogOpen] = useState(false);
  const [scanValue, setScanValue] = useState("");
  const [serialDialogError, setSerialDialogError] = useState("");

  const selectedProduct = products.find((product) => product.id === Number(productId));

  useEffect(() => {
    if (selectedProduct && !productName) {
      form.setFieldValue(`items[${index}].productName`, selectedProduct.name);
    }
  }, [selectedProduct, productName, index, form]);

  const normalizedSerialNumbers = Array.isArray(serialNumbers)
    ? serialNumbers.map((serial) =>
      typeof serial === "string" ? serial : serial == null ? "" : String(serial),
    )
    : [];

  const expectedSerialCount = Math.max(0, Number(quantity) || 0);

  const enteredSerialCount = normalizedSerialNumbers.filter((serial: string) =>
    serial.trim(),
  ).length;

  const serialsComplete =
    expectedSerialCount > 0 && enteredSerialCount === expectedSerialCount;

  /* --------------------------- Add serial ------------------------------- */

  const addSerialNumber = () => {
    const serial = scanValue.trim();

    if (!serial) {
      setSerialDialogError("Enter or scan a serial number.");
      return;
    }

    const duplicate = normalizedSerialNumbers.some(
      (value: string) => value.trim().toLowerCase() === serial.toLowerCase(),
    );

    if (duplicate) {
      setSerialDialogError("This serial number has already been added.");
      return;
    }

    const nextIndex = normalizedSerialNumbers.findIndex((value: string) => !value.trim());

    if (nextIndex === -1) {
      setSerialDialogError("All serial numbers for this quantity have been added.");
      return;
    }

    form.setFieldValue(`items[${index}].serialNumbers[${nextIndex}]`, serial);
    setScanValue("");
    setSerialDialogError("");
  };

  /* ---------------------------- Subtotal -------------------------------- */

  useEffect(() => {
    form.setFieldValue(`items[${index}].subtotal`, cost * (Number(quantity) || 0));
  }, [quantity, cost]);

  /* -------------------------- Serial length ------------------------------ */

  useEffect(() => {
    const qty = Math.max(0, Number(quantity) || 0);

    form.setFieldValue(`items[${index}].serialNumbers`, (old: string[] = []) => {
      const next = old.slice(0, qty);
      while (next.length < qty) next.push("");
      return next;
    });
  }, [quantity]);

  return (
    <div className="px-5 py-3.5 transition-colors hover:bg-muted/10">
      <div className="grid grid-cols-12 gap-3 items-center">
        <div className="col-span-12 md:col-span-5">
          <span className="mb-1 block text-xs font-medium text-muted-foreground md:hidden">
            Product
          </span>
          <form.Field name={`items[${index}].productId`}>
            {(field: any) => {
              const currentVal = field.state.value;
              const currentValStr =
                currentVal && Number(currentVal) > 0 ? String(currentVal) : "";
              const displayName =
                selectedProduct?.name ||
                productName ||
                (currentValStr ? `Product #${currentValStr}` : "");

              const existsInProducts = products.some(
                (p) => String(p.id) === currentValStr,
              );

              return (
                <Select
                  value={currentValStr}
                  onValueChange={(value) => {
                    const numVal = Number(value);
                    field.handleChange(numVal);
                    const prod = products.find((p) => p.id === numVal);
                    if (prod) {
                      const itemCost = Number(prod.costPrice ?? 0);
                      form.setFieldValue(`items[${index}].productName`, prod.name);
                      form.setFieldValue(`items[${index}].cost`, itemCost);
                      form.setFieldValue(`items[${index}].price`, Number(prod.salePrice ?? 0));
                      form.setFieldValue(`items[${index}].subtotal`, itemCost * (Number(quantity) || 0));
                    }
                    setSerialDialogError("");
                    setScanValue("");
                  }}
                >
                  <SelectTrigger className="h-10 w-full rounded-xl bg-background">
                    <SelectValue placeholder="Select product">
                      {displayName || undefined}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {Boolean(currentValStr) && !existsInProducts && (
                      <SelectItem value={currentValStr}>
                        {displayName}
                      </SelectItem>
                    )}
                    {products.map((product) => (
                      <SelectItem key={product.id} value={String(product.id)}>
                        {product.name} {product.code ? `(${product.code})` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              );
            }}
          </form.Field>
        </div>

        <div className="col-span-4 md:col-span-2">
          <span className="mb-1 block text-xs font-medium text-muted-foreground md:hidden">
            Qty
          </span>
          <form.Field name={`items[${index}].quantity`}>
            {(field: any) => (
              <Input
                type="number"
                min={1}
                value={field.state.value ?? ""}
                onChange={(e) =>
                  field.handleChange(e.target.value === "" ? 0 : Number(e.target.value))
                }
                placeholder="Qty"
                className="h-10 rounded-xl bg-background text-center font-medium"
              />
            )}
          </form.Field>
        </div>

        <div className="col-span-4 md:col-span-2">
          <span className="mb-1 block text-xs font-medium text-muted-foreground md:hidden">
            Purchase Price($)
          </span>
          <form.Field name={`items[${index}].cost`}>
            {(field: any) => (
              <Input
                type="number"
                min={0}
                step="any"
                value={field.state.value ?? ""}
                onChange={(e) =>
                  field.handleChange(e.target.value === "" ? 0 : Number(e.target.value))
                }
                placeholder="0.00"
                className="h-10 rounded-xl bg-background text-right font-medium"
              />
            )}
          </form.Field>
        </div>

        <div className="col-span-3 md:col-span-2">
          <span className="mb-1 block text-xs font-medium text-muted-foreground md:hidden">
            Subtotal
          </span>
          <form.Field name={`items[${index}].subtotal`}>
            {(field: any) => (
              <Input
                type="number"
                disabled
                value={field.state.value ?? 0}
                className="h-10 rounded-xl bg-muted/40 text-right font-semibold text-foreground cursor-not-allowed"
              />
            )}
          </form.Field>
        </div>

        <div className="col-span-1 md:col-span-1 flex items-center justify-center">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onRemove}
            title="Remove product"
            className="size-9 rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      </div>

      {/* Product metadata */}
      {/* 
      {selectedProduct && (
        <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 rounded-xl bg-muted/30 px-3 py-2.5 text-xs">
          {selectedProduct.brandName && (
            <div>
              <span className="text-muted-foreground">Brand</span>{" "}
              <span className="font-medium">{selectedProduct.brandName}</span>
            </div>
          )}

          {selectedProduct.categoryName && (
            <div>
              <span className="text-muted-foreground">Category</span>{" "}
              <span className="font-medium">{selectedProduct.categoryName}</span>
            </div>
          )}

          {selectedProduct.reorderLevel !== undefined && (
            <div>
              <span className="text-muted-foreground">Reorder level</span>{" "}
              <span className="font-medium">{selectedProduct.reorderLevel}</span>
            </div>
          )}
        </div>
      )} */}

      {/* Serial section */}

      {(Number(productId) > 0 || Boolean(productName)) && (
        <div className="mt-4 border-t pt-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold">Serial numbers</h3>

                <span
                  className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${serialsComplete
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-amber-200 bg-amber-50 text-amber-700"
                    }`}
                >
                  {enteredSerialCount}/{expectedSerialCount}
                </span>
              </div>

              {/* <p className="mt-1 text-xs text-muted-foreground">
                One unique serial number is required for each unit.
              </p> */}
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-lg"
              onClick={() => {
                setSerialDialogError("");
                setIsSerialDialogOpen(true);
              }}
            >
              <ScanLine className="mr-2 size-4" />
              Scan serials
            </Button>
          </div>

          {/* Serial inputs */}

          <form.Field name={`items[${index}].serialNumbers`} mode="array">
            {(serialField: any) => (
              <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {(Array.isArray(serialField.state.value) ? serialField.state.value : []).map(
                  (_: string, serialIndex: number) => (
                    <form.Field
                      key={serialIndex}
                      name={`items[${index}].serialNumbers[${serialIndex}]`}
                    >
                      {(sf: any) => (
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-muted-foreground">
                            #{serialIndex + 1}
                          </span>

                          <Input
                            value={sf.state.value ?? ""}
                            onChange={(event) => sf.handleChange(event.target.value)}
                            placeholder="Enter Serial Number"
                            className="h-9 rounded-lg pl-9 font-mono text-xs"
                          />
                        </div>
                      )}
                    </form.Field>
                  ),
                )}
              </div>
            )}
          </form.Field>
        </div>
      )}

      {/* Serial dialog */}

      <Dialog open={isSerialDialogOpen} onOpenChange={setIsSerialDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Scan serial numbers</DialogTitle>
            <DialogDescription>
              Scan the barcode or enter the serial / IMEI manually. Press Enter after each scan.
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-xl bg-muted/30 p-3">
            <div className="flex items-center gap-2">
              <ScanLine className="size-5 text-primary" />

              <Input
                autoFocus
                value={scanValue}
                onChange={(event) => setScanValue(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    addSerialNumber();
                  }
                }}
                placeholder="Scan barcode / IMEI..."
                className="h-11 rounded-lg bg-background font-mono"
              />
            </div>

            {serialDialogError && (
              <p className="mt-2 text-xs text-destructive">{serialDialogError}</p>
            )}
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium">Serial numbers</span>
              <span className="text-xs text-muted-foreground">
                {enteredSerialCount}/{expectedSerialCount}
              </span>
            </div>

            <div className="max-h-60 space-y-2 overflow-y-auto">
              {normalizedSerialNumbers.map((serial: string, serialIndex: number) => (
                <div key={serialIndex} className="flex items-center gap-2">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-[10px] font-bold">
                    {serialIndex + 1}
                  </div>

                  <Input
                    value={serial}
                    readOnly
                    placeholder={`Serial #${serialIndex + 1}`}
                    className="rounded-lg font-mono text-xs"
                  />

                  {serial && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="rounded-full"
                      onClick={() =>
                        form.setFieldValue(
                          `items[${index}].serialNumbers[${serialIndex}]`,
                          "",
                        )
                      }
                    >
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setScanValue("");
                setSerialDialogError("");
              }}
            >
              Clear
            </Button>

            <Button type="button" onClick={() => setIsSerialDialogOpen(false)}>
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}