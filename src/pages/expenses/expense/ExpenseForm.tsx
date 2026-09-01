import { useForm } from "@tanstack/react-form";
import { Button } from "@/components/ui/button";
import { FieldGroup } from "@/components/ui/field";
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { useEffect, useMemo } from "react";
import { StatusOptions, Status } from "@/types/enum/status";
import FormTextField, { FormRadioGroupField, FormSelectField, FormTextareaField } from "@/components/ui/FormTextField";
import { ExpenseSchema, type ExpenseRequest, type ExpenseResponse } from "@/types/expense/expense";
import { useExpense } from "@/hooks/expense/useExpense";
import { useExpenseType } from "@/hooks/expense/useExpenseType";
import { useStore } from "@/hooks/inventory/useStore";
import { useBank } from "@/hooks/finance/useBank";
import { toast } from "sonner";

type ExpenseFormProps = {
    open: boolean;
    setOpen: (open: boolean) => void;
    expense: ExpenseResponse | null;
};

const FormExpense = ({ open, setOpen, expense }: ExpenseFormProps) => {
    const isEditing = Boolean(expense);
    const { mutate: createExpenseMutate, isPending: isCreating } = useExpense.useCreateExpense();
    const { mutate: updateExpenseMutate, isPending: isUpdating } = useExpense.useUpdateExpense();

    // Query dropdown options
    const { data: expenseTypeData } = useExpenseType.useGetAllExpenseType({ page: 1, size: 100 });
    const { data: storeData } = useStore.useGetAllStore({ page: 1, size: 100 });
    const { data: bankData } = useBank.useGetAllBank({ page: 1, size: 100 });

    const expenseTypeOptions = useMemo(() => {
        const list = expenseTypeData?.payload?.data || [];
        return list.map((item: any) => ({
            label: `${item.name}${item.code ? ` (${item.code})` : ""}`,
            value: String(item.id),
        }));
    }, [expenseTypeData]);

    const storeOptions = useMemo(() => {
        const list = storeData?.payload?.data || [];
        return [
            { label: "None / Not Applicable", value: "0" },
            ...list.map((item: any) => ({
                label: item.name,
                value: String(item.id),
            })),
        ];
    }, [storeData]);

    const bankOptions = useMemo(() => {
        const list = bankData?.payload?.data || [];
        return [
            { label: "None / Cash", value: "0" },
            ...list.map((item: any) => ({
                label: `${item.name || item.bankName || "Bank"}${item.accountNumber ? ` - ${item.accountNumber}` : ""}`,
                value: String(item.id),
            })),
        ];
    }, [bankData]);

    const isPending = isCreating || isUpdating;

    const form = useForm({
        defaultValues: {
            reference: expense?.reference || "",
            amount: expense?.amount ?? 0,
            expenseTypeId: expense?.expenseTypeId || 1,
            storeId: expense?.storeId || 1,
            bankId: expense?.bankId || 1,
            note: expense?.note || "",
            description: expense?.description || "",
            status: expense?.status || Status.ACTIVE,
        } as ExpenseRequest,
        validators: {
            onSubmit: ExpenseSchema,
        },
        onSubmit: async ({ value }) => {
            const payload: ExpenseRequest = {
                reference: (value.reference || "").trim(),
                amount: Number(value.amount),
                expenseTypeId: Number(value.expenseTypeId),
                storeId: Number(value.storeId) || undefined,
                bankId: Number(value.bankId) || undefined,
                note: (value.note || "").trim(),
                description: (value.description || "").trim(),
                status: value.status || Status.ACTIVE,
            };

            const handleSuccess = () => {
                toast.success(isEditing ? "Expense updated successfully!" : "Expense recorded successfully!");
                setOpen(false);
                form.reset();
            };

            if (isEditing && expense) {
                updateExpenseMutate(
                    { id: expense.id, req: payload },
                    {
                        onSuccess: handleSuccess,
                        onError: (err: any) => {
                            toast.error(err?.response?.data?.message || "Failed to update expense.");
                        },
                    }
                );
            } else {
                createExpenseMutate(payload, {
                    onSuccess: handleSuccess,
                    onError: (err: any) => {
                        toast.error(err?.response?.data?.message || "Failed to create expense.");
                    },
                });
            }
        },
    });

    useEffect(() => {
        if (open) {
            if (expense) {
                form.setFieldValue("reference", expense.reference || "");
                form.setFieldValue("amount", Number(expense.amount) || 0);
                form.setFieldValue("expenseTypeId", Number(expense.expenseTypeId) || 0);
                form.setFieldValue("storeId", Number(expense.storeId) || 0);
                form.setFieldValue("bankId", Number(expense.bankId) || 0);
                form.setFieldValue("note", expense.note || "");
                form.setFieldValue("description", expense.description || "");
                form.setFieldValue("status", expense.status || Status.ACTIVE);
            } else {
                form.reset();
            }
        }
    }, [expense, open]);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="md:max-w-[550px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-lg font-bold font-heading">
                        {isEditing ? "Edit Expense" : "Record New Expense"}
                    </DialogTitle>
                </DialogHeader>
                <form
                    id="expense-form"
                    onSubmit={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        form.handleSubmit();
                    }}
                    className="space-y-4 pt-2"
                >
                    <FieldGroup>
                        {/* Reference & Amount */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <FormTextField
                                form={form}
                                name="reference"
                                label="Reference / Voucher #"
                                placeholder="e.g. EXP-2026-001"
                                type="text"
                            />
                            <FormTextField
                                form={form}
                                name="amount"
                                label="Amount ($)"
                                required={true}
                                placeholder="0.00"
                                type="number"
                            />
                        </div>

                        {/* Expense Type */}
                        <FormSelectField
                            form={form}
                            name="expenseTypeId"
                            label="Expense Type"
                            required={true}
                            placeholder="Select Expense Category"
                            options={expenseTypeOptions}
                        />

                        {/* Store & Bank */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <FormSelectField
                                form={form}
                                name="storeId"
                                label="Store / Branch"
                                placeholder="Select Store"
                                options={storeOptions}
                            />
                            <FormSelectField
                                form={form}
                                name="bankId"
                                label="Payment Account / Bank"
                                placeholder="Select Bank/Account"
                                options={bankOptions}
                            />
                        </div>

                        {/* Note & Description */}
                        <FormTextField
                            form={form}
                            name="note"
                            label="Note / Payee"
                            placeholder="e.g. Paid to Electricity Provider"
                            type="text"
                        />

                        {/* Status */}
                        <FormRadioGroupField
                            form={form}
                            name="status"
                            label="Status"
                            required={true}
                            options={StatusOptions}
                        />
                    </FieldGroup>
                </form>
                <DialogFooter className="pt-2">
                    <DialogClose asChild>
                        <Button variant="outline" type="button">
                            Cancel
                        </Button>
                    </DialogClose>
                    <Button
                        type="submit"
                        form="expense-form"
                        disabled={isPending}
                        className="font-semibold"
                    >
                        {isPending ? "Saving..." : isEditing ? "Update Expense" : "Create Expense"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default FormExpense;
export { FormExpense };
