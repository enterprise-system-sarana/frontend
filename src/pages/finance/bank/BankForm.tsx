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
import { useEffect } from "react";
import { BankSchema } from "@/types/finance/Bank";
import type { BankResponse, BankRequest } from "@/types/finance/Bank";
import { Status, StatusOptions } from "@/types/enum/status";
import { useBank } from "@/hooks/finance/useBank";
import FormTextField, { FormRadioGroupField } from "@/components/ui/FormTextField";

type FormBankProps = {
    open: boolean;
    setOpen: (open: boolean) => void;
    bank: BankResponse | null;
};

const FormBank = ({ open, setOpen, bank }: FormBankProps) => {
    const { mutate: createBankMutate, isPending: isCreating } = useBank.useCreateBank();
    const { mutate: updateBankMutate, isPending: isUpdating } = useBank.useUpdateBank();

    const isPending = isCreating || isUpdating;
    const form = useForm({
        defaultValues: {
            name: bank?.name || "",
            accountName: bank?.accountName || "",
            accountNumber: bank?.accountNumber || "",
            openingBalance: bank?.openingBalance || "0",
            currentBalance: bank?.currentBalance || "0",
            status: bank?.status || Status.ACTIVE,
        } as BankRequest,
        validators: {
            onSubmit: BankSchema,
        },
        onSubmit: async ({ value }) => {
            const payload = value as BankRequest;
            const handleSuccess = () => {
                setOpen(false);
                form.reset();
            };

            if (bank) {
                updateBankMutate(
                    { id: bank.id, req: payload },
                    { onSuccess: handleSuccess },
                );
            } else {
                createBankMutate(payload, { onSuccess: handleSuccess });
            }
        },
    });

    useEffect(() => {
        if (open) {
            form.reset();
        }
    }, [bank, open, form]);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="sm:max-w-xl">
                <DialogHeader>
                    <DialogTitle className="font-heading text-lg font-bold">
                        {bank ? "Edit" : "Create"} Bank
                    </DialogTitle>
                </DialogHeader>
                <form
                    id="bank-form"
                    onSubmit={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        form.handleSubmit();
                    }}
                >
                    <FieldGroup className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
                        <FormTextField
                            form={form}
                            name="name"
                            label="Bank Name"
                            placeholder="e.g. ABA Bank"
                            type="text"
                            autoComplete="off"
                            required
                        />
                        <FormTextField
                            form={form}
                            name="accountName"
                            label="Account Name"
                            placeholder="e.g. John Doe"
                            type="text"
                            autoComplete="off"
                            required
                        />
                        <FormTextField
                            form={form}
                            name="accountNumber"
                            label="Account Number"
                            placeholder="e.g. 000 123 456"
                            type="text"
                            autoComplete="off"
                            required
                        />
                        <FormTextField
                            form={form}
                            name="openingBalance"
                            label="Opening Balance"
                            placeholder="0.00"
                            type="text"
                            autoComplete="off"
                            required
                        />
                        <div className="sm:col-span-2">
                            <FormTextField
                                form={form}
                                name="currentBalance"
                                label="Current Balance"
                                placeholder="0.00"
                                type="text"
                                autoComplete="off"
                                required
                            />
                        </div>
                        <div className="sm:col-span-2">
                            <FormRadioGroupField
                                form={form}
                                name="status"
                                label="Status"
                                required
                                options={StatusOptions}
                            />
                        </div>
                    </FieldGroup>
                </form>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="outline" className="rounded-xl" disabled={isPending}>
                            Cancel
                        </Button>
                    </DialogClose>
                    <Button
                        type="submit"
                        form="bank-form"
                        disabled={isPending}
                        className="rounded-xl shadow-md shadow-primary/20 bg-[#0B1120] hover:bg-[#0B1120]/90 text-white"
                    >
                        {isPending ? "Saving..." : (bank ? "Update Bank" : "Create Bank")}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default FormBank;
