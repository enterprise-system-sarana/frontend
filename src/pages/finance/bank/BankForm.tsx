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
import { Status } from "@/types/enum/status";
import { useCreateBank, useUpdateBank } from "@/hooks/finance/useBank";
import FormTextField, { FormSelectField } from "@/components/ui/FormTextField";

type FormBankProps = {
    open: boolean;
    setOpen: (open: boolean) => void;
    bank: BankResponse | null;
};

const FormBank = ({ open, setOpen, bank }: FormBankProps) => {
    const { mutate: createBankMutate, isPending: isCreating } = useCreateBank();
    const { mutate: updateBankMutate, isPending: isUpdating } = useUpdateBank();

    const isPending = isCreating || isUpdating;
    const form = useForm({
        defaultValues: {
            name: bank?.name || "",
            number: bank?.number || "",
            amount: bank?.amount || "0",
            isDefault: bank?.isDefault || "false",
            statement: bank?.statement || "",
            fromTime: bank?.fromTime ? bank.fromTime.substring(0, 10) : "",
            toTime: bank?.toTime ? bank.toTime.substring(0, 10) : "",
            status: (bank?.status as any) || Status.Active,
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
                    { id: bank.id, request: payload },
                    { onSuccess: handleSuccess },
                );
            } else {
                createBankMutate(payload, { onSuccess: handleSuccess });
            }
        },
    });

    useEffect(() => {
        form.reset();
    }, [bank, open]);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{bank ? "Edit" : "Create"} Bank</DialogTitle>
                </DialogHeader>
                <form
                    id="bank-form"
                    onSubmit={(e) => {
                        e.preventDefault();
                        form.handleSubmit();
                    }}
                >
                    <FieldGroup>
                        <FormTextField
                            form={form}
                            name="name"
                            label="Bank Name"
                            placeholder="Enter bank name"
                            type="text"
                            autoComplete="off"
                        />
                        <FormTextField
                            form={form}
                            name="number"
                            label="Account Number"
                            placeholder="Enter account number"
                            type="text"
                            autoComplete="off"
                        />
                        <FormTextField
                            form={form}
                            name="amount"
                            label="Initial Balance / Amount"
                            placeholder="Enter amount"
                            type="number"
                            autoComplete="off"
                        />
                        <FormSelectField
                            form={form}
                            name="isDefault"
                            label="Is Default"
                            placeholder="Select default setting"
                            options={[
                                { value: "true", label: "Yes" },
                                { value: "false", label: "No" },
                            ]}
                        />
                        <FormTextField
                            form={form}
                            name="statement"
                            label="Statement / Description"
                            placeholder="Enter statement details"
                            type="text"
                            autoComplete="off"
                        />
                        <FormTextField
                            form={form}
                            name="fromTime"
                            label="From Time"
                            placeholder="Select from date"
                            type="date"
                        />
                        <FormTextField
                            form={form}
                            name="toTime"
                            label="To Time"
                            placeholder="Select to date"
                            type="date"
                        />
                        <FormSelectField
                            form={form}
                            name="status"
                            label="Status"
                            placeholder="Select Status"
                            options={Object.entries(Status).map(([, value]) => ({
                                value: value,
                                label: value,
                             }))}
                        />
                    </FieldGroup>
                </form>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="outline">Cancel</Button>
                    </DialogClose>
                    <Button
                        type="submit"
                        form="bank-form"
                        disabled={isPending}
                    >
                        {isPending ? "Saving..." : (bank ? "Update" : "Create")}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default FormBank;
