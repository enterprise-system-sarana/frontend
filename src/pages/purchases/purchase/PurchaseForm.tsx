import { useEffect, useMemo, useState } from "react";
import { useForm } from "@tanstack/react-form";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { FieldGroup } from "@/components/ui/field";
import FormTextField, { FormSelectField } from "@/components/ui/FormTextField";
import { Status } from "@/types/enum/status";
import { PurchaseStatus } from "@/types/enum/purchaseStatus";
import { PurchasePaymentStatus } from "@/types/enum/purchasePaymentStatus";
import {
  PurchaseSchema,
  type PurchaseFormValues,
  type PurchaseItem,
  type PurchaseRequest,
} from "@/types/purchases/Purchase";
import { usePurchase } from "@/hooks/purchases/usePurchase";
import { useSupplier } from "@/hooks/purchases/useSupplier";
import { useStore } from "@/hooks/inventory/useStore";
import { useProduct } from "@/hooks/product/useProduct";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertCircle,Package, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

type ProductUnit = { id: number; name: string; costPrice?: number };

const getProductUnits = (product: any): ProductUnit[] => {
  if (Array.isArray(product?.units) && product.units.length > 0) {
    return product.units.map((u: any) => ({
      id: Number(u.id ?? u.unitId),
      name: u.name ?? u.unitName ?? "",
      costPrice: u.costPrice != null ? Number(u.costPrice) : undefined,
    }));
  }
  if (product?.unitId) {
    return [
      {
        id: Number(product.unitId),
        name: product.unitName || "",
        costPrice:
          product.costPrice != null ? Number(product.costPrice) : undefined,
      },
    ];
  }
  return [];
};

type EditableItem = PurchaseItem & { uid: string };

const genUid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

const emptyItem = (): EditableItem => ({
  uid: genUid(),
  productId: 0,
  unitId: 0,
  quantity: 1,
  costPrice: 0,
  totalDiscount: 0,
  unitName: "",
  productName: "",
});

const formatCurrency = (value: number) =>
  Number.isFinite(value) ? `$${value.toFixed(2)}` : "$0.00";

const summarizeZodErrors = (error: any): string[] => {
  const messages = new Set<string>();
  for (const issue of error.issues) {
    const path = issue.path;
    if (path[0] === "items" && typeof path[1] === "number") {
      messages.add(`Item ${Number(path[1]) + 1}: ${issue.message}`);
    } else {
      messages.add(issue.message);
    }
  }
  return Array.from(messages);
};

