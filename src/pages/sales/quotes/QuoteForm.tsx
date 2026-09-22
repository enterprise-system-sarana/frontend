import { useEffect, useMemo, useState } from "react";
import { useForm } from "@tanstack/react-form";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { FieldGroup } from "@/components/ui/field";
import FormTextField, { FormSelectField, FormTextareaField } from "@/components/ui/FormTextField";
import {
  QuoteSchema,
  type QuoteFormValues,
  type QuoteItem,
  type QuoteRequest,
} from "@/types/quote/Quote";
import { useQuote } from "@/hooks/sales/useQuote";
import { useCustomer } from "@/hooks/sales/useCustomer";
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
import { AlertCircle, ArrowLeft, Loader2, Package, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { ROUTERS } from "@/constants/Route";
import { toast } from "sonner";

type EditableQuoteItem = QuoteItem & { uid: string };

const genUid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

const emptyItem = (): EditableQuoteItem => ({
  uid: genUid(),
  productId: 0,
  qty: 1,
  price: 0,
  discount_item: 0,
  subtotal: 0,
  productName: "",
  productCode: "",
});

const formatCurrency = (value: number) =>
  Number.isFinite(value) ? `$${Number(value).toFixed(2)}` : "$0.00";

const summarizeZodErrors = (error: any): string[] => {
  const messages = new Set<string>();
  if (error?.issues) {
    for (const issue of error.issues) {
      const path = issue.path;
      if (path[0] === "items" && typeof path[1] === "number") {
        messages.add(`Item ${Number(path[1]) + 1}: ${issue.message}`);
      } else {
        messages.add(issue.message);
      }
    }
  }
  return Array.from(messages);
};

export const QuoteForm = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id && !isNaN(Number(id)));

  const { data: quoteData, isLoading: isLoadingQuote } = useQuote.useGetQuoteById(
    Number(id),
    isEditing
  );
  const quote = quoteData?.payload?.data || quoteData?.payload || quoteData;

  const { mutate: createQuoteMutate, isPending: isCreating } =
    useQuote.useCreateQuote();
  const { mutate: updateQuoteMutate, isPending: isUpdating } =
    useQuote.useUpdateQuote();

  const isPending = isCreating || isUpdating || isLoadingQuote;

  const { data: customersData } = useCustomer.useGetAllCustomer({ page: 1, size: 100 });
  const { data: productsData } = useProduct.useGetAllProduct({ page: 1, size: 100 });

  const customers = customersData?.payload?.data || [];
  const products = productsData?.payload?.data || [];

  const [items, setItems] = useState<EditableQuoteItem[]>([]);
  const [itemsInitialized, setItemsInitialized] = useState(false);
  const [itemsTouched, setItemsTouched] = useState(false);
  const [formErrors, setFormErrors] = useState<string[]>([]);

  const form = useForm({
    defaultValues: {
      reference: "",
      no: "",
      date: new Date().toISOString().split("T")[0],
      customerId: 0,
      discount: 0,
      grandTotal: 0,
      status: "PENDING",
      paymentStatus: "PENDING",
      paidAmount: 0,
      returnAmount: 0,
      noted: "",
      items: [],
    } as QuoteFormValues,
    validators: {
      onSubmit: QuoteSchema,
    },
    onSubmitInvalid: ({ formApi }) => {
      const result = QuoteSchema.safeParse(formApi.state.values);
      setFormErrors(
        !result.success
          ? summarizeZodErrors(result.error)
          : ["Please check every field, including items, and try again."]
      );
    },
    onSubmit: async ({ value }) => {
      setFormErrors([]);

      if (items.length === 0) {
        setItemsTouched(true);
        setFormErrors(["At least one product item is required."]);
        return;
      }

      const itemsTotal = items.reduce(
        (sum, item) => sum + Number(item.price || 0) * Number(item.qty || 0),
        0
      );
      const itemsDiscount = items.reduce(
        (sum, item) => sum + Number(item.discount_item || 0),
        0
      );
      const overallDiscount = Number(value.discount || 0);
      const calculatedGrandTotal = Math.max(
        0,
        itemsTotal - itemsDiscount - overallDiscount
      );

      const formattedDate = value.date
        ? value.date.includes("T")
          ? value.date
          : new Date(value.date).toISOString()
        : new Date().toISOString();

      const payload: QuoteRequest = {
        reference: String(value.reference),
        no: String(value.no),
        date: formattedDate,
        customerId: Number(value.customerId),
        discount: overallDiscount,
        grandTotal: calculatedGrandTotal,
        status: String(value.status),
        paymentStatus: String(value.paymentStatus),
        paidAmount: Number(value.paidAmount || 0),
        returnAmount: Number(value.returnAmount || 0),
        noted: value.noted ? String(value.noted) : "",
        items: items.map((item) => {
          const sub = Math.max(
            0,
            Number(item.price || 0) * Number(item.qty || 0) - Number(item.discount_item || 0)
          );
          return {
            productId: Number(item.productId),
            price: Number(item.price || 0),
            qty: Number(item.qty || 1),
            discount_item: Number(item.discount_item || 0),
            subtotal: sub,
          };
        }),
      };

      const handleSuccess = () => {
        toast.success(isEditing ? "Quote updated successfully" : "Quote created successfully");
        navigate(ROUTERS.QUOTE || "/quote");
      };

      if (isEditing && quote?.id) {
        updateQuoteMutate(
          { id: Number(quote.id), request: payload },
          {
            onSuccess: handleSuccess,
            onError: (err: any) => {
              toast.error(err?.response?.data?.message || "Failed to update quote");
            },
          }
        );
      } else {
        createQuoteMutate(payload, {
          onSuccess: handleSuccess,
          onError: (err: any) => {
            toast.error(err?.response?.data?.message || "Failed to create quote");
          },
        });
      }
    },
  });

  // Populate form values when editing an existing quote
  useEffect(() => {
    if (quote && !itemsInitialized && isEditing) {
      form.setFieldValue("reference", quote.reference || "");
      form.setFieldValue("no", quote.no || "");
      form.setFieldValue(
        "date",
        quote.date
          ? String(quote.date).split("T")[0]
          : new Date().toISOString().split("T")[0]
      );
      form.setFieldValue(
        "customerId",
        Number(quote.customerId || quote.customer?.id || 0)
      );
      form.setFieldValue("discount", Number(quote.discount || 0));
      form.setFieldValue("grandTotal", Number(quote.grandTotal || 0));
      form.setFieldValue("status", quote.status || "PENDING");
      form.setFieldValue(
        "paymentStatus",
        quote.paymentStatus || quote.statusPayment || "PENDING"
      );
      form.setFieldValue("paidAmount", Number(quote.paidAmount || 0));
      form.setFieldValue("returnAmount", Number(quote.returnAmount || 0));
      form.setFieldValue("noted", quote.noted || quote.note || "");

      if (quote.items && Array.isArray(quote.items) && quote.items.length > 0) {
        const mappedItems: EditableQuoteItem[] = quote.items.map((item: any) => {
          const product = products.find((p: any) => p.id === Number(item.productId));
          const pPrice = Number(item.price ?? product?.price ?? 0);
          const pQty = Number(item.qty ?? item.quantity ?? 1);
          const pDiscount = Number(item.discount_item ?? item.discount ?? 0);
          const pSubtotal =
            Number(item.subtotal) ||
            Math.max(0, pPrice * pQty - pDiscount);

          return {
            uid: genUid(),
            productId: Number(item.productId),
            qty: pQty,
            price: pPrice,
            discount_item: pDiscount,
            subtotal: pSubtotal,
            productName:
              item.productName ||
              product?.name ||
              product?.modelName ||
              `Product #${item.productId}`,
            productCode: item.productCode || product?.code || "",
          };
        });

        setItems(mappedItems);
        form.setFieldValue("items", mappedItems as any);
      }

      setItemsInitialized(true);
    }
  }, [quote, itemsInitialized, isEditing, products, form]);

  // Synchronize item calculations with form state
  useEffect(() => {
    const normalized = items.map((item) => {
      const sub = Math.max(
        0,
        Number(item.price || 0) * Number(item.qty || 0) - Number(item.discount_item || 0)
      );
      return {
        productId: Number(item.productId),
        qty: Number(item.qty),
        price: Number(item.price),
        discount_item: Number(item.discount_item),
        subtotal: sub,
        productName: item.productName,
        productCode: item.productCode,
      };
    });

    form.setFieldValue("items", normalized as any);

    const itemsTotal = normalized.reduce(
      (sum, item) => sum + item.price * item.qty,
      0
    );
    const itemsDiscount = normalized.reduce(
      (sum, item) => sum + item.discount_item,
      0
    );
    const overallDiscount = Number(form.state.values.discount || 0);

    form.setFieldValue(
      "grandTotal",
      Math.max(0, itemsTotal - itemsDiscount - overallDiscount)
    );
  }, [items]);

  const addItem = () => setItems((prev) => [...prev, emptyItem()]);

  const removeItem = (uid: string) =>
    setItems((prev) => prev.filter((item) => item.uid !== uid));

  const updateItem = (uid: string, patch: Partial<EditableQuoteItem>) =>
    setItems((prev) =>
      prev.map((item) => {
        if (item.uid === uid) {
          const updated = { ...item, ...patch };
          updated.subtotal = Math.max(
            0,
            Number(updated.price || 0) * Number(updated.qty || 0) -
              Number(updated.discount_item || 0)
          );
          return updated;
        }
        return item;
      })
    );

  const selectProduct = (uid: string, productIdStr: string) => {
    const product = products.find((p: any) => p.id === Number(productIdStr));
    const pPrice = Number(product?.costPrice ?? product?.price ?? 0);

    updateItem(uid, {
      productId: Number(productIdStr),
      productName: product?.name || product?.modelName || product?.code || "",
      productCode: product?.code || "",
      price: pPrice,
    });
  };

  const currentQuoteDiscount = form.state.values.discount || 0;
  const currentPaidAmount = form.state.values.paidAmount || 0;

  const { itemsTotal, itemsDiscount, grandTotal } = useMemo(() => {
    const total = items.reduce(
      (sum, item) => sum + Number(item.price || 0) * Number(item.qty || 0),
      0
    );
    const disc = items.reduce(
      (sum, item) => sum + Number(item.discount_item || 0),
      0
    );
    const gt = Math.max(0, total - disc - Number(currentQuoteDiscount || 0));
    return {
      itemsTotal: total,
      itemsDiscount: disc,
      grandTotal: gt,
    };
  }, [items, currentQuoteDiscount]);

  const showItemsError = itemsTouched && items.length === 0;

  return (
    <div className="py-2 pb-16">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 mb-6 border-b border-border/60">
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => navigate(ROUTERS.QUOTE || "/quote")}
            className="h-9 w-9 rounded-xl border-border/60 hover:bg-muted/60"
            title="Back"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {isEditing ? "Edit Quote" : "Create New Quote"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {isEditing
                ? "Update quote details and item pricing"
                : "Fill out customer quotation details and product items"}
            </p>
          </div>
        </div>
      </div>

      <form
        id="quote-form"
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setItemsTouched(true);
          form.handleSubmit();
        }}
      >
        {formErrors.length > 0 && (
          <div className="p-4 mb-6 border rounded-lg border-destructive/40 bg-destructive/5">
            <div className="flex items-center gap-1.5 text-sm font-medium text-destructive mb-1">
              <AlertCircle className="w-4 h-4" />
              Please fix the following before saving
            </div>
            <ul className="pl-6 space-y-0.5 text-sm list-disc text-destructive/90">
              {formErrors.map((message) => (
                <li key={message}>{message}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Section 1: Quote Details */}
        <section className="p-6 mb-8 border shadow-sm bg-card rounded-xl">
          <h3 className="mb-4 text-sm font-semibold tracking-wide uppercase text-muted-foreground">
            Quote Information
          </h3>
          <FieldGroup className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2 md:grid-cols-3">
            <FormTextField
              form={form}
              name="reference"
              label="Reference"
              placeholder="e.g. REF-QUO-001"
              type="text"
              required
            />
            <FormTextField
              form={form}
              name="no"
              label="Quote No"
              placeholder="e.g. QUO-0001"
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
              name="customerId"
              label="Customer"
              placeholder="Select customer"
              options={customers.map((c: any) => ({
                value: String(c.id),
                label: `${c.name} ${c.phone ? `(${c.phone})` : ""}`,
              }))}
              required
            />
            <FormSelectField
              form={form}
              name="status"
              label="Quote Status"
              placeholder="Select status"
              options={[
                { value: "PENDING", label: "Pending" },
                { value: "APPROVED", label: "Approved" },
                { value: "ORDERED", label: "Ordered" },
                { value: "COMPLETED", label: "Completed" },
                { value: "REJECTED", label: "Rejected" },
              ]}
              required
            />
            <FormSelectField
              form={form}
              name="paymentStatus"
              label="Payment Status"
              placeholder="Select payment status"
              options={[
                { value: "PENDING", label: "Pending" },
                { value: "PAID", label: "Paid" },
                { value: "PARTIAL", label: "Partial" },
              ]}
              required
            />
            <div className="sm:col-span-2 md:col-span-3">
              <FormTextareaField
                form={form}
                name="noted"
                label="Note"
                placeholder="Enter quotation notes or terms (optional)"
              />
            </div>
          </FieldGroup>
        </section>

        {/* Section 2: Quote Items */}
        <section className="p-6 mb-8 border shadow-sm bg-card rounded-xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">
                Quote Items
              </h3>
              <p className="text-xs text-muted-foreground">
                Select products and specify quantity, unit price, and item discounts.
              </p>
            </div>
            <Button
              type="button"
              size="sm"
              onClick={addItem}
              variant="outline"
              className="border-primary/40 text-primary hover:bg-primary/10"
            >
              <Plus className="h-4 w-4 mr-1.5" />
              Add Item
            </Button>
          </div>

          {items.length > 0 ? (
            <div
              className={cn(
                "border rounded-xl overflow-hidden",
                showItemsError && "border-destructive"
              )}
            >
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50 hover:bg-muted/50">
                    <TableHead className="min-w-50">Product</TableHead>
                    <TableHead className="w-28">Qty</TableHead>
                    <TableHead className="w-32">Unit Price ($)</TableHead>
                    <TableHead className="w-32">Item Discount ($)</TableHead>
                    <TableHead className="w-32 text-right">Subtotal</TableHead>
                    <TableHead className="w-12 text-center" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => {
                    const subtotal = Math.max(
                      0,
                      Number(item.price || 0) * Number(item.qty || 0) -
                        Number(item.discount_item || 0)
                    );
                    const incompleteProduct = !item.productId;

                    return (
                      <TableRow key={item.uid} className="hover:bg-muted/30">
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
                                  "border-destructive ring-1 ring-destructive"
                              )}
                            >
                              <SelectValue placeholder="Select product" />
                            </SelectTrigger>
                            <SelectContent>
                              {products.map((p: any) => {
                                const displayName =
                                  p.name ||
                                  p.modelName ||
                                  p.code ||
                                  `Product #${p.id}`;
                                return (
                                  <SelectItem key={p.id} value={String(p.id)}>
                                    <div className="flex items-center gap-2">
                                      <span className="font-medium">
                                        {displayName}
                                      </span>
                                      {p.code && (
                                        <span className="text-xs text-muted-foreground font-mono">
                                          ({p.code})
                                        </span>
                                      )}
                                    </div>
                                  </SelectItem>
                                );
                              })}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="0.01"
                            step="any"
                            value={item.qty}
                            onChange={(e) =>
                              updateItem(item.uid, {
                                qty: Number(e.target.value) || 0,
                              })
                            }
                            className={cn(
                              "w-full",
                              Number(item.qty) <= 0 &&
                                itemsTouched &&
                                "border-destructive"
                            )}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.price}
                            onChange={(e) =>
                              updateItem(item.uid, {
                                price: Number(e.target.value) || 0,
                              })
                            }
                            className="w-full"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.discount_item}
                            onChange={(e) =>
                              updateItem(item.uid, {
                                discount_item: Number(e.target.value) || 0,
                              })
                            }
                            className="w-full"
                          />
                        </TableCell>
                        <TableCell className="text-right text-sm font-semibold text-[#566a7f]">
                          {formatCurrency(subtotal)}
                        </TableCell>
                        <TableCell className="text-center">
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => removeItem(item.uid)}
                            title="Remove item"
                          >
                            <Trash2 className="w-4 h-4" />
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
                  ? "border-destructive bg-destructive/5"
                  : "border-muted-foreground/30 bg-muted/10"
              )}
            >
              <Package className="w-8 h-8 text-muted-foreground" />
              <p className="text-sm font-medium text-foreground">
                No items added yet
              </p>
              <p className="text-xs text-muted-foreground">
                Click the button below to add your first product to this quote.
              </p>
              <Button
                type="button"
                size="sm"
                onClick={addItem}
                variant="outline"
                className="mt-2"
              >
                <Plus className="h-4 w-4 mr-1.5" />
                Add Item
              </Button>
            </div>
          )}

          {showItemsError && (
            <p className="flex items-center gap-1.5 mt-2 text-sm text-destructive">
              <AlertCircle className="w-3.5 h-3.5" />
              At least one product item is required before saving.
            </p>
          )}
        </section>

        {/* Section 3: Financial Summary & Adjustments */}
        <section className="p-6 mb-8 border shadow-sm bg-card rounded-xl">
          <h3 className="mb-4 text-sm font-semibold tracking-wide uppercase text-muted-foreground">
            Summary & Financials
          </h3>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <FormTextField
              form={form}
              name="discount"
              label="Overall Quote Discount ($)"
              placeholder="0.00"
              type="number"
            />
            <FormTextField
              form={form}
              name="paidAmount"
              label="Paid Amount ($)"
              placeholder="0.00"
              type="number"
            />
            <FormTextField
              form={form}
              name="returnAmount"
              label="Return Amount ($)"
              placeholder="0.00"
              type="number"
            />
          </div>

          <div className="p-5 mt-6 border rounded-xl bg-muted/40 border-border/60">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 text-sm">
              <div>
                <span className="text-xs uppercase text-muted-foreground font-semibold tracking-wider">
                  Items Subtotal
                </span>
                <div className="text-base font-semibold text-foreground sm:mt-1">
                  {formatCurrency(itemsTotal)}
                </div>
              </div>
              <div>
                <span className="text-xs uppercase text-muted-foreground font-semibold tracking-wider">
                  Total Discounts
                </span>
                <div className="text-base font-semibold text-[#ffab00] sm:mt-1">
                  {formatCurrency(itemsDiscount + Number(currentQuoteDiscount || 0))}
                </div>
              </div>
              <div>
                <span className="text-xs uppercase text-muted-foreground font-semibold tracking-wider">
                  Paid Amount
                </span>
                <div className="text-base font-semibold text-[#71dd37] sm:mt-1">
                  {formatCurrency(Number(currentPaidAmount) || 0)}
                </div>
              </div>
              <div>
                <span className="text-xs uppercase text-muted-foreground font-semibold tracking-wider">
                  Grand Total
                </span>
                <div className="text-lg font-bold text-[#696cff] sm:mt-1">
                  {formatCurrency(grandTotal)}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Actions Bar */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(ROUTERS.QUOTE || "/quote")}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="quote-form"
            disabled={isPending}
            className="min-w-[140px] bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {isPending ? (
              <span className="flex items-center gap-1.5">
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </span>
            ) : isEditing ? (
              "Update Quote"
            ) : (
              "Create Quote"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default QuoteForm;
