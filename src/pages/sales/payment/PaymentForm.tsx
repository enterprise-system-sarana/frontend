import { useForm } from "@tanstack/react-form";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  WalletCards,
  X,
  Coins,
  AlertCircle,
  CheckCircle2,
  Banknote,
  Receipt,
  Plus,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";

import { Status } from "@/types/enum/status";
import { usePayment } from "@/hooks/sales/usePayment";
import { useSale } from "@/hooks/sales/useSale";
import { useProduct } from "@/hooks/product/useProduct";
import { useProductSerial } from "@/hooks/product/useProductSerial";
import type { PaymentRequest, PaymentResponse } from "@/types/sales/Payment";
import { useBank } from "@/hooks/finance/useBank";
import { FieldGroup } from "@/components/ui/field";
import FormTextField, { FormSelectField } from "@/components/ui/FormTextField";
import { useLanguage } from "@/i18n/LanguageContext";

type FormPaymentProps = {
  open: boolean;
  setOpen: (open: boolean) => void;
  payment: PaymentResponse | null;
  saleId?: number;
  purchaseId?: number;
  amount?: number;
  mode?: "sale" | "purchase";
  orderRef?: string;
  onPurchasePayment?: (purchaseId: number) => Promise<void> | void;
  onPaymentSubmit?: (request: PaymentRequest) => Promise<boolean | void> | boolean | void;
  banks?: Array<{ id: number; name?: string; bankName?: string; accountNumber?: string }>;
};

