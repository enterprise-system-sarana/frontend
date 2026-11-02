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
import { AlertCircle, ArrowLeft, Loader2, Package, Plus, Trash2, PackageCheck } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { salesService } from "@/services/sales/sales.service";
import { PaymentService } from "@/services/sales/payment.service";
import { quoteService } from "@/services/sales/quote.service";
import { useSale } from "@/hooks/sales/useSale";
import { useProductSerial } from "@/hooks/product/useProductSerial";
import { useCashRegister } from "@/hooks/sales/useCashRegister";
import { usePayment } from "@/hooks/sales/usePayment";
import { cn } from "@/lib/utils";
import { ROUTERS } from "@/constants/Route";
import { useLanguage } from "@/i18n/LanguageContext";
import { generateUUID } from "@/utils/uuid";

type EditableQuoteItem = QuoteItem & { uid: string };

const genUid = () => generateUUID();

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
  const { t, language } = useLanguage();
  const queryClient = useQueryClient();
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
        setFormErrors([t("quote.at_least_one_item", "At least one product item is required before saving.")]);
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
        navigate(ROUTERS.QUOTE || "/quote");
      };

      if (isEditing && quote?.id) {
        updateQuoteMutate(
          { id: Number(quote.id), request: payload },
          {
            onSuccess: handleSuccess,
          }
        );
      } else {
        createQuoteMutate(payload, {
          onSuccess: handleSuccess,
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

    const total = normalized.reduce(
      (sum, item) => sum + item.price * item.qty,
      0
    );
    const disc = normalized.reduce(
      (sum, item) => sum + item.discount_item,
      0
    );
    const overallDiscount = Number(form.state.values.discount || 0);

    form.setFieldValue(
      "grandTotal",
      Math.max(0, total - disc - overallDiscount)
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

  const { itemsTotal, itemsDiscount, grandTotal, dueAmount } = useMemo(() => {
    const total = items.reduce(
      (sum, item) => sum + Number(item.price || 0) * Number(item.qty || 0),
      0
    );
    const disc = items.reduce(
      (sum, item) => sum + Number(item.discount_item || 0),
      0
    );
    const gt = Math.max(0, total - disc - Number(currentQuoteDiscount || 0));
    const due = Math.max(0, gt - Number(currentPaidAmount || 0));
    return {
      itemsTotal: total,
      itemsDiscount: disc,
      grandTotal: gt,
      dueAmount: due,
    };
  }, [items, currentQuoteDiscount, currentPaidAmount]);

  const showItemsError = itemsTouched && items.length === 0;

  const handleGoodsArrived = async () => {
    if (!quote?.id) return;
    try {
      toast.loading(t("quote.converting_to_sale", "Converting booking to sale..."));

      const rawItems = items || [];
      const saleItems = rawItems.map((it: any) => {
        const pQty = Number(it.qty ?? it.quantity ?? 1);
        const pPrice = Number(it.price ?? 0);
        const pDiscount = Number(it.discount_item ?? it.discount ?? 0);
        const pSubtotal = Number(it.subtotal ?? Math.max(0, pPrice * pQty - pDiscount));
        return {
          productId: Number(it.productId),
          quantity: pQty,
          price: pPrice,
          itemDiscount: pDiscount,
          subtotal: pSubtotal,
          serialNumberIds: [],
        };
      });

      if (saleItems.length === 0) {
        toast.dismiss();
        toast.error("Quote has no items to convert.");
        return;
      }

      const subtotalCalc = saleItems.reduce((sum, it) => sum + it.subtotal, 0);
      const discountVal = Number(form.state.values.discount) || 0;
      const grandTotalCalc = Math.max(0, subtotalCalc - discountVal);
      const depositPaid = Number(form.state.values.paidAmount) || 0;
      const dueBal = Math.max(0, grandTotalCalc - depositPaid);
      const isPaid = depositPaid >= grandTotalCalc;

      const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, "");
      const rand = Math.floor(1000 + Math.random() * 9000);
      const posRef = `POS-${dateStr}-${rand}`;

      const salePayload: any = {
        reference: posRef,
        saleDate: new Date().toISOString().split("T")[0],
        customerId: Number(form.state.values.customerId || 1),
        storeId: 1,
        discount: discountVal,
        totalAmount: subtotalCalc,
        grandTotal: grandTotalCalc,
        paidAmount: depositPaid,
        dueAmount: dueBal,
        paymentOption: isPaid ? "PAID" : "DUE",
        paymentStatus: isPaid ? "PAID" : (depositPaid > 0 ? "PARTIAL" : "PENDING"),
        status: "PENDING",
        noted: `Pre-order Booking #${quote.no || quote.reference}${form.state.values.noted ? ` - ${form.state.values.noted}` : ""}`,
        items: saleItems,
      };

      const createdSaleRes: any = await salesService.create(salePayload);
      const newSale =
        createdSaleRes?.payload?.data ??
        createdSaleRes?.data ??
        createdSaleRes?.payload ??
        createdSaleRes;

      const newSaleId = Number(newSale?.id || 0);
      if (!newSaleId) {
        throw new Error("Failed to create sale from booking.");
      }

      if (depositPaid > 0) {
        try {
          await PaymentService.create({
            saleId: newSaleId,
            totalAmount: depositPaid,
            amount: depositPaid,
            paymentMethod: "CASH",
            paymentNo: `DEP-${newSale.reference || newSaleId}`,
            paymentDate: new Date().toISOString().split("T")[0],
            status: isPaid ? "PAID" : "PARTIAL",
          });
        } catch (payErr) {
          console.warn("Could not record initial deposit payment:", payErr);
        }
      }

      try {
        await quoteService.update(quote.id, {
          reference: String(form.state.values.reference || quote.reference || ""),
          no: String(form.state.values.no || quote.no || ""),
          date: form.state.values.date ? new Date(form.state.values.date).toISOString() : new Date().toISOString(),
          customerId: Number(form.state.values.customerId || 1),
          discount: discountVal,
          grandTotal: grandTotalCalc,
          status: "COMPLETED",
          paymentStatus: isPaid ? "PAID" : (depositPaid > 0 ? "PARTIAL" : "PENDING"),
          paidAmount: depositPaid,
          returnAmount: Number(form.state.values.returnAmount || 0),
          noted: form.state.values.noted || "",
          items: rawItems.map((it: any) => ({
            productId: Number(it.productId),
            qty: Number(it.qty ?? it.quantity ?? 1),
            price: Number(it.price ?? 0),
            discount_item: Number(it.discount_item ?? it.discount ?? 0),
            subtotal: Number(it.subtotal ?? (Number(it.price ?? 0) * Number(it.qty ?? 1))),
          })),
        });
      } catch (qErr) {
        console.warn("Could not update quote status:", qErr);
      }

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: useQuote.keys.all }),
        queryClient.invalidateQueries({ queryKey: useSale.keys.all }),
        queryClient.invalidateQueries({ queryKey: useProduct.keys.all }),
        queryClient.invalidateQueries({ queryKey: useProductSerial.keys.all }),
        queryClient.invalidateQueries({ queryKey: useCashRegister.keys.all }),
        queryClient.invalidateQueries({ queryKey: usePayment.paymentKey.all }),
      ]);

      toast.dismiss();
      toast.success(
        language === "km"
          ? "ទំនិញមកដល់ហើយ! បានបង្កើតការលក់រួចរាល់ កំពុងចូលទៅកាន់ Sale Edit..."
          : "Goods arrived! Sale created. Opening Sale Edit..."
      );

      navigate(ROUTERS.SALE_EDIT.replace(":id", String(newSaleId)));
    } catch (error: any) {
      toast.dismiss();
      const msg = error?.response?.data?.message || error?.message || "Failed to convert quote to sale.";
      toast.error(msg);
    }
  };

  return (
    <div className="py-2 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-6 border-b border-border/60 gap-4">
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => navigate(ROUTERS.QUOTE || "/quote")}
            className="h-9 w-9 rounded-xl border-border/60 hover:bg-muted/60"
            title={t("error.go_back", "Back")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {isEditing ? t("quote.edit_title", "Edit Quote") : t("quote.create_title", "Create New Quote")}
            </h1>
            <p className="text-sm text-muted-foreground">
              {isEditing
                ? t("quote.edit_desc", "Update quote details and item pricing")
                : t("quote.create_desc", "Fill out customer quotation details and product items")}
            </p>
          </div>
        </div>

        {isEditing && (quote?.status || "").toUpperCase() !== "COMPLETED" && (
          <Button
            type="button"
            onClick={handleGoodsArrived}
            className="h-10 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm gap-2 shadow-xs transition-colors cursor-pointer"
          >
            <PackageCheck className="h-4 w-4" />
            <span>{language === "km" ? "ទំនិញមកដល់ (ចូល Sale Edit)" : "Goods Arrived (Open Sale Edit)"}</span>
          </Button>
        )}
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
            {t("quote.info", "Quote Information")}
          </h3>
          <FieldGroup className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2 md:grid-cols-3">
            <FormTextField
              form={form}
              name="reference"
              label={t("common.reference", "Reference")}
              placeholder="e.g. REF-QUO-001"
              type="text"
              required
            />
            <FormTextField
              form={form}
              name="no"
              label={t("quote.quote_no", "Quote No")}
              placeholder="e.g. QUO-0001"
              type="text"
              required
            />
            <FormTextField
              form={form}
              name="date"
              label={t("common.date", "Date")}
              placeholder="Select date"
              type="date"
              required
            />
            <FormSelectField
              form={form}
              name="customerId"
              label={t("customer.name", "Customer")}
              placeholder={t("quote.select_customer", "Select customer")}
              options={customers.map((c: any) => ({
                value: String(c.id),
                label: `${c.name} ${c.phone ? `(${c.phone})` : ""}`,
              }))}
              required
            />
            <FormSelectField
              form={form}
              name="status"
              label={t("quote.quote_status", "Quote Status")}
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
              label={t("sale.payment_status", "Payment Status")}
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
                label={t("common.note", "Note")}
                placeholder={t("quote.note_placeholder", "Enter quotation notes or terms (optional)")}
              />
            </div>
          </FieldGroup>
        </section>

        {/* Section 2: Quote Items */}
        <section className="p-6 mb-8 border shadow-sm bg-card rounded-xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">
                {t("quote.items_title", "Quote Items")}
              </h3>
              <p className="text-xs text-muted-foreground">
                {t("quote.items_desc", "Select products and specify quantity, unit price, and item discounts.")}
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
              {t("quote.add_item", "Add Item")}
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
                    <TableHead className="min-w-50">{t("product.name", "Product")}</TableHead>
                    <TableHead className="w-28">{t("product.quantity", "Qty")}</TableHead>
                    <TableHead className="w-32">{t("report.unit_price", "Unit Price")} ($)</TableHead>
                    <TableHead className="w-32">{t("quote.discount", "Item Discount")} ($)</TableHead>
                    <TableHead className="w-32 text-right">{t("quote.subtotal", "Subtotal")}</TableHead>
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
                      <TableRow key={item.uid}>
                        <TableCell>
                          <Select
                            value={item.productId ? String(item.productId) : ""}
                            onValueChange={(val) => selectProduct(item.uid, val)}
                          >
                            <SelectTrigger
                              className={cn(
                                "w-full",
                                incompleteProduct &&
                                  itemsTouched &&
                                  "border-destructive"
                              )}
                            >
                              <SelectValue
                                placeholder={t("quote.select_product", "Select product")}
                              />
                            </SelectTrigger>
                            <SelectContent>
                              {products.map((p: any) => {
                                const priceNum = Number(p.price || 0);
                                return (
                                  <SelectItem key={p.id} value={String(p.id)}>
                                    <div className="flex flex-col">
                                      <span className="font-medium text-foreground">
                                        {p.name || p.modelName || `Product #${p.id}`}
                                      </span>
                                      <span className="text-xs text-muted-foreground">
                                        {p.code ? `[${p.code}] ` : ""}
                                        {formatCurrency(priceNum)}
                                      </span>
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
                        <TableCell className="text-right text-sm font-medium text-foreground">
                          {formatCurrency(subtotal)}
                        </TableCell>
                        <TableCell className="text-center">
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => removeItem(item.uid)}
                            title={t("quote.remove_item", "Remove item")}
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
                {t("quote.no_items", "No items added yet")}
              </p>
              <p className="text-xs text-muted-foreground">
                {t("quote.add_first_item", "Click the button below to add your first product to this quote.")}
              </p>
              <Button
                type="button"
                size="sm"
                onClick={addItem}
                variant="outline"
                className="mt-2"
              >
                <Plus className="h-4 w-4 mr-1.5" />
                {t("quote.add_item", "Add Item")}
              </Button>
            </div>
          )}

          {showItemsError && (
            <p className="flex items-center gap-1.5 mt-2 text-sm text-destructive">
              <AlertCircle className="w-3.5 h-3.5" />
              {t("quote.at_least_one_item", "At least one product item is required before saving.")}
            </p>
          )}
        </section>

        {/* Section 3: Financial Summary & Adjustments */}
        <section className="p-6 mb-8 border shadow-sm bg-card rounded-xl">
          <h3 className="mb-4 text-sm font-semibold tracking-wide uppercase text-muted-foreground">
            {t("quote.financials", "Summary & Financials")}
          </h3>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <FormTextField
              form={form}
              name="discount"
              label={t("quote.overall_discount", "Overall Quote Discount ($)")}
              placeholder="0.00"
              type="number"
            />
            <FormTextField
              form={form}
              name="paidAmount"
              label={`${t("quote.deposit", "Deposit / Paid Amount")} ($)`}
              placeholder="0.00"
              type="number"
            />
            <FormTextField
              form={form}
              name="returnAmount"
              label={`${t("quote.return_amount", "Return Amount")} ($)`}
              placeholder="0.00"
              type="number"
            />
          </div>

          <div className="p-5 mt-6 border rounded-xl bg-muted/40 border-border/60">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-5 text-sm">
              <div>
                <span className="text-xs uppercase text-muted-foreground font-semibold tracking-wider">
                  {t("quote.items_subtotal", "Items Subtotal")}
                </span>
                <div className="text-base font-semibold text-foreground sm:mt-1">
                  {formatCurrency(itemsTotal)}
                </div>
              </div>
              <div>
                <span className="text-xs uppercase text-muted-foreground font-semibold tracking-wider">
                  {t("quote.total_discounts", "Total Discounts")}
                </span>
                <div className="text-base font-semibold text-amber-600 sm:mt-1">
                  {formatCurrency(itemsDiscount + Number(currentQuoteDiscount || 0))}
                </div>
              </div>
              <div>
                <span className="text-xs uppercase text-muted-foreground font-semibold tracking-wider">
                  {t("common.grand_total", "Grand Total")}
                </span>
                <div className="text-base font-bold text-primary sm:mt-1">
                  {formatCurrency(grandTotal)}
                </div>
              </div>
              <div>
                <span className="text-xs uppercase text-muted-foreground font-semibold tracking-wider">
                  {t("quote.deposit", "Deposit Paid")}
                </span>
                <div className="text-base font-semibold text-emerald-600 sm:mt-1">
                  {formatCurrency(Number(currentPaidAmount) || 0)}
                </div>
              </div>
              <div>
                <span className="text-xs uppercase text-muted-foreground font-semibold tracking-wider">
                  {t("quote.due_amount", "Due Balance")}
                </span>
                <div className={cn("text-base font-bold sm:mt-1", dueAmount > 0 ? "text-rose-600" : "text-slate-600")}>
                  {formatCurrency(dueAmount)}
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
            {t("common.cancel", "Cancel")}
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
                {t("common.loading", "Saving...")}
              </span>
            ) : isEditing ? (
              t("quote.edit_title", "Update Quote")
            ) : (
              t("quote.create", "Create Quote")
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default QuoteForm;
