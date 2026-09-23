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
    const { mutate: createPaymentMutate, isPending: isCreating } = usePayment.createPayment();
    const { mutate: updatePaymentMutate, isPending: isUpdating } = usePayment.updatePayment();
    const completeSale = useSale.Complete();
    const { data: bankData } = useBank.useGetAllBank({ page: 1, size: 100 });

    const bankOptions = (bankData?.payload?.data || banks).map((b: { id: number; name?: string; bankName?: string; accountNumber?: string }) => ({
        label: b.name || b.bankName || "Bank",
        value: String(b.id),
    }));
    const paymentMethodOptions = [
        { label: "Cash", value: "CASH" },
        ...bankOptions.map((bank: { label: string; value: string }) => ({
            label: bank.label,
            value: `BANK:${bank.value}`,
        })),
    ];


    const isPending = isCreating || isUpdating;
    // const [generatedPaymentNo] = useState(() => `PAY-${Date.now()}`);
    const form = useForm({
        defaultValues: {
            // paymentNo: payment?.paymentNo || generatedPaymentNo,
            paymentMethod: payment?.paymentMethod === "BANK" && payment.bankId
                ? `BANK:${payment.bankId}`
                : "CASH",
            bankId: payment?.bankId || null,
            saleId: payment?.saleId || null,
            purchaseId: payment?.purchaseId || null,
            userId: payment?.userId || 1,
            amount: payment?.amount || amount || 0,
            transactionNo: payment?.transactionNo || "SALE",
            // paymentDate: payment?.paymentDate ? String(payment.paymentDate).slice(0, 10) : new Date().toISOString().slice(0, 10),
            status: payment?.status || Status.ACTIVE,
        } as PaymentRequest,
        onSubmit: async ({ value }) => {
            const methodValue = String(value.paymentMethod || "CASH");
            const isBankPayment = methodValue.startsWith("BANK:");
            const payload = {
                ...(value as PaymentRequest),
                // paymentNo: value.paymentNo |,
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
                setOpen(false);
                form.reset();
                return;
            }
            const handleSuccess = async () => {
                if (mode === "sale" && saleId && saleId > 0) {
                    try {
                        await completeSale.mutateAsync(saleId);
                        await queryClient.invalidateQueries({ queryKey: useProduct.keys.all });
                        await queryClient.invalidateQueries({ queryKey: useProductSerial.keys.all });
                    } catch (error: any) {
                        const errorMsg = error?.response?.data?.message ||
                            (typeof error?.response?.data === "string" ? error.response.data : null) ||
                            error?.message ||
                            "Sale completion failed after payment.";
                        toast.error(errorMsg);
                    }
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
                    { onSuccess: handleSuccess },
                );
            } else {
                createPaymentMutate(payload, { onSuccess: handleSuccess });
            }
        },
    });

    useEffect(() => {
        form.reset();
    }, [payment, open, amount, saleId, purchaseId, form]);

    const dueAmount = Number(amount || payment?.amount || form.getFieldValue("amount") || 0);
    const enteredAmount = Number(form.getFieldValue("amount") || 0);
    const remainingAmount = Math.max(0, dueAmount - enteredAmount);
    const orderLabel = orderRef || payment?.saleNo || saleId || purchaseId || "New";

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent showCloseButton={false} className="max-w-5xl gap-0 overflow-hidden rounded-xl border-border/70 p-0">
                <DialogHeader className="border-b border-primary/25 bg-primary/10 px-6 py-4">
                    <div className="flex items-center justify-between">
                        <DialogTitle className="flex items-center gap-2 text-lg font-bold text-foreground">
                            <WalletCards className="h-5 w-5 text-primary" />
                            Payment
                        </DialogTitle>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span>Order #{orderLabel}</span>
                            <span className="font-bold text-primary">${dueAmount.toFixed(2)}</span>
                            <DialogClose asChild>
                                <Button type="button" variant="ghost" size="icon" className="h-8 w-8 rounded-md hover:bg-primary/10 hover:text-primary">
                                    <X className="h-4 w-4" />
                                </Button>
                            </DialogClose>
                        </div>
                    </div>
                </DialogHeader>

                <form id="payment-form"
                    onSubmit={(e) => {
                        e.preventDefault();
                        form.handleSubmit();
                    }
                    }
                    className="space-y-4 bg-background px-6 py-5">
                    <div className="grid grid-cols-2 gap-3 rounded-md border border-border/70 bg-card p-3 text-sm sm:grid-cols-4">
                        <div><p className="text-xs text-muted-foreground">Total Items</p><p className="font-bold">{payment ? "1" : "1"}</p></div>
                        <div><p className="text-xs text-muted-foreground">Total Paying</p><p className="font-bold text-primary">${enteredAmount.toFixed(2)}</p></div>
                        <div><p className="text-xs text-muted-foreground">Total Payable</p><p className="font-bold">${dueAmount.toFixed(2)}</p></div>
                        <div><p className="text-xs text-muted-foreground">Balance</p><p className={`font-bold ${remainingAmount > 0 ? "text-destructive" : "text-primary"}`}>${remainingAmount.toFixed(2)}</p></div>
                    </div>
                    <FieldGroup>
                        <FormTextField
                            form={form}
                            name="amount"
                            label="amount"
                            required={true}
                            placeholder="Amount"
                            type="number"
                        />

                        <FormSelectField
                            form={form}
                            name="paymentMethod"
                            label="Payment Method"
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

                <div className="border-t border-border/70 bg-card px-6 py-4">
                    <Button type="submit" form="payment-form" disabled={isPending} className="h-11 w-full rounded-md bg-primary text-sm font-bold text-primary-foreground shadow-sm hover:bg-primary/90">
                        {isPending ? "Saving..." : payment ? "Update Payment" : "Submit"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog >
    );
};

export default PaymentForm;