const PaymentForm = ({
  open,
  setOpen,
  payment,
  saleId,
  purchaseId,
  amount,
  mode = "sale",
  orderRef,
  onPurchasePayment,
  onPaymentSubmit,
  banks = [],
}: FormPaymentProps) => {
  const queryClient = useQueryClient();
  const { t, language } = useLanguage();
  const { mutate: createPaymentMutate, isPending: isCreating } = usePayment.createPayment();
  const { mutate: updatePaymentMutate, isPending: isUpdating } = usePayment.updatePayment();
  const completeSale = useSale.Complete();
  const { data: bankData } = useBank.useGetAllBank({ page: 1, size: 100 });

  const bankOptions = (bankData?.payload?.data || banks).map(
    (b: { id: number; name?: string; bankName?: string; accountNumber?: string }) => ({
      label: b.name || b.bankName || "Bank",
      value: String(b.id),
    })
  );

  const paymentMethodOptions = [
    { label: "💵 Cash (សាច់ប្រាក់)", value: "CASH" },
    ...bankOptions.map((bank: { label: string; value: string }) => ({
      label: `🏦 ${bank.label}`,
      value: `BANK:${bank.value}`,
    })),
  ];

  const isPending = isCreating || isUpdating;
  const initialDueAmount = Number(amount ?? payment?.amount ?? 0);

  const form = useForm({
    defaultValues: {
      paymentMethod:
        payment?.paymentMethod === "BANK" && payment.bankId
          ? `BANK:${payment.bankId}`
          : "CASH",
      bankId: payment?.bankId || null,
      saleId: saleId || payment?.saleId || null,
      purchaseId: purchaseId || payment?.purchaseId || null,
      userId: payment?.userId || 1,
      amount: payment?.amount ?? amount ?? 0,
      transactionNo: payment?.transactionNo || "SALE",
      status: payment?.status || Status.ACTIVE,
    } as PaymentRequest,
    onSubmit: async ({ value }) => {
      const methodValue = String(value.paymentMethod || "CASH");
      const isBankPayment = methodValue.startsWith("BANK:");
      const tenderedAmount = Number(value.amount) || 0;
      const due = Number(amount ?? payment?.amount ?? 0);

      const diff = tenderedAmount - due;
      const isOverpaid = diff > 0.001;
      const isUnderpaid = diff < -0.001;

      const payload = {
        ...(value as PaymentRequest),
        amount: tenderedAmount,
        paymentMethod: isBankPayment ? "BANK" : "CASH",
        bankId: isBankPayment ? Number(methodValue.split(":")[1]) : null,
        saleId: saleId || value.saleId || null,
        purchaseId: purchaseId || value.purchaseId || null,
      } as PaymentRequest;

      if (onPaymentSubmit) {
        const result = await onPaymentSubmit(payload);
        if (result === false) {
          return;
        }

        if (isOverpaid) {
          toast.success(`Payment successful! Change: $${diff.toFixed(2)}`);
        } else if (isUnderpaid) {
          toast.warning(`Partial payment saved. Due: $${Math.abs(diff).toFixed(2)}`);
        } else {
          toast.success("Payment completed successfully!");
        }

        setOpen(false);
        form.reset();
        return;
      }

      const handleSuccess = async () => {
        if (mode === "sale" && saleId && saleId > 0) {
          try {
            if (!isUnderpaid) {
              await completeSale.mutateAsync(saleId);
            }
            await queryClient.invalidateQueries({ queryKey: useProduct.keys.all });
            await queryClient.invalidateQueries({ queryKey: useProductSerial.keys.all });
          } catch (error: any) {
            const errorMsg =
              error?.response?.data?.message ||
              (typeof error?.response?.data === "string" ? error.response.data : null) ||
              error?.message ||
              "Sale completion failed after payment.";
            toast.error(errorMsg);
          }
        }

        if (isOverpaid) {
          toast.success(`Payment successful! Change to return: $${diff.toFixed(2)}`);
        } else if (isUnderpaid) {
          toast.warning(`Partial payment saved. Remaining due: $${Math.abs(diff).toFixed(2)}`);
        } else {
          toast.success("Payment completed successfully!");
        }

        setOpen(false);
        form.reset();
        if (mode === "purchase" && purchaseId) {
          void onPurchasePayment?.(purchaseId);
        }
      };

      if (payment) {
        updatePaymentMutate(
          { id: payment.id, req: payload },
          { onSuccess: handleSuccess }
        );
      } else {
        createPaymentMutate(payload, { onSuccess: handleSuccess });
      }
    },
  });

  useEffect(() => {
    form.reset({
      paymentMethod:
        payment?.paymentMethod === "BANK" && payment.bankId
          ? `BANK:${payment.bankId}`
          : "CASH",
      bankId: payment?.bankId || null,
      saleId: saleId || payment?.saleId || null,
      purchaseId: purchaseId || payment?.purchaseId || null,
      userId: payment?.userId || 1,
      amount: payment?.amount ?? amount ?? 0,
      transactionNo: payment?.transactionNo || "SALE",
      status: payment?.status || Status.ACTIVE,
    } as any);
  }, [payment, open, amount, saleId, purchaseId, form]);

  const dueAmount = Number(amount || payment?.amount || initialDueAmount || 0);
  const orderLabel = orderRef || payment?.saleNo || saleId || purchaseId || "New";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        showCloseButton={false}
        className="max-w-3xl gap-0 overflow-hidden rounded-2xl border-border/70 p-0 shadow-2xl"
      >
        {/* Header */}
        <DialogHeader className="border-b border-primary/20 bg-primary/10 px-6 py-4">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2.5 text-lg font-bold text-foreground">
              <div className="size-8 rounded-lg bg-primary/15 text-primary flex items-center justify-center">
                <WalletCards className="size-5" />
              </div>
              <div>
                <span>{language === "km" ? "ការទូទាត់ប្រាក់ (Payment)" : "Payment"}</span>
                <p className="text-[11px] font-normal text-muted-foreground">
                  Order #{orderLabel}
                </p>
              </div>
            </DialogTitle>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-[10px] text-muted-foreground uppercase font-semibold">
                  {language === "km" ? "ប្រាក់ត្រូវបង់" : "Total Due"}
                </p>
                <span className="text-base font-black font-mono text-primary">
                  ${dueAmount.toFixed(2)}
                </span>
              </div>
              <DialogClose asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-lg hover:bg-destructive/10 hover:text-destructive cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </Button>
              </DialogClose>
            </div>
          </div>
        </DialogHeader>

        <form
          id="payment-form"
          onSubmit={(e) => {
            e.preventDefault();
            form.handleSubmit();
          }}
          className="space-y-4 bg-background px-6 py-5"
        >
          {/* Reactive Payment Status & Breakdown */}
          <form.Subscribe
            selector={(state) => [state.values.amount, state.values.paymentMethod] as const}
          >
            {([rawAmount, method]) => {
              const entered = Number(rawAmount) || 0;
              const diff = entered - dueAmount;
              const isOverpaid = diff > 0.001; // Payment លើស -> Change
              const isUnderpaid = diff < -0.001; // Payment ខ្វះ -> Due
              const isExact = Math.abs(diff) <= 0.001; // Payment គ្រប់
              const changeAmount = isOverpaid ? diff : 0;
              const remainingDue = isUnderpaid ? Math.abs(diff) : 0;

              return (
                <div className="space-y-3">
                  {/* 4 Summary Stat Cards */}
                  <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                    {/* 1. Total Due */}
                    <div className="rounded-xl border border-border/70 bg-card p-3 shadow-2xs">
                      <p className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
                        <Receipt className="size-3 text-muted-foreground/70" />
                        {language === "km" ? "សរុបត្រូវបង់" : "Total Due"}
                      </p>
                      <p className="mt-1 text-base font-extrabold font-mono text-foreground">
                        ${dueAmount.toFixed(2)}
                      </p>
                    </div>

                    {/* 2. Customer Paying */}
                    <div className="rounded-xl border border-primary/30 bg-primary/5 p-3 shadow-2xs">
                      <p className="text-[11px] font-medium text-primary flex items-center gap-1">
                        <Banknote className="size-3 text-primary" />
                        {language === "km" ? "ប្រាក់ទទួល" : "Paying"}
                      </p>
                      <p className="mt-1 text-base font-extrabold font-mono text-primary">
                        ${entered.toFixed(2)}
                      </p>
                    </div>

                    {/* 3. Change (Overpayment) */}
                    <div
                      className={`rounded-xl border p-3 transition-colors shadow-2xs ${
                        isOverpaid
                          ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                          : "border-border/60 bg-muted/20 text-muted-foreground"
                      }`}
                    >
                      <p className="text-[11px] font-medium flex items-center gap-1">
                        <Coins className="size-3" />
                        {language === "km" ? "ប្រាក់អាប់" : "Change"}
                      </p>
                      <p className="mt-1 text-base font-extrabold font-mono">
                        {isOverpaid ? `+$${changeAmount.toFixed(2)}` : "$0.00"}
                      </p>
                    </div>

                    {/* 4. Balance Due (Underpayment) */}
                    <div
                      className={`rounded-xl border p-3 transition-colors shadow-2xs ${
                        isUnderpaid
                          ? "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300"
                          : "border-border/60 bg-muted/20 text-muted-foreground"
                      }`}
                    >
                      <p className="text-[11px] font-medium flex items-center gap-1">
                        <AlertCircle className="size-3" />
                        {language === "km" ? "នៅខ្វះ" : "Due"}
                      </p>
                      <p className="mt-1 text-base font-extrabold font-mono">
                        {isUnderpaid ? `$${remainingDue.toFixed(2)}` : "$0.00"}
                      </p>
                    </div>
                  </div>

                  {/* Highlight Banner on Overpayment (លើស) or Underpayment (ខ្វះ) */}
                  {isOverpaid && (
                    <div className="flex items-center justify-between rounded-xl border border-emerald-500/40 bg-emerald-500/15 p-3.5 text-emerald-800 dark:text-emerald-200 animate-in fade-in">
                      <div className="flex items-center gap-2.5">
                        <div className="size-8 rounded-lg bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                          <Coins className="size-5" />
                        </div>
                        <div>
                          <p className="text-xs font-bold">
                            {language === "km"
                              ? "ប្រាក់អាប់ជូនភ្ញៀវ (បង់លើស)"
                              : "Change to Return (Overpayment)"}
                          </p>
                          <p className="text-[11px] text-emerald-700 dark:text-emerald-300">
                            {language === "km"
                              ? "អតិថិជនបានបង់លើសចំនួន។ សូមប្រគល់ប្រាក់អាប់ជូនភ្ញៀវ។"
                              : "Customer paid more than total. Please return change."}
                          </p>
                        </div>
                      </div>
                      <span className="text-2xl font-black font-mono text-emerald-600 dark:text-emerald-300">
                        +${changeAmount.toFixed(2)}
                      </span>
                    </div>
                  )}

                  {isUnderpaid && (
                    <div className="flex items-center justify-between rounded-xl border border-amber-500/40 bg-amber-500/15 p-3.5 text-amber-800 dark:text-amber-200 animate-in fade-in">
                      <div className="flex items-center gap-2.5">
                        <div className="size-8 rounded-lg bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                          <AlertCircle className="size-5" />
                        </div>
                        <div>
                          <p className="text-xs font-bold">
                            {language === "km"
                              ? "ប្រាក់នៅខ្វះ (បង់មួយផ្នែក)"
                              : "Remaining Balance Due (Partial Payment)"}
                          </p>
                          <p className="text-[11px] text-amber-700 dark:text-amber-300">
                            {language === "km"
                              ? "បានបង់មួយផ្នែក។ ចំនួនដែលនៅសល់នឹងកត់ត្រាទុកជាបំណុលនៅខ្វះ។"
                              : "Partial payment. Balance will be saved as unpaid due."}
                          </p>
                        </div>
                      </div>
                      <span className="text-2xl font-black font-mono text-amber-600 dark:text-amber-300">
                        ${remainingDue.toFixed(2)}
                      </span>
                    </div>
                  )}

                  {isExact && entered > 0 && (
                    <div className="flex items-center justify-between rounded-xl border border-primary/30 bg-primary/10 p-2.5 text-primary text-xs font-semibold">
                      <span className="flex items-center gap-2">
                        <CheckCircle2 className="size-4" />
                        {language === "km"
                          ? "បានបង់គ្រប់ចំនួនត្រឹមត្រូវ (មិនមានប្រាក់អាប់ ឬជំពាក់)"
                          : "Exact Payment (Zero change and zero balance)"}
                      </span>
                      <span className="font-mono font-bold">$0.00</span>
                    </div>
                  )}

                  {/* Cash Quick Tender Presets */}
                  <div className="rounded-xl border border-border/70 bg-card p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                        <Banknote className="size-3.5 text-primary" />
                        {language === "km" ? "ជ្រើសរើសលុយរហ័ស" : "Quick Cash Tender"}
                      </span>
                      <button
                        type="button"
                        onClick={() => form.setFieldValue("amount", dueAmount)}
                        className="text-[11px] font-semibold text-primary hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <RotateCcw className="size-3" />
                        {language === "km" ? "គ្រប់" : "Exact"} (${dueAmount.toFixed(2)})
                      </button>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5">
                      {/* Exact button */}
                      <button
                        type="button"
                        onClick={() => form.setFieldValue("amount", dueAmount)}
                        className={`h-7 px-2.5 rounded-lg text-xs font-bold font-mono transition-all cursor-pointer ${
                          entered === dueAmount
                            ? "bg-primary text-primary-foreground shadow-xs"
                            : "bg-muted/60 hover:bg-muted text-foreground border border-border/60"
                        }`}
                      >
                        Exact: ${dueAmount.toFixed(2)}
                      </button>

                      {/* Smart rounded cash suggestions */}
                      {(() => {
                        const suggestions = new Set<number>();
                        // Next multiples
                        if (dueAmount > 0) {
                          const ceil5 = Math.ceil(dueAmount / 5) * 5;
                          const ceil10 = Math.ceil(dueAmount / 10) * 10;
                          const ceil20 = Math.ceil(dueAmount / 20) * 20;
                          const ceil50 = Math.ceil(dueAmount / 50) * 50;
                          const ceil100 = Math.ceil(dueAmount / 100) * 100;

                          if (ceil5 > dueAmount) suggestions.add(ceil5);
                          if (ceil10 > dueAmount) suggestions.add(ceil10);
                          if (ceil20 > dueAmount) suggestions.add(ceil20);
                          if (ceil50 > dueAmount) suggestions.add(ceil50);
                          if (ceil100 > dueAmount) suggestions.add(ceil100);
                        }

                        return Array.from(suggestions).slice(0, 4).map((amt) => (
                          <button
                            key={amt}
                            type="button"
                            onClick={() => form.setFieldValue("amount", amt)}
                            className={`h-7 px-2.5 rounded-lg text-xs font-bold font-mono transition-all cursor-pointer ${
                              entered === amt
                                ? "bg-emerald-600 text-white shadow-xs"
                                : "bg-muted/60 hover:bg-emerald-500/10 hover:text-emerald-600 hover:border-emerald-500/40 text-foreground border border-border/60"
                            }`}
                          >
                            ${amt.toFixed(2)}
                          </button>
                        ));
                      })()}

                      {/* Quick Increments */}
                      {[5, 10, 20, 50, 100].map((inc) => (
                        <button
                          key={inc}
                          type="button"
                          onClick={() =>
                            form.setFieldValue("amount", Number((entered + inc).toFixed(2)))
                          }
                          className="h-7 px-2 rounded-lg text-[11px] font-semibold font-mono bg-muted/40 hover:bg-muted text-muted-foreground border border-border/50 flex items-center gap-0.5 cursor-pointer"
                        >
                          <Plus className="size-2.5" />
                          ${inc}
                        </button>
                      ))}

                      {/* Clear button */}
                      <button
                        type="button"
                        onClick={() => form.setFieldValue("amount", 0)}
                        className="h-7 px-2 rounded-lg text-[11px] font-medium text-rose-500 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 cursor-pointer ml-auto"
                      >
                        $0 (Unpaid)
                      </button>
                    </div>
                  </div>
                </div>
              );
            }}
          </form.Subscribe>

          {/* Form Fields: Amount & Payment Method */}
          <FieldGroup className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormTextField
              form={form}
              name="amount"
              label="Amount Paid ($) - ចំនួនប្រាក់បង់"
              required={true}
              placeholder="0.00"
              type="number"
            />

            <FormSelectField
              form={form}
              name="paymentMethod"
              label="Payment Method - វិធីសាស្ត្រទូទាត់"
              required={true}
              options={paymentMethodOptions}
              onValueChange={(value) => {
                if (value.startsWith("BANK:")) {
                  form.setFieldValue("bankId", Number(value.split(":")[1]));
                } else {
                  form.setFieldValue("bankId", null);
                }
              }}
            />
          </FieldGroup>
        </form>

        {/* Footer Actions */}
        <div className="border-t border-border/70 bg-card px-6 py-4 flex items-center justify-between gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            className="h-11 px-5 rounded-xl cursor-pointer"
          >
            {t("common.cancel", "Cancel")}
          </Button>

          <form.Subscribe selector={(state) => state.values.amount}>
            {(rawAmount) => {
              const entered = Number(rawAmount) || 0;
              const diff = entered - dueAmount;
              const isOver = diff > 0.001;
              const isUnder = diff < -0.001;

              return (
                <Button
                  type="submit"
                  form="payment-form"
                  disabled={isPending}
                  className="h-11 flex-1 rounded-xl bg-primary text-sm font-bold text-primary-foreground shadow-md hover:bg-primary/90 cursor-pointer transition-all active:scale-[0.99]"
                >
                  {isPending ? (
                    t("common.loading", "Processing...")
                  ) : isOver ? (
                    language === "km"
                      ? `បញ្ចប់ការទូទាត់ (ប្រាក់អាប់: +$${diff.toFixed(2)})`
                      : `Complete Payment (Change: +$${diff.toFixed(2)})`
                  ) : isUnder ? (
                    language === "km"
                      ? `កត់ត្រាការបង់មួយផ្នែក (នៅខ្វះ: $${Math.abs(diff).toFixed(2)})`
                      : `Save Partial Payment (Due: $${Math.abs(diff).toFixed(2)})`
                  ) : payment ? (
                    language === "km" ? "ធ្វើបច្ចុប្បន្នភាពការទូទាត់" : "Update Payment"
                  ) : (
                    language === "km"
                      ? `បញ្ចប់ការទូទាត់ ($${dueAmount.toFixed(2)})`
                      : `Complete Payment ($${dueAmount.toFixed(2)})`
                  )}
                </Button>
              );
            }}
          </form.Subscribe>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentForm;
