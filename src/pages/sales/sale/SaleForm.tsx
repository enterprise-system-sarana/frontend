import { useEffect, useState } from "react";
import { useForm, useStore as useFormStore } from "@tanstack/react-form";
import { useNavigate, useParams } from "react-router-dom";
import { Plus, ScanLine, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FieldGroup } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import FormTextField, { FormSelectField } from "@/components/ui/FormTextField";
import { useBank } from "@/hooks/finance/useBank";
import { useCustomer } from "@/hooks/sales/useCustomer";
import { useProduct } from "@/hooks/product/useProduct";
import { useStore } from "@/hooks/inventory/useStore";
import { useSale } from "@/hooks/sales/useSale";
import { SaleSchema, type SaleFormValues } from "@/types/sales/Sale";
import type { ProductResponse } from "@/types/product/Product";
import { ROUTERS } from "@/constants/Route";

const emptyItem = () => ({
  productId: 0,
  quantity: 1,
  price: 0,
  itemDiscount: 0,
  serialNumberIds: [] as number[],
});

export default function SaleForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const editing = Boolean(id);
  const { data: stores } = useStore.useGetAllStore({ page: 0, size: 1000 });
  const { data: banks } = useBank.useGetAllBank({ page: 0, size: 1000 });
  const { data: customers } = useCustomer.useGetAllCustomer({
    page: 0,
    size: 1000,
  });
  const { data: products } = useProduct.useGetAllProduct({
    page: 0,
    size: 1000,
  });
  const productList: ProductResponse[] = products?.payload?.data ?? [];
  const existing = useSale.getById(Number(id), editing);
  const create = useSale.create();
  const update = useSale.update();
  const [productSearch, setProductSearch] = useState("");
  const [serialError, setSerialError] = useState("");
  const form = useForm({
    defaultValues: {
      reference: "",
      storeId: 1,
      customerId: 0,
      discount: 0,
      bankId: 1,
      paidAmount: 0,
      noted: "",
      items: [emptyItem()],
    } as SaleFormValues,
    validators: { onSubmit: SaleSchema },
    onSubmit: async ({ value }) => {
      const hasInvalidSerials = value.items.some((item) => {
        const product = productList.find(
          (candidate) => candidate.id === Number(item.productId),
        );
        const isSerialized = Boolean(
          product?.serialized ??
          product?.isSerialized ??
          product?.serializable ??
          product?.hasSerialNumber,
        );
        return (
          isSerialized && item.serialNumberIds.length !== Number(item.quantity)
        );
      });
      if (hasInvalidSerials) {
        setSerialError(
          "Serialized products require one valid serial ID for each unit.",
        );
        return;
      }
      setSerialError("");
      const items = value.items.map((item) => ({
        ...item,
        productId: Number(item.productId),
        quantity: Number(item.quantity),
        price: Number(item.price),
        itemDiscount: Number(item.itemDiscount),
        serialNumberIds: item.serialNumberIds
          .map(Number)
          .filter((serial) => serial > 0),
      }));
      const payload = {
        reference: value.reference.trim(),
        storeId: Number(value.storeId),
        customerId: Number(value.customerId),
        discount: Number(value.discount),
        bankId: Number(value.bankId),
        paidAmount: Number(value.paidAmount),
        noted: value.noted ?? "",
        items,
      };
      console.info("Creating sale", payload);
      if (editing && id)
        await update.mutateAsync({ id: Number(id), request: payload });
      else await create.mutateAsync(payload);
      navigate(ROUTERS.SALE);
    },
  });
  const values = useFormStore(form.store, (state) => state.values);
  useEffect(() => {
    const sale =
      existing.data?.payload?.data ?? existing.data?.payload ?? existing.data;
    if (!sale || typeof sale !== "object") return;
    form.reset({
      reference: sale.reference ?? "",
      storeId: sale.storeId ?? 1,
      customerId: sale.customerId ?? 0,
      discount: sale.discount ?? 0,
      bankId: sale.bankId ?? 1,
      paidAmount: sale.paidAmount ?? 0,
      noted: sale.noted ?? "",
      items: sale.items?.length
        ? sale.items.map((item: any) => ({
            productId: item.productId ?? 0,
            quantity: item.quantity ?? 1,
            price: item.price ?? 0,
            itemDiscount: item.itemDiscount ?? 0,
            serialNumberIds: item.serialNumberIds ?? [],
          }))
        : [emptyItem()],
    });
  }, [existing.data, form]);
  const addProduct = () => {
    const match = productList.find((product) =>
      `${product.code} ${product.modelName}`
        .toLowerCase()
        .includes(productSearch.trim().toLowerCase()),
    );
    if (!match) return;
    form.setFieldValue("items", [
      ...values.items,
      { ...emptyItem(), productId: match.id, price: match.salePrice ?? 0 },
    ]);
    setProductSearch("");
  };
  const total = values.items.reduce(
    (sum, item) =>
      sum +
      Math.max(
        Number(item.price) * Number(item.quantity) - Number(item.itemDiscount),
        0,
      ),
    0,
  );
  return (
    <div className="mx-auto max-w-6xl space-y-8 py-4">
      <div className="flex items-end justify-between border-b border-border/70 pb-5">
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            Sales workspace
          </p>
          <h1 className="text-3xl font-bold tracking-tight">
            {editing ? "Edit Sale" : "Create Sale"}
          </h1>
        </div>
        <span className="hidden rounded-full bg-primary-light px-3 py-1 text-xs font-semibold text-primary sm:inline-flex">
          {editing ? "Editing" : "New transaction"}
        </span>
      </div>
      <form
        id="sale-form"
        onSubmit={(event) => {
          event.preventDefault();
          form.handleSubmit();
        }}
        className="space-y-6"
      >
        <section className="rounded-xl border bg-card p-6 sm:p-7">
          <div className="mb-5">
            <h2 className="text-lg font-semibold">Sale details</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Set the customer, store, and reference for this transaction.
            </p>
          </div>
          <FieldGroup className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <FormTextField
              form={form}
              name="reference"
              label="Reference"
              placeholder="Sale reference"
              required
            />
            <FormSelectField
              form={form}
              name="storeId"
              label="Store"
              placeholder="Select store"
              required
              options={stores?.payload?.data?.map((store: any) => ({
                value: String(store.id),
                label: store.name,
              }))}
            />
            <FormSelectField
              form={form}
              name="customerId"
              label="Customer"
              placeholder="Select customer"
              required
              options={customers?.payload?.data?.map((customer: any) => ({
                value: String(customer.id),
                label: customer.name,
              }))}
            />
            <FormTextField
              form={form}
              name="noted"
              label="Note"
              placeholder="Optional note"
            />
          </FieldGroup>
        </section>
        <section className="space-y-5 rounded-xl border bg-card p-5 sm:p-7">
          <div>
            <h2 className="text-lg font-semibold">Products</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Add products and assign serial numbers where required.
            </p>
          </div>
          <div className="flex items-end gap-3 rounded-lg border border-primary/15 bg-primary-light/40 p-3">
            <div className="flex-1">
              <label htmlFor="product-search" className="mb-1 block text-sm font-semibold text-primary">
                Add product
              </label>
              <Input
                id="product-search"
                value={productSearch}
                onChange={(event) => setProductSearch(event.target.value)}
                placeholder="Type product code or model"
              />
            </div>
            <Button type="button" className="shrink-0" onClick={addProduct}>
              <Plus />
              Add
            </Button>
          </div>
          {serialError && (
            <p className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
              {serialError}
            </p>
          )}
          <form.Field name="items" mode="array">
            {(itemsField: any) => (
              <div className="space-y-3">
                {itemsField.state.value.map((_: unknown, index: number) => (
                  <SaleItemRow
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
        <section className="rounded-xl border bg-muted/40 p-6 sm:p-7">
          <div className="mb-5">
            <h2 className="text-lg font-semibold">Payment summary</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Review payment details before completing the sale.
            </p>
          </div>
          <div className="grid grid-cols-1 items-end gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <FormSelectField
              form={form}
              name="bankId"
              label="Bank"
              placeholder="Select bank"
              required
              options={banks?.payload?.data?.map((bank: any) => ({
                value: String(bank.id),
                label: bank.name,
              }))}
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
            <div className="text-sm">
              <span className="text-muted-foreground">Grand Total</span>
              <p className="mt-1 text-2xl font-bold text-primary">
                ${Math.max(total - Number(values.discount), 0).toFixed(2)}
              </p>
            </div>
          </div>
        </section>
      </form>
      <div className="flex justify-end gap-3 border-t border-border/70 pt-5">
        <Button type="button" variant="outline" className="min-w-24" onClick={() => navigate(-1)}>
          Cancel
        </Button>
        <Button
          type="submit"
          form="sale-form"
          className="min-w-32 shadow-sm"
          disabled={create.isPending || update.isPending}
        >
          {editing ? "Update Sale" : "Complete Sale"}
        </Button>
      </div>
    </div>
  );
}

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
    (state: any) => state.values.items[index]?.price,
  );
  const serialNumberIds = useFormStore(
    form.store,
    (state: any) => state.values.items[index]?.serialNumberIds ?? [],
  );
  const selected = products.find((item) => item.id === Number(productId));
  const isSerialized = Boolean(
    selected?.serialized ??
    selected?.isSerialized ??
    selected?.serializable ??
    selected?.hasSerialNumber,
  );
  const [isSerialDialogOpen, setIsSerialDialogOpen] = useState(false);
  const [scanValue, setScanValue] = useState("");
  const [serialDialogError, setSerialDialogError] = useState("");
  const normalizedSerialIds = Array.isArray(serialNumberIds)
    ? serialNumberIds.map((serial) => String(serial ?? "")).filter(Boolean)
    : [];
  const expectedSerialCount = Math.max(0, Number(quantity) || 0);
  const addSerialNumber = () => {
    const serial = scanValue.trim();
    if (!/^\d+$/.test(serial) || Number(serial) <= 0) {
      setSerialDialogError("Enter a valid serial number ID.");
      return;
    }
    if (normalizedSerialIds.includes(serial)) {
      setSerialDialogError("This serial number has already been added.");
      return;
    }
    if (normalizedSerialIds.length >= expectedSerialCount) {
      setSerialDialogError(
        "All serial numbers for this quantity are already added.",
      );
      return;
    }
    form.setFieldValue(`items[${index}].serialNumberIds`, [
      ...serialNumberIds,
      Number(serial),
    ]);
    setScanValue("");
    setSerialDialogError("");
  };
  useEffect(() => {
    if (selected && Number(price) <= 0 && Number(selected.salePrice) > 0) {
      form.setFieldValue(`items[${index}].price`, Number(selected.salePrice));
    }
    if (selected && !isSerialized && serialNumberIds.length > 0) {
      form.setFieldValue(`items[${index}].serialNumberIds`, []);
    }
  }, [selected, price, index, form, isSerialized, serialNumberIds.length]);
  return (
    <div className="rounded-lg border border-border/80 bg-background/70 p-4 shadow-sm transition-shadow hover:shadow-md sm:p-5">
      <div className="grid grid-cols-1 items-end gap-3 sm:grid-cols-5">
        <FormSelectField
          form={form}
          name={`items[${index}].productId`}
          label="Product"
          placeholder="Select product"
          required
          options={products.map((item) => ({
            value: String(item.id),
            label: `${item.code} - ${item.modelName}`,
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
          label="Item Discount"
          type="number"
        />
        <Button
          type="button"
          variant="ghost"
          className="text-destructive"
          onClick={onRemove}
        >
          <Trash2 />
        </Button>
      </div>
      {isSerialized && (
          <div className="mt-4 rounded-lg border border-primary/15 bg-primary-light/30 p-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm font-medium">Serial numbers *</span>
              <p className="text-xs text-muted-foreground">
                {normalizedSerialIds.length} of {expectedSerialCount} selected
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setSerialDialogError("");
                setIsSerialDialogOpen(true);
              }}
            >
              <Plus />
              Add serial number
            </Button>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {normalizedSerialIds.map((serial, serialIndex) => (
              <div
                key={`${serial}-${serialIndex}`}
                className="flex items-center gap-1"
              >
                <Input
                  value={serial}
                  readOnly
                  aria-label={`Serial number ${serialIndex + 1}`}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  title="Remove serial number"
                  onClick={() =>
                    form.setFieldValue(
                      `items[${index}].serialNumberIds`,
                      serialNumberIds.filter(
                        (_: number, itemIndex: number) =>
                          itemIndex !== serialIndex,
                      ),
                    )
                  }
                >
                  <Trash2 />
                </Button>
              </div>
            ))}
          </div>
          <Dialog
            open={isSerialDialogOpen}
            onOpenChange={setIsSerialDialogOpen}
          >
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add serial number</DialogTitle>
                <DialogDescription>
                  Enter or scan the serial number ID for this product.
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
                  placeholder="Serial number ID"
                />
              </div>
              {serialDialogError && (
                <p className="text-sm text-destructive">{serialDialogError}</p>
              )}
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