export default function PurchaseForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = Boolean(id);
  const { data: purchaseData } = usePurchase.useGetPurchaseById(Number(id));
  const purchase = purchaseData?.payload;
  console.log("Data", purchase);

  const { mutate: createPurchaseMutate, isPending: isCreating } =
    usePurchase.useCreatePurchase();
  const { mutate: updatePurchaseMutate, isPending: isUpdating } =
    usePurchase.useUpdatePurchase();

  const isPending = isCreating || isUpdating;

  const { data: suppliersData } = useSupplier.useGetAllSupplier();
  const { data: storesData } = useStore.useGetAllStore();
  const { data: productsData } = useProduct.useGetAllProduct({page:1 , size: 10});

  const suppliers = suppliersData?.payload?.data || [];
  const stores = storesData?.payload?.data || [];
  const products = productsData?.payload?.data || [];

  const [items, setItems] = useState<EditableItem[]>([]);
  const [itemsInitialized, setItemsInitialized] = useState(false);
  const [itemsTouched, setItemsTouched] = useState(false);
  const [formErrors, setFormErrors] = useState<string[]>([]);

  const form = useForm({
    defaultValues: {
      reference: purchase?.reference || "",
      date: purchase?.date
        ? purchase.date.split("T")[0]
        : new Date().toISOString().split("T")[0],
      note: purchase?.note || "",
      supplierId: purchase?.supplierId ? String(purchase.supplierId) : "",
      storeId: purchase?.storeId ? String(purchase.storeId) : "",
      sellerId: purchase?.sellerId ? String(purchase.sellerId) : "",
      orderDiscount: purchase?.orderDiscount ?? 0,
      total: purchase?.total || 0,
      totalDiscount: purchase?.totalDiscount || 0,
      grandTotal: purchase?.grandTotal || 0,
      purchasesStatus: purchase?.purchasesStatus || PurchaseStatus.Ordered,
      paymentStatus: purchase?.paymentStatus || PurchasePaymentStatus.Pending,
      status: purchase?.status || Status.Active,
      items: [],
    } as PurchaseFormValues,
    validators: {
      onSubmit: PurchaseSchema,
    },
    onSubmitInvalid: ({ formApi }) => {
      const result = PurchaseSchema.safeParse(formApi.state.values);
      setFormErrors(
        !result.success
          ? summarizeZodErrors(result.error)
          : ["Please check every field, including items, and try again."],
      );
    },
    onSubmit: async ({ value }) => {
      setFormErrors([]);

      const itemsTotal = value.items.reduce(
        (sum, item: any) =>
          sum + Number(item.costPrice || 0) * Number(item.quantity || 0),
        0,
      );
      const itemsDiscount = value.items.reduce(
        (sum, item: any) => sum + Number(item.totalDiscount || 0),
        0,
      );
      const orderDiscount = Number(value.orderDiscount ?? 0);
      const grandTotal = Math.max(
        0,
        itemsTotal - itemsDiscount - orderDiscount,
      );

      const payload: PurchaseRequest = {
        reference: String(value.reference),
        date: value.date
          ? new Date(value.date).toISOString()
          : new Date().toISOString(),
        note: value.note ? String(value.note) : undefined,
        supplierId: Number(value.supplierId),
        storeId: Number(value.storeId),
        sellerId: Number(value.sellerId ?? 0),
        orderDiscount,
        total: itemsTotal,
        totalDiscount: itemsDiscount,
        grandTotal,
        purchasesStatus: value.purchasesStatus,
        paymentStatus: value.paymentStatus,
        status: value.status,
        items: value.items.map((item: any) => ({
          productId: Number(item.productId),
          unitId: Number(item.unitId),
          quantity: Number(item.quantity),
          costPrice: Number(item.costPrice),
          totalDiscount: Number(item.totalDiscount),
          productName: item.productName,
          unitName: item.unitName,
        })),
      };

      const handleSuccess = () => navigate("/purchase");

      if (isEditing && purchase) {
        updatePurchaseMutate(
          { id: purchase.id, request: payload },
          { onSuccess: handleSuccess },
        );
      } else {
        createPurchaseMutate(payload, { onSuccess: handleSuccess });
      }
    },
  });

  useEffect(() => {
    if (purchase && !itemsInitialized) {
      const matchedSupplier = suppliers.find(
        (s: any) => s.name === purchase.supplierName,
      );
      const matchedStore = stores.find(
        (s: any) => s.name === purchase.storeName,
      );

      form.setFieldValue("reference", purchase.reference || "");
      form.setFieldValue(
        "date",
        purchase.date ? purchase.date.split("T")[0] : "",
      );
      form.setFieldValue(
        "supplierId",
        matchedSupplier ? String(matchedSupplier.id) : "",
      );
      form.setFieldValue(
        "storeId",
        matchedStore ? String(matchedStore.id) : "",
      );
      form.setFieldValue("note", purchase.note || "");
      form.setFieldValue(
        "purchasesStatus",
        purchase.purchasesStatus || PurchaseStatus.Ordered,
      );
      form.setFieldValue(
        "paymentStatus",
        purchase.paymentStatus || PurchasePaymentStatus.Pending,
      );
      form.setFieldValue("status", purchase.status || Status.Active);
      if (purchase.items && purchase.items.length > 0) {
        const mappedItems = purchase.items.map((item: any) => {
          const product = products.find(
            (p: any) => p.id === Number(item.productId),
          );
          const units = getProductUnits(product);
          const matchedUnit = units.find(
            (u) =>
              u.id === Number(item.unitId) ||
              u.name.toLowerCase() === (item.unitName || "").toLowerCase(),
          );
          const resolvedUnitId = matchedUnit
            ? matchedUnit.id
            : units[0]?.id || Number(item.unitId || 0);

          return {
            uid: genUid(),
            productId: Number(item.productId),
            unitId: Number(resolvedUnitId),
            quantity: Number(item.quantity ?? 1),
            costPrice: Number(item.costPrice ?? 0),
            totalDiscount: Number(item.totalDiscount ?? 0),
            productName: item.productName || product?.name || "",
            unitName:
              matchedUnit?.name || item.unitName || units[0]?.name || "",
          };
        });

        setItems(mappedItems);
        form.setFieldValue("items", mappedItems as any);
      }

      setItemsInitialized(true);
    }
  }, [purchase, itemsInitialized, suppliers, stores, products, form]);
  useEffect(() => {
    const normalized = items.map((item) => ({
      productId: Number(item.productId),
      unitId: Number(item.unitId),
      quantity: Number(item.quantity),
      costPrice: Number(item.costPrice),
      totalDiscount: Number(item.totalDiscount),
      productName: item.productName,
      unitName: item.unitName,
    }));
    form.setFieldValue("items", normalized as any);

    const itemsTotal = normalized.reduce(
      (sum, item) => sum + item.costPrice * item.quantity,
      0,
    );
    const itemsDiscount = normalized.reduce(
      (sum, item) => sum + item.totalDiscount,
      0,
    );
    const orderDiscount = Number(form.state.values.orderDiscount ?? 0);
    form.setFieldValue("total", itemsTotal);
    form.setFieldValue("totalDiscount", itemsDiscount);
    form.setFieldValue(
      "grandTotal",
      Math.max(0, itemsTotal - itemsDiscount - orderDiscount),
    );
  }, [items]);

  const addItem = () => setItems((prev) => [...prev, emptyItem()]);
  const removeItem = (uid: string) =>
    setItems((prev) => prev.filter((item) => item.uid !== uid));
  const updateItem = (uid: string, patch: Partial<EditableItem>) =>
    setItems((prev) =>
      prev.map((item) => (item.uid === uid ? { ...item, ...patch } : item)),
    );

  const selectProduct = (uid: string, productIdStr: string) => {
    const product = products.find((p: any) => p.id === Number(productIdStr));
    const units = getProductUnits(product);
    const defaultUnit = units[0];
    updateItem(uid, {
      productId: Number(productIdStr),
      unitId: defaultUnit ? Number(defaultUnit.id) : 0,
      productName: product?.name || "",
      unitName: defaultUnit?.name || "",
      costPrice: Number(defaultUnit?.costPrice ?? product?.costPrice ?? 0),
    });
  };

  const selectUnit = (uid: string, productIdStr: string, unitIdStr: string) => {
    const product = products.find((p: any) => p.id === Number(productIdStr));
    const units = getProductUnits(product);
    const unit = units.find((u) => u.id === Number(unitIdStr));
    updateItem(uid, {
      unitId: unit ? Number(unit.id) : 0,
      unitName: unit?.name || "",
      ...(unit?.costPrice != null ? { costPrice: Number(unit.costPrice) } : {}),
    });
  };

  const orderDiscountLive = form.state.values.orderDiscount ?? 0;
  const { itemsTotal, itemsDiscount, grandTotal } = useMemo(() => {
    const itemsTotal = items.reduce(
      (sum, item) => sum + item.costPrice * item.quantity,
      0,
    );
    const itemsDiscount = items.reduce(
      (sum, item) => sum + item.totalDiscount,
      0,
    );
    const grandTotal = Math.max(
      0,
      itemsTotal - itemsDiscount - Number(orderDiscountLive || 0),
    );
    return { itemsTotal, itemsDiscount, grandTotal };
  }, [items, orderDiscountLive]);

  const showItemsError = itemsTouched && items.length === 0;

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
          setItemsTouched(true);
          form.handleSubmit();
        }}
      >
        {formErrors.length > 0 && (
          <div className="mb-6 rounded-lg border border-destructive/40 bg-destructive/5 p-4">
            <div className="flex items-center gap-1.5 text-sm font-medium text-destructive mb-1">
              <AlertCircle className="h-4 w-4" />
              Please fix the following before saving
            </div>
            <ul className="list-disc pl-6 text-sm text-destructive/90 space-y-0.5">
              {formErrors.map((message) => (
                <li key={message}>{message}</li>
              ))}
            </ul>
          </div>
        )}

        <section className="mb-8 bg-card border rounded-xl p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">
            Details
          </h3>
          <FieldGroup className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
            <FormTextField
              form={form}
              name="reference"
              label="Reference"
              placeholder="Enter purchase reference"
              type="text"
              required
            />
            <FormTextField
              form={form}
              name="date"
              label="Date"
              placeholder="Select date"
              type="date"
              required
            />
            <FormSelectField
              form={form}
              name="supplierId"
              label="Supplier"
              placeholder="Select supplier"
              options={suppliers.map((supplier: any) => ({
                value: String(supplier.id),
                label: supplier.name,
              }))}
              required
            />
            <FormSelectField
              form={form}
              name="storeId"
              label="Store"
              placeholder="Select store"
              options={stores.map((store: any) => ({
                value: String(store.id),
                label: store.name,
              }))}
              required
            />
            <FormTextField
              form={form}
              name="sellerId"
              label="Seller ID"
              placeholder="Enter seller ID"
              type="number"
            />
            <FormTextField
              form={form}
              name="orderDiscount"
              label="Order Discount"
              placeholder="0.00"
              type="number"
            />
            <div className="sm:col-span-2">
              <FormTextField
                form={form}
                name="note"
                label="Note"
                placeholder="Enter notes (optional)"
                type="text"
              />
            </div>
          </FieldGroup>
        </section>

        <section className="mb-8 bg-card border rounded-xl p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">
            Status
          </h3>
          <FieldGroup className="grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-4">
            <FormSelectField
              form={form}
              name="purchasesStatus"
              label="Purchase Status"
              placeholder="Select status"
              options={Object.entries(PurchaseStatus).map(([, value]) => ({
                value: value,
                label: value,
              }))}
              required
            />
            <FormSelectField
              form={form}
              name="paymentStatus"
              label="Payment Status"
              placeholder="Select status"
              options={Object.entries(PurchasePaymentStatus).map(
                ([, value]) => ({
                  value: value,
                  label: value,
                }),
              )}
              required
            />
            <FormSelectField
              form={form}
              name="status"
              label="Record Status"
              placeholder="Select status"
              options={Object.entries(Status).map(([, value]) => ({
                value: value,
                label: value,
              }))}
              required
            />
          </FieldGroup>
        </section>

        <section className="mb-8 bg-card border rounded-xl p-6 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Items
            </h3>
            <Button type="button" size="sm" onClick={addItem} variant="outline">
              <Plus className="h-4 w-4 mr-1.5" />
              Add Item
            </Button>
          </div>

          {items.length > 0 ? (
            <div
              className={cn(
                "border rounded-xl overflow-hidden",
                showItemsError && "border-destructive",
              )}
            >
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50 hover:bg-muted/50">
                    <TableHead className="min-w-45">Product</TableHead>
                    <TableHead className="min-w-32.5">Unit</TableHead>
                    <TableHead className="w-24">Qty</TableHead>
                    <TableHead className="w-28">Cost Price</TableHead>
                    <TableHead className="w-28">Discount</TableHead>
                    <TableHead className="w-28 text-right">Subtotal</TableHead>
                    <TableHead className="w-12" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => {
                    const subtotal = Math.max(
                      0,
                      item.costPrice * item.quantity - item.totalDiscount,
                    );
                    const product = products.find(
                      (p: any) => p.id === item.productId,
                    );
                    const units = getProductUnits(product);
                    const incompleteProduct = !item.productId;
                    const incompleteUnit = !item.unitId;

                    return (
                      <TableRow key={item.uid}>
                        <TableCell>
                          <Select
                            value={item.productId ? String(item.productId) : ""}
                            onValueChange={(value) =>
                              selectProduct(item.uid, value)
                            }
                          >
                            <SelectTrigger
                              className={cn(
                                "w-full",
                                incompleteProduct &&
                                  itemsTouched &&
                                  "border-destructive",
                              )}
                            >
                              <SelectValue placeholder="Select product" />
                            </SelectTrigger>
                            <SelectContent>
                              {products.map((p: any) => (
                                <SelectItem key={p.id} value={String(p.id)}>
                                  {p.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          {units.length > 1 ? (
                            <Select
                              value={item.unitId ? String(item.unitId) : ""}
                              onValueChange={(value) =>
                                selectUnit(
                                  item.uid,
                                  String(item.productId),
                                  value,
                                )
                              }
                              disabled={!item.productId}
                            >
                              <SelectTrigger
                                className={cn(
                                  "w-full",
                                  incompleteUnit &&
                                    itemsTouched &&
                                    "border-destructive",
                                )}
                              >
                                <SelectValue placeholder="Select unit" />
                              </SelectTrigger>
                              <SelectContent>
                                {units.map((unit) => (
                                  <SelectItem
                                    key={unit.id}
                                    value={String(unit.id)}
                                  >
                                    {unit.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <span
                              className={cn(
                                "text-sm text-muted-foreground",
                                incompleteUnit &&
                                  !incompleteProduct &&
                                  itemsTouched &&
                                  "text-destructive",
                              )}
                            >
                              {item.unitName ||
                                (incompleteUnit && !incompleteProduct
                                  ? "missing unit"
                                  : "-")}
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="0.01"
                            step="0.01"
                            value={item.quantity}
                            onChange={(e) =>
                              updateItem(item.uid, {
                                quantity: Number(e.target.value) || 0,
                              })
                            }
                            className={cn(
                              "w-full",
                              item.quantity <= 0 &&
                                itemsTouched &&
                                "border-destructive",
                            )}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.costPrice}
                            onChange={(e) =>
                              updateItem(item.uid, {
                                costPrice: Number(e.target.value) || 0,
                              })
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.totalDiscount}
                            onChange={(e) =>
                              updateItem(item.uid, {
                                totalDiscount: Number(e.target.value) || 0,
                              })
                            }
                          />
                        </TableCell>
                        <TableCell className="text-right text-sm font-medium">
                          {formatCurrency(subtotal)}
                        </TableCell>
                        <TableCell>
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className="text-destructive hover:text-destructive"
                            onClick={() => removeItem(item.uid)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div
              className={cn(
                "border border-dashed rounded-xl p-10 text-center flex flex-col items-center gap-2",
                showItemsError
                  ? "border-destructive"
                  : "border-muted-foreground/30",
              )}
            >
              <Package className="h-6 w-6 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                No items yet. Add at least one product to this purchase.
              </p>
              <Button
                type="button"
                size="sm"
                onClick={addItem}
                variant="outline"
                className="mt-1"
              >
                <Plus className="h-4 w-4 mr-1.5" />
                Add Item
              </Button>
            </div>
          )}

          {showItemsError && (
            <p className="mt-2 flex items-center gap-1.5 text-sm text-destructive">
              <AlertCircle className="h-3.5 w-3.5" />
              Add at least one item before saving.
            </p>
          )}
        </section>

        <section className="rounded-xl bg-muted/40 border p-6 shadow-sm">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-y-2 text-sm">
            <div className="flex justify-between sm:block">
              <span className="text-muted-foreground">Items Total</span>
              <div className="font-semibold sm:mt-0.5">
                {formatCurrency(itemsTotal)}
              </div>
            </div>
            <div className="flex justify-between sm:block">
              <span className="text-muted-foreground">Total Discount</span>
              <div className="font-semibold sm:mt-0.5">
                {formatCurrency(itemsDiscount + Number(orderDiscountLive || 0))}
              </div>
            </div>
            <div className="flex justify-between sm:block">
              <span className="text-muted-foreground">Grand Total</span>
              <div className="font-bold text-base sm:mt-0.5">
                {formatCurrency(grandTotal)}
              </div>
            </div>
          </div>
        </section>
      </form>

      <div className="flex gap-2 float-end mt-6">
        <Button variant="outline" onClick={() => navigate("/purchase")}>
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
