import { useEffect, useRef, useState } from "react";
import { useForm, useStore as useFormStore } from "@tanstack/react-form";
import { useNavigate, useParams } from "react-router-dom";
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
import { Plus, ScanLine, Search, Trash2 } from "lucide-react";
import FormTextField, { FormSelectField } from "@/components/ui/FormTextField";
import { Status } from "@/types/enum/status";
import {
  PurchaseSchema,
  type PurchaseFormValues,
} from "@/types/purchases/Purchase";
import { usePurchase } from "@/hooks/purchases/usePurchase";
import { useSupplier } from "@/hooks/purchases/useSupplier";
import { useStore } from "@/hooks/inventory/useStore";
import { useProduct } from "@/hooks/product/useProduct";
import FormSupplier from "@/pages/purchases/supplier/SupplierForm";
import { ROUTERS } from "@/constants/Route";
import type { StoreResponse } from "@/types/inventory/Store";
import type { SupplierResponse } from "@/types/purchases/Supplier";
import type { ProductResponse } from "@/types/product/Product";
import { useBank } from "@/hooks/finance/useBank";
import FormBank from "@/pages/finance/bank/BankForm";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value || 0);
}

function emptyItem() {
  return {
    productId: 0,
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

export default function PurchaseForm() {
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id);
  const navigate = useNavigate();

  // Loaders
  const { data: suppliers } = useSupplier.useGetAllSupplier({
    page: 0,
    size: 1000,
  });

  const { data: banks } = useBank.useGetAllBank({
    page: 0,
    size: 1000,
  });
  const [bankFormOpen, setBankFormOpen] = useState(false);
  const { data: stores } = useStore.useGetAllStore({ page: 0, size: 1000 });
  const { data: products } = useProduct.useGetAllProduct({
    page: 0,
    size: 1000,
  });
  const productList: ProductResponse[] = products?.payload?.data ?? [];

  const { data: existingPurchase } = usePurchase.GetPurchaseById(Number(id), {
    enabled: isEditing,
  });
  const purchaseDetail =
    existingPurchase?.payload?.data ??
    existingPurchase?.payload ??
    existingPurchase?.data ??
    existingPurchase;

  const createPurchase = usePurchase.Create();
  const updatePurchase = usePurchase.Update();
  const isPending = createPurchase.isPending || updatePurchase.isPending;
  const [productSearch, setProductSearch] = useState("");
  const [serialError, setSerialError] = useState("");
  const [isSupplierDialogOpen, setIsSupplierDialogOpen] = useState(false);

  const form = useForm({
    defaultValues: {
      referenceNo: "",
      purchaseDate: getTodayDate(),
      note: "",
      supplierId: 0,
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
      console.log("Submitting form with value:", value);
      const missingSerials = value.items.some((item: any) => {
        const serials = (item.serialNumbers ?? [])
          .map((serial: string) => serial.trim())
          .filter(Boolean);
        const itemQuantity = Math.max(0, Number(item.quantity) || 0);
        return (
          serials.length !== itemQuantity ||
          new Set(serials).size !== serials.length
        );
      });

      if (missingSerials) {
        setSerialError("Each item requires one unique serial number per unit.");
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
      // const paymentStatus =
      //   grandTotal > 0 && paidAmount >= grandTotal
      //     ? PurchasePaymentStatus.Paid
      //     : PurchasePaymentStatus.Pending;

      const payload = {
        ...value,
        supplierId: Number(value.supplierId),
        storeId: Number(value.storeId),
        bankId: Number(value.bankId),
        discount,
        paidAmount,
        paymentStatus: value.paymentStatus,
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

  // Track active form values for totals calculation and status sync
  const formValues = useFormStore(form.store, (state) => state.values);

  // Auto-sync Grand Total, Paid Amount, and Payment Status
  useEffect(() => {
    const itemsTotal = (formValues.items || []).reduce(
      (sum: number, item: any) =>
        sum + (Number(item.cost) || 0) * (Number(item.quantity) || 0),
      0,
    );

    const discount = Number(formValues.discount) || 0;
    const computedGrandTotal = Math.max(itemsTotal - discount, 0);
    const paidAmount = Number(formValues.paidAmount) || 0;

    if (!isEditing && (paidAmount === 0 || paidAmount === computedGrandTotal)) {
      form.setFieldValue("paidAmount", computedGrandTotal);
    }

    // const currentPaid =
    //   !isEditing && paidAmount === 0 ? computedGrandTotal : paidAmount;

    // const computedStatus =
    //   computedGrandTotal > 0 && currentPaid >= computedGrandTotal
    //     ? PurchasePaymentStatus.Paid
    //     : PurchasePaymentStatus.Pending;

    // if (formValues.paymentStatus !== computedStatus) {
    //   form.setFieldValue("paymentStatus", computedStatus);
    // }
  }, [formValues.items, formValues.discount, formValues.paidAmount, isEditing]);

  // Prefill form in edit mode
  useEffect(() => {
    const purchase = purchaseDetail;
    if (!purchase || typeof purchase !== "object") return;

    const supplierId = purchase.supplierId ?? purchase.supplier?.id ?? 0;
    const storeId = purchase.storeId ?? purchase.store?.id ?? 1;
    const bankId = purchase.bankId ?? purchase.bank?.id ?? 1;

    const formattedDate = purchase.purchaseDate
      ? String(purchase.purchaseDate).split("T")[0]
      : getTodayDate();

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
      items: purchase.items?.length
        ? purchase.items.map((item: any) => ({
            productId: item.productId ?? item.product?.id ?? 0,
            quantity: item.quantity ?? 1,
            cost: item.costPrice ?? item.cost ?? item.product?.costPrice ?? 0,
            price: item.price ?? item.product?.salePrice ?? 0,
            subtotal:
              (item.costPrice ?? item.cost ?? item.product?.costPrice ?? 0) *
              (item.quantity ?? 1),
            serialNumbers: item.serialNumbers ?? [],
          }))
        : [emptyItem()],
    });
  }, [purchaseDetail, form]);

  return (
    <div className="py-2 pb-12">
      <div className="flex items-center justify-between mb-6 pb-4 border-b">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">
            {isEditing ? "Edit Purchase" : "Create New Purchase"}
          </h1>
        </div>
      </div>

      <form
        id="purchase-form"
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
      >
        <section className="mb-8 bg-card border rounded-md p-6 shadow-xs">
          <FieldGroup className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4">
            <FormTextField
              form={form}
              name="referenceNo"
              label="Reference Number"
              placeholder="Purchase reference number"
              type="text"
            />
            <FormTextField
              form={form}
              name="purchaseDate"
              label="Purchase Date"
              placeholder="Select date"
              type="date"
              required
            />
            <FormSelectField
              form={form}
              name="supplierId"
              label="Supplier"
              placeholder="Select supplier"
              options={suppliers?.payload?.data.map(
                (supplier: SupplierResponse) => ({
                  value: String(supplier.id),
                  label: supplier.name,
                }),
              )}
              required
              onAdd={() => setIsSupplierDialogOpen(true)}
            />
            <FormSelectField
              form={form}
              name="storeId"
              label="Store"
              placeholder="Select store"
              options={stores?.payload?.data.map((store: StoreResponse) => ({
                value: String(store.id),
                label: store.name,
              }))}
              required
              onAdd={() => window.open(ROUTERS.STORE_CREATE, "_blank")}
            />

            <FormTextField
              form={form}
              name="note"
              label="Note"
              placeholder="Enter notes (optional)"
              type="text"
            />
          </FieldGroup>
        </section>

        <FormSupplier
          open={isSupplierDialogOpen}
          setOpen={setIsSupplierDialogOpen}
          supplier={null}
          onCreated={(response) => {
            const supplier = (response as any)?.payload ?? response;
            if (supplier?.id) form.setFieldValue("supplierId", supplier.id);
          }}
        />

        {/* --------------- items --------------- */}
        <section className="mb-8 bg-card border rounded-md p-3 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h2 className="text-lg font-semibold">Items</h2>
            </div>
          </div>

          <form.Field name="items" mode="array">
            {(itemsField) => (
              <div className="flex flex-col gap-2 sm:flex-row">
                <div className="relative flex-1 mb-5">
                  <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={productSearch}
                    onChange={(event) => setProductSearch(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key !== "Enter") return;
                      event.preventDefault();
                      const search = productSearch.trim().toLowerCase();
                      if (!search) return;
                      const product = productList.find((item) =>
                        [
                          item.code,
                          item.modelName,
                          item.brandName,
                          item.categoryName,
                        ]
                          .filter(Boolean)
                          .some((value) =>
                            value.toLowerCase().includes(search),
                          ),
                      );
                      if (!product) return;
                      const cost = Number(product.costPrice ?? 0);
                      itemsField.pushValue({
                        ...emptyItem(),
                        productId: product.id,
                        cost,
                        price: Number(product.salePrice ?? 0),
                        subtotal: cost * 1,
                      });
                      setProductSearch("");
                    }}
                    placeholder="Search product and press Enter"
                    className="pl-9"
                  />
                </div>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => itemsField.pushValue(emptyItem())}
                >
                  <Plus />
                  Add item
                </Button>
              </div>
            )}
          </form.Field>

          {serialError && (
            <p className="mt-3 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
              {serialError}
            </p>
          )}

          <form.Field name="items" mode="array">
            {(itemsField) => (
              <div className="space-y-4">
                {itemsField.state.value.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    No items added yet.
                  </p>
                )}
                {itemsField.state.value.map((_: any, index: number) => (
                  <PurchaseItemRow
                    key={index}
                    form={form}
                    index={index}
                    products={productList}
                    onRemove={() => itemsField.removeValue(index)}
                  />
                ))}
              </div>
            )}
          </form.Field>
        </section>

        {/* --------------- totals & payment --------------- */}
        <form.Subscribe
          selector={(state) =>
            [
              state.values.items,
              state.values.discount,
              state.values.paidAmount,
              state.values.paymentStatus,
            ] as const
          }
        >
          {([items, discount, paidAmount, paymentStatus]) => {
            const itemsTotal = (items || []).reduce(
              (sum: number, i: PurchaseFormValues["items"][number]) =>
                sum + (Number(i.cost) || 0) * (Number(i.quantity) || 0),
              0,
            );
            const grandTotal = Math.max(
              itemsTotal - (Number(discount) || 0),
              0,
            );
            const paid = Number(paidAmount) || 0;
            const balance = Math.max(grandTotal - paid, 0);

            return (
              <section className="rounded-md bg-muted/40 border p-6 shadow-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 text-sm items-end">
                  <FormSelectField
                    form={form}
                    name="bankId"
                    label="Bank"
                    placeholder="Select bank"
                    options={banks?.payload?.data.map((bank: any) => ({
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

                  <FormTextField
                    form={form}
                    name="paidAmount"
                    label="Paid Amount"
                    placeholder="0.00"
                    type="number"
                  />

                  <FormBank
                    open={bankFormOpen}
                    setOpen={setBankFormOpen}
                    bank={null}
                  />

                  <div className="mt-4 flex items-center gap-3 pt-4 border-t">
                    <span className="text-sm font-medium">Payment</span>
                    <span
                      className={`px-3 py-1 text-xs font-semibold rounded-full border ${
                        paymentStatus === "PENDING"
                          ? "bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-950 dark:text-yellow-300 dark:border-yellow-800"
                          : "bg-green-100 text-green-800 border-green-300 dark:bg-green-950 dark:text-green-300 dark:border-green-800"
                      }`}
                    >
                      {paymentStatus || "PENDING"}
                    </span>
                  </div>

                  <div className="flex flex-col justify-center">
                    <span className="text-muted-foreground">Grand Total</span>
                    <div className="font-bold text-base mt-0.5">
                      {formatCurrency(grandTotal)}
                    </div>
                  </div>

                  <div className="flex flex-col justify-center">
                    <span className="text-muted-foreground">Balance Due</span>
                    <div className="font-bold text-base mt-0.5 text-destructive">
                      {formatCurrency(balance)}
                    </div>
                  </div>
                </div>
              </section>
            );
          }}
        </form.Subscribe>
      </form>

      <div className="flex gap-2 justify-end mt-6">
        <Button type="button" variant="outline" onClick={() => navigate(-1)}>
          Cancel
        </Button>
        <Button type="submit" form="purchase-form" disabled={isPending}>
          {isPending
            ? "Saving..."
            : isEditing
              ? "Update Purchase"
              : "Create Purchase"}
        </Button>
      </div>
    </div>
  );
}

/* ---------------- item row ---------------- */

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
  const previousProductIdRef = useRef<number | null>(null);

  const selectedProduct = products.find((p) => p.id === Number(productId));
  const normalizedSerialNumbers = Array.isArray(serialNumbers)
    ? serialNumbers.map((serial) =>
        typeof serial === "string"
          ? serial
          : serial == null
            ? ""
            : String(serial),
      )
    : [];
  const expectedSerialCount = Math.max(0, Number(quantity) || 0);
  const enteredSerialCount = normalizedSerialNumbers.filter((serial: string) =>
    serial.trim(),
  ).length;

  const addSerialNumber = () => {
    const serial = scanValue.trim();
    if (!serial) {
      setSerialDialogError("Enter or scan a serial number.");
      return;
    }
    const current = normalizedSerialNumbers;
    if (
      current.some(
        (value: string) => value.trim().toLowerCase() === serial.toLowerCase(),
      )
    ) {
      setSerialDialogError("This serial number has already been added.");
      return;
    }
    const nextIndex = current.findIndex((value: string) => !value.trim());
    if (nextIndex === -1) {
      setSerialDialogError(
        "All serial numbers for this quantity are already added.",
      );
      return;
    }
    form.setFieldValue(`items[${index}].serialNumbers[${nextIndex}]`, serial);
    setScanValue("");
    setSerialDialogError("");
  };

  // Sync cost and subtotal only when the selected product actually changes.
  useEffect(() => {
    if (!productId || !selectedProduct) return;

    const nextProductId = Number(productId);
    if (previousProductIdRef.current === nextProductId) return;

    previousProductIdRef.current = nextProductId;

    const itemCost = selectedProduct.costPrice ?? 0;
    form.setFieldValue(`items[${index}].cost`, itemCost);
    form.setFieldValue(
      `items[${index}].subtotal`,
      itemCost * (Number(quantity) || 0),
    );

    setSerialDialogError("");
    setScanValue("");
  }, [productId, selectedProduct, quantity, index, form]);

  // Recalculate subtotal on cost or quantity change
  useEffect(() => {
    form.setFieldValue(
      `items[${index}].subtotal`,
      cost * (Number(quantity) || 0),
    );
  }, [quantity, cost]);

  // Sync array length for serial numbers when quantity updates
  useEffect(() => {
    const qty = Math.max(0, Number(quantity) || 0);
    form.setFieldValue(
      `items[${index}].serialNumbers`,
      (old: string[] = []) => {
        const next = old.slice(0, qty);
        while (next.length < qty) next.push("");
        return next;
      },
    );
  }, [quantity]);

  return (
    <div className="rounded-lg border border-border/70 bg-background/50 p-4 shadow-sm">
      <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 items-end">
        <FormSelectField
          form={form}
          name={`items[${index}].productId`}
          label="Product"
          placeholder="Select product"
          options={products.map((p) => ({
            value: String(p.id),
            label: `${p.name}`,
          }))}
        />

        <FormTextField
          form={form}
          name={`items[${index}].quantity`}
          label="Quantity"
          type="number"
        />
        <FormTextField
          form={form}
          name={`items[${index}].cost`}
          label="Cost"
          type="number"
        />
        <FormTextField
          form={form}
          name={`items[${index}].subtotal`}
          label="Subtotal"
          type="number"
          // readOnly
        />

        <div className="flex items-center justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            className="text-destructive"
            onClick={onRemove}
          >
            <Trash2 />
          </Button>
        </div>
      </div>

      {productId > 0 && (
        <div className="mt-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm font-medium">Serial numbers</span>
              <p className="text-xs text-muted-foreground">
                {enteredSerialCount} of {expectedSerialCount} scanned
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              title="Add serial number"
              onClick={() => {
                setSerialDialogError("");
                setIsSerialDialogOpen(true);
              }}
            >
              <Plus />
              Add serial number
            </Button>
          </div>
          <form.Field name={`items[${index}].serialNumbers`} mode="array">
            {(serialField: any) => (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-1">
                {(Array.isArray(serialField.state.value)
                  ? serialField.state.value
                  : []
                ).map((_: string, sIdx: number) => (
                  <form.Field
                    key={sIdx}
                    name={`items[${index}].serialNumbers[${sIdx}]`}
                  >
                    {(sf: any) => (
                      <input
                        className="border rounded px-2 py-1 text-sm"
                        placeholder={`Serial #${sIdx + 1}`}
                        value={sf.state.value ?? ""}
                        onChange={(e) => sf.handleChange(e.target.value)}
                      />
                    )}
                  </form.Field>
                ))}
              </div>
            )}
          </form.Field>

          <Dialog
            open={isSerialDialogOpen}
            onOpenChange={setIsSerialDialogOpen}
          >
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add serial number</DialogTitle>
                <DialogDescription>
                  Scan a barcode or enter the serial number manually.
                </DialogDescription>
              </DialogHeader>
              <div className="flex items-center gap-2">
                <ScanLine className="size-5 text-muted-foreground" />
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
                  placeholder="Scan serial number"
                />
              </div>
              {serialDialogError && (
                <p className="text-sm text-destructive">{serialDialogError}</p>
              )}
              <div className="max-h-40 space-y-2 overflow-y-auto">
                {normalizedSerialNumbers.map(
                  (serial: string, serialIndex: number) => (
                    <div key={serialIndex} className="flex items-center gap-2">
                      <Input
                        value={serial}
                        readOnly
                        placeholder={`Serial #${serialIndex + 1}`}
                      />
                      {serial && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          title="Remove serial number"
                          onClick={() =>
                            form.setFieldValue(
                              `items[${index}].serialNumbers[${serialIndex}]`,
                              "",
                            )
                          }
                        >
                          <Trash2 />
                        </Button>
                      )}
                    </div>
                  ),
                )}
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={addSerialNumber}
                >
                  <Plus />
                  Add serial
                </Button>
                <Button
                  type="button"
                  onClick={() => setIsSerialDialogOpen(false)}
                >
                  Done
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      )}
    </div>
  );
}
