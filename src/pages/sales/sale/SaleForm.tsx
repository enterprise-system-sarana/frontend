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
import { Plus, ScanLine, Search, Trash2, Hash, Loader2 } from "lucide-react";
import FormTextField, { FormSelectField } from "@/components/ui/FormTextField";
import {
  SaleSchema,
  SalePaymentStatus,
  SaleStatus,
  type SaleFormValues,
} from "@/types/sales/Sale";
import { useSale } from "@/hooks/sales/useSale";
import { useCustomer } from "@/hooks/sales/useCustomer";
import { useStore } from "@/hooks/inventory/useStore";
import { useProduct } from "@/hooks/product/useProduct";
import { useProductSerial } from "@/hooks/product/useProductSerial";
import FormCustomer from "@/pages/sales/customers/CustomerForm";
import { ROUTERS } from "@/constants/Route";
import type { StoreResponse } from "@/types/inventory/Store";
import type { CustomerResponse } from "@/types/sales/Customer";
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
    price: 0,
    itemDiscount: 0,
    subtotal: 0,
    serialNumberIds: [] as number[],
  };
}

export default function SaleForm() {
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id);
  const navigate = useNavigate();

  const { data: customers } = useCustomer.useGetAllCustomer({
    page: 0,
    size: 1000,
  });
  const { data: banks } = useBank.useGetAllBank({ page: 0, size: 1000 });
  const [bankFormOpen, setBankFormOpen] = useState(false);
  const { data: stores } = useStore.useGetAllStore({ page: 0, size: 1000 });
  const { data: products } = useProduct.useGetAllProduct({
    page: 0,
    size: 1000,
  });
  const productList: ProductResponse[] = products?.payload?.data ?? [];

  const { data: existingSale } = useSale.GetSaleById(Number(id), {
    enabled: isEditing,
  });
  const saleDetail =
    existingSale?.payload?.data ??
    existingSale?.payload ??
    existingSale?.data ??
    existingSale;

  const createSale = useSale.Create();
  const updateSale = useSale.Update();
  const isPending = createSale.isPending || updateSale.isPending;

  // Search States
  const [productSearch, setProductSearch] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isCustomerDialogOpen, setIsCustomerDialogOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const form = useForm({
    defaultValues: {
      reference: "",
      saleDate: "",
      noted: "",
      customerId: 0,
      storeId: 1,
      bankId: 1,
      discount: 0,
      paidAmount: 0,
      paymentStatus: SalePaymentStatus.Pending,
      status: SaleStatus.Pending,
      paymentOption: "PAID",
      items: [emptyItem()],
    } as SaleFormValues,
    validators: {
      onSubmit: SaleSchema,
    },
    onSubmit: async ({ value }) => {
      const items = value.items.map((item: any) => {
        const itemPrice = Number(item.price) || 0;
        const itemQty = Number(item.quantity) || 1;
        const itemDisc = Number(item.itemDiscount) || 0;
        return {
          productId: Number(item.productId),
          quantity: itemQty,
          price: itemPrice,
          itemDiscount: itemDisc,
          subtotal: itemPrice * itemQty - itemDisc,
          serialNumberIds: (item.serialNumberIds ?? []).filter(
            (sId: any) => Number(sId) > 0,
          ),
        };
      });

      const payload = {
        ...value,
        customerId: Number(value.customerId),
        storeId: Number(value.storeId),
        bankId: Number(value.bankId),
        discount: Number(value.discount) || 0,
        paidAmount: Number(value.paidAmount) || 0,
        paymentOption: value.paymentOption === "DUE" ? "DUE" : "PAID",
        paymentStatus: value.paymentStatus,
        status: value.status,
        items,
      };

      try {
        if (isEditing && id) {
          await updateSale.mutateAsync({ id: Number(id), request: payload });
        } else {
          await createSale.mutateAsync(payload);
        }
        navigate(ROUTERS.SALE);
      } catch (error) {
        console.error("Failed to save sale:", error);
      }
    },
  });

  const formValues = useFormStore(form.store, (state) => state.values);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Live Auto Search
  useEffect(() => {
    const query = productSearch.trim();
    if (!query) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await useProductSerial.useGetAllProductSerial({
          barcode: query,
          page: 0,
          size: 50,
        }); // Adjust if using service directly
        const rawList: any[] =
          (res as any)?.payload?.data ??
          (res as any)?.data?.content ??
          (res as any)?.data ??
          [];

        const filtered = rawList.filter((s: any) => {
          const hasStock = Number(s.quantity ?? 0) > 0 && s.status !== "SOLD";
          const matchQuery =
            (s.barcode || s.barCode)
              ?.toLowerCase()
              .includes(query.toLowerCase()) ||
            (s.productName || "")?.toLowerCase().includes(query.toLowerCase());
          return hasStock && matchQuery;
        });

        setSearchResults(filtered);
        setShowDropdown(true);
      } catch (err) {
        console.error("Search failed:", err);
      } finally {
        setIsSearching(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [productSearch]);

  // Handle total calculation and auto-check payment/completion status
  useEffect(() => {
    const itemsTotal = (formValues.items || []).reduce(
      (sum: number, item: any) =>
        sum +
        (Number(item.price) || 0) * (Number(item.quantity) || 0) -
        (Number(item.itemDiscount) || 0),
      0,
    );

    const discount = Number(formValues.discount) || 0;
    const computedGrandTotal = Math.max(itemsTotal - discount, 0);
    const paidAmount = Number(formValues.paidAmount) || 0;

    let targetPaid = paidAmount;
    if (!isEditing && (paidAmount === 0 || paidAmount === computedGrandTotal)) {
      targetPaid = computedGrandTotal;
      form.setFieldValue("paidAmount", computedGrandTotal);
    }

    let computedPaymentStatus: string = SalePaymentStatus.Pending;
    let computedSaleStatus: string = SaleStatus.Pending;

    if (computedGrandTotal > 0 && targetPaid >= computedGrandTotal) {
      computedPaymentStatus = SalePaymentStatus.Paid;
      computedSaleStatus = SaleStatus.Completed;
    } else if (targetPaid > 0 && targetPaid < computedGrandTotal) {
      computedPaymentStatus = SalePaymentStatus.Partial;
      computedSaleStatus = SaleStatus.Pending;
    } else {
      computedPaymentStatus = SalePaymentStatus.Pending;
      computedSaleStatus = SaleStatus.Pending;
    }

    if (formValues.paymentStatus !== computedPaymentStatus) {
      form.setFieldValue("paymentStatus", computedPaymentStatus);
    }
    if (formValues.status !== computedSaleStatus) {
      form.setFieldValue("status", computedSaleStatus);
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

  // Bind existing data on edit
  useEffect(() => {
    const sale = saleDetail;
    if (!sale || typeof sale !== "object") return;
    form.reset({
      reference: sale.reference ?? "",
      noted: sale.noted ?? "",
      saleDate: sale.saleDate ?? "",
      customerId: sale.customerId ?? sale.customer?.id ?? 0,
      storeId: sale.storeId ?? sale.store?.id ?? 1,
      bankId: sale.bankId ?? sale.bank?.id ?? 1,
      discount: sale.discount ?? 0,
      paidAmount: sale.paidAmount ?? 0,
      paymentStatus: sale.paymentStatus ?? SalePaymentStatus.Pending,
      status: sale.status ?? SaleStatus.Pending,
      items: sale.items?.length
        ? sale.items.map((item: any) => ({
            productId: item.productId ?? item.product?.id ?? 0,
            quantity: item.quantity ?? 1,
            price: item.price ?? item.product?.salePrice ?? 0,
            itemDiscount: item.itemDiscount ?? 0,
            subtotal:
              (item.price ?? item.product?.salePrice ?? 0) *
                (item.quantity ?? 1) -
              (item.itemDiscount ?? 0),
            serialNumberIds: item.serialNumberIds ?? [],
          }))
        : [emptyItem()],
    });
  }, [saleDetail, form]);

  // Auto Select Serial Item
  const handleSelectSerialAuto = (serial: any, itemsField: any) => {
    const product = productList.find((p) => p.id === Number(serial.productId));
    const itemPrice = Number(product?.salePrice ?? serial.price ?? 0);
    const currentItems = itemsField.state.value || [];
    const firstEmptyIndex = currentItems.findIndex(
      (i: any) => !i.productId || i.productId === 0,
    );

    const newItemData = {
      productId: serial.productId,
      quantity: 1,
      price: itemPrice,
      itemDiscount: 0,
      subtotal: itemPrice,
      serialNumberIds: [serial.id],
    };

    if (firstEmptyIndex !== -1) {
      form.setFieldValue(`items[${firstEmptyIndex}]`, newItemData);
    } else {
      itemsField.pushValue(newItemData);
    }

    setProductSearch("");
    setShowDropdown(false);
  };

  return (
    <div className="py-2 pb-12">
      <div className="flex items-center justify-between mb-6 pb-4 border-b">
        <h1 className="text-2xl font-bold">
          {isEditing ? "Edit Sale" : "Create New Sale"}
        </h1>
      </div>

      <form
        id="sale-form"
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
      >
        {/* Header Section */}
        <section className="mb-8 bg-card border rounded-md p-6 shadow-xs">
          <FieldGroup className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4">
            <FormTextField
              form={form}
              name="reference"
              label="Reference Number"
              type="text"
            />
            <FormTextField
              form={form}
              name="saleDate"
              label="Sale Date"
              type="date"
            />
            <FormSelectField
              form={form}
              name="customerId"
              label="Customer"
              options={customers?.payload?.data.map((c: CustomerResponse) => ({
                value: String(c.id),
                label: c.name,
              }))}
              required
              onAdd={() => setIsCustomerDialogOpen(true)}
            />
            <FormSelectField
              form={form}
              name="storeId"
              label="Store"
              options={stores?.payload?.data.map((s: StoreResponse) => ({
                value: String(s.id),
                label: s.name,
              }))}
              required
              onAdd={() => window.open(ROUTERS.STORE_CREATE, "_blank")}
            />
            <FormTextField form={form} name="noted" label="Note" type="text" />
          </FieldGroup>
        </section>

        <FormCustomer
          open={isCustomerDialogOpen}
          setOpen={setIsCustomerDialogOpen}
          customer={null}
          onCreated={(res: any) => {
            if (res?.payload?.id)
              form.setFieldValue("customerId", res.payload.id);
          }}
        />

        {/* Item Section */}
        <section className="mb-8 bg-card border rounded-md p-3 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold">Items</h2>
          </div>

          <form.Field name="items" mode="array">
            {(itemsField) => (
              <>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <div className="relative flex-1 mb-5" ref={dropdownRef}>
                    <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      onFocus={() =>
                        productSearch.trim() && setShowDropdown(true)
                      }
                      placeholder="Search product name or serial barcode..."
                      className="pl-9 pr-8"
                      autoComplete="off"
                    />
                    {isSearching && (
                      <Loader2 className="absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />
                    )}

                    {showDropdown && (
                      <div className="absolute z-50 mt-1 max-h-60 w-full overflow-y-auto rounded-md border bg-popover text-popover-foreground shadow-lg">
                        {searchResults.length === 0 ? (
                          <div className="p-3 text-sm text-muted-foreground text-center">
                            {isSearching
                              ? "Searching..."
                              : "No available serials found"}
                          </div>
                        ) : (
                          searchResults.map((serial: any) => (
                            <div
                              key={serial.id}
                              onClick={() =>
                                handleSelectSerialAuto(serial, itemsField)
                              }
                              className="flex items-center justify-between p-3 hover:bg-accent hover:text-accent-foreground cursor-pointer border-b last:border-b-0 text-sm transition-colors"
                            >
                              <div>
                                <p className="font-semibold">
                                  {serial.productName ||
                                    `Product #${serial.productId}`}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  Barcode/SN:{" "}
                                  <span className="font-mono font-medium text-foreground">
                                    {serial.barcode || serial.barCode}
                                  </span>
                                </p>
                              </div>
                              <div className="text-right">
                                <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700 border border-green-200">
                                  In Stock ({serial.quantity})
                                </span>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => itemsField.pushValue(emptyItem())}
                  >
                    <Plus /> Add row
                  </Button>
                </div>

                <div className="space-y-4">
                  {itemsField.state.value.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      No items added yet.
                    </p>
                  )}
                  {itemsField.state.value.map((_: any, index: number) => (
                    <SaleItemRow
                      key={index}
                      form={form}
                      index={index}
                      products={productList}
                      onRemove={() => itemsField.removeValue(index)}
                    />
                  ))}
                </div>
              </>
            )}
          </form.Field>
        </section>

        {/* Totals & Payment Section */}
        <form.Subscribe
          selector={(state) =>
            [
              state.values.items,
              state.values.discount,
              state.values.paidAmount,
              state.values.paymentStatus,
              state.values.status,
              state.values.paymentOption,
            ] as const
          }
        >
          {([
            items,
            discount,
            paidAmount,
            paymentStatus,
            status,
            paymentOption,
          ]) => {
            const itemsTotal = (items || []).reduce(
              (sum: number, i: any) =>
                sum +
                (Number(i.price) || 0) * (Number(i.quantity) || 0) -
                (Number(i.itemDiscount) || 0),
              0,
            );
            const grandTotal = Math.max(
              itemsTotal - (Number(discount) || 0),
              0,
            );
            const balance = Math.max(grandTotal - (Number(paidAmount) || 0), 0);

            const isPaid = paymentStatus === "PAID";
            const isPartial = paymentStatus === "PARTIAL";
            const isCompleted = status === "COMPLETED";
            const isPaidOption = paymentOption === "PAID";

            return (
              <>
                {isPaidOption && (
                  <section className="rounded-md bg-muted/40 border p-6 shadow-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 text-sm items-end">
                      <FormSelectField
                        form={form}
                        name="paymentOption"
                        label="Payment Option"
                        options={[
                          { value: "PAID", label: "Paid" },
                          { value: "DUE", label: "Due" },
                        ]}
                        required
                      />
                      <FormSelectField
                        form={form}
                        name="bankId"
                        label="Bank"
                        options={banks?.payload?.data.map((b: any) => ({
                          value: String(b.id),
                          label: b.name,
                        }))}
                        required
                        onAdd={() => setBankFormOpen(true)}
                      />
                      <FormTextField
                        form={form}
                        name="discount"
                        label="Discount"
                        type="number"
                      />
                      <FormTextField
                        form={form}
                        name="paidAmount"
                        label="Paid Amount"
                        type="number"
                      />
                      <FormBank
                        open={bankFormOpen}
                        setOpen={setBankFormOpen}
                        bank={null}
                      />

                      <div className="flex flex-col gap-1.5 justify-center pt-2">
                        <span className="text-xs font-medium text-muted-foreground">
                          Payment & Status
                        </span>
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span
                            className={`px-2.5 py-0.5 text-xs font-semibold rounded-full border ${
                              isPaid
                                ? "bg-emerald-500/15 text-emerald-600 border-emerald-500/25"
                                : isPartial
                                  ? "bg-blue-500/15 text-blue-600 border-blue-500/25"
                                  : "bg-amber-500/15 text-amber-600 border-amber-500/25"
                            }`}
                          >
                            {paymentStatus || "PENDING"}
                          </span>
                          <span
                            className={`px-2.5 py-0.5 text-xs font-semibold rounded-full border ${
                              isCompleted
                                ? "bg-emerald-500/15 text-emerald-600 border-emerald-500/25"
                                : "bg-amber-500/15 text-amber-600 border-amber-500/25"
                            }`}
                          >
                            {status || "PENDING"}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col justify-center">
                        <span className="text-muted-foreground">
                          Grand Total
                        </span>
                        <div className="font-bold text-base mt-0.5">
                          {formatCurrency(grandTotal)}
                        </div>
                      </div>

                      <div className="flex flex-col justify-center">
                        <span className="text-muted-foreground">
                          Balance Due
                        </span>
                        <div
                          className={`font-bold text-base mt-0.5 ${balance > 0 ? "text-destructive" : "text-emerald-600"}`}
                        >
                          {formatCurrency(balance)}
                        </div>
                      </div>
                    </div>
                  </section>
                )}
              </>
            );
          }}
        </form.Subscribe>
      </form>

      <div className="flex gap-2 justify-end mt-6">
        <Button type="button" variant="outline" onClick={() => navigate(-1)}>
          Cancel
        </Button>
        <Button type="submit" form="sale-form" disabled={isPending}>
          {isPending ? "Saving..." : isEditing ? "Update Sale" : "Create Sale"}
        </Button>
      </div>
    </div>
  );
}

/* ---------------- Item Row Component ---------------- */
function SaleItemRow({
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
  const price = useFormStore(
    form.store,
    (state: any) => Number(state.values.items[index]?.price) || 0,
  );
  const itemDiscount = useFormStore(
    form.store,
    (state: any) => Number(state.values.items[index]?.itemDiscount) || 0,
  );
  const serialNumberIds = useFormStore(
    form.store,
    (state: any) => state.values.items[index]?.serialNumberIds || [],
  );

  const [isSerialModalOpen, setIsSerialModalOpen] = useState(false);
  const [scanValue, setScanValue] = useState("");
  const [serialError, setSerialError] = useState("");
  const previousProductIdRef = useRef<number | null>(null);

  const selectedProduct = products.find((p) => p.id === Number(productId));

  const { data: serialsResponse } = useProductSerial.useGetAllProductSerial(
    { productId: Number(productId), page: 0, size: 100 },
    { enabled: Number(productId) > 0 },
  );

  const availableSerials = (
    (serialsResponse as any)?.payload?.data ??
    (serialsResponse as any)?.data ??
    []
  ).filter(
    (s: any) => Number(s.quantity ?? 0) > 0 && s.status !== "OUT_OF_STOCK",
  );

  const computedSubtotal = price * (Number(quantity) || 0) - itemDiscount;

  useEffect(() => {
    if (!productId || !selectedProduct) return;
    const nextProductId = Number(productId);
    if (previousProductIdRef.current === nextProductId) return;

    previousProductIdRef.current = nextProductId;
    const itemPrice = selectedProduct.salePrice ?? 0;

    form.setFieldValue(`items[${index}].price`, itemPrice);

    if (availableSerials.length > 0 && serialNumberIds.length === 0) {
      form.setFieldValue(`items[${index}].serialNumberIds`, [
        availableSerials[0].id,
      ]);
    }
  }, [
    productId,
    selectedProduct,
    index,
    form,
    availableSerials,
    serialNumberIds,
  ]);

  const toggleSerial = (serial: any) => {
    if (Number(serial.quantity ?? 0) <= 0 || serial.status === "SOLD") {
      setSerialError("Out of stock!");
      return;
    }

    const current = [...serialNumberIds];
    const targetIdx = current.indexOf(serial.id);
    if (targetIdx > -1) {
      current.splice(targetIdx, 1);
    } else {
      if (current.length >= Number(quantity)) {
        setSerialError(`Maximum ${quantity} serials limit reached.`);
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
      (s: any) => (s.barcode || s.barCode)?.toLowerCase() === code,
    );
    if (!matched) {
      setSerialError("Barcode invalid or out of stock.");
      return;
    }
    toggleSerial(matched);
    setScanValue("");
  };

  return (
    <div className="rounded-lg border border-border/70 bg-background/50 p-4 shadow-sm">
      <div className="grid grid-cols-1 sm:grid-cols-6 gap-3 items-end">
        <FormSelectField
          form={form}
          name={`items[${index}].productId`}
          label="Product"
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
          name={`items[${index}].price`}
          label="Price"
          type="number"
        />
        <FormTextField
          form={form}
          name={`items[${index}].itemDiscount`}
          label="Discount"
          type="number"
        />
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">Subtotal</label>
          <div className="h-10 px-3 py-2 rounded-md border bg-muted/50 text-sm flex items-center font-medium">
            {formatCurrency(computedSubtotal)}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2">
          {Number(productId) > 0 && (
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => setIsSerialModalOpen(true)}
              className="relative"
            >
              <Hash className="size-4" />
              {serialNumberIds.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-blue-600 text-white text-[10px] size-5 rounded-full flex items-center justify-center font-bold">
                  {serialNumberIds.length}
                </span>
              )}
            </Button>
          )}
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

      <Dialog open={isSerialModalOpen} onOpenChange={setIsSerialModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Select Serials</DialogTitle>
            <DialogDescription>
              Selected {serialNumberIds.length} of {quantity}
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-2 my-2">
            <ScanLine className="size-5 text-muted-foreground" />
            <Input
              value={scanValue}
              onChange={(e) => setScanValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleModalScan();
                }
              }}
              placeholder="Scan barcode..."
            />
            <Button type="button" onClick={handleModalScan} variant="secondary">
              Add
            </Button>
          </div>
          {serialError && (
            <p className="text-sm text-destructive">{serialError}</p>
          )}
          <div className="max-h-60 overflow-y-auto space-y-2 border p-2 rounded">
            {availableSerials.map((serial: any) => {
              const isSelected = serialNumberIds.includes(serial.id);
              return (
                <div
                  key={serial.id}
                  onClick={() => toggleSerial(serial)}
                  className={`flex items-center justify-between p-2 rounded cursor-pointer border text-sm ${isSelected ? "bg-blue-50 border-blue-500 text-blue-900" : "bg-background hover:bg-muted"}`}
                >
                  <span>SN: {serial.barcode || serial.barCode}</span>
                  <span className="text-xs px-2 py-0.5 rounded bg-green-100 text-green-800">
                    IN STOCK
                  </span>
                </div>
              );
            })}
          </div>
          <DialogFooter>
            <Button type="button" onClick={() => setIsSerialModalOpen(false)}>
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
