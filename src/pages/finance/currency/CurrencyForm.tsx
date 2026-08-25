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
import { CurrencySchema } from "@/types/finance/Currency";
import type { CurrencyResponse, CurrencyRequest } from "@/types/finance/Currency";
import { Status } from "@/types/enum/status";
import { useCreateCurrency, useUpdateCurrency } from "@/hooks/finance/useCurrency";
import FormTextField, { FormSelectField } from "@/components/ui/FormTextField";

type FormCurrencyProps = {
    open: boolean;
    setOpen: (open: boolean) => void;
    currency: CurrencyResponse | null;
};

const FormCurrency = ({ open, setOpen, currency }: FormCurrencyProps) => {
    const { mutate: createCurrencyMutate, isPending: isCreating } = useCreateCurrency();
    const { mutate: updateCurrencyMutate, isPending: isUpdating } = useUpdateCurrency();

    const isPending = isCreating || isUpdating;
    const form = useForm({
        defaultValues: {
            code: currency?.code || "",
            name: currency?.name || "",
            operation: currency?.operation || "",
            rate: currency?.rate || 1.0,
            symbol: currency?.symbol || "",
            status: currency?.status || Status.ACTIVE,
        } as CurrencyRequest,
        validators: {
            onSubmit: CurrencySchema as any,
        },
        onSubmit: async ({ value }) => {
            const payload = value as CurrencyRequest;
            const handleSuccess = () => {
                setOpen(false);
                form.reset();
            };

            if (currency) {
                updateCurrencyMutate(
                    { id: currency.id, request: payload },
                    { onSuccess: handleSuccess },
                );
            } else {
                createCurrencyMutate(payload, { onSuccess: handleSuccess });
            }
        },
    });

    useEffect(() => {
        form.reset();
    }, [currency, open]);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{currency ? "Edit" : "Create"} Currency</DialogTitle>
                </DialogHeader>
                <form
                    id="currency-form"
                    onSubmit={(e) => {
                        e.preventDefault();
                        form.handleSubmit();
                    }}
                >
                    <FieldGroup>
                        <FormTextField
                            form={form}
                            name="code"
                            label="Currency Code"
                            placeholder="e.g. USD, EUR, IDR"
                            type="text"
                            autoComplete="off"
                        />
                        <FormTextField
                            form={form}
                            name="name"
                            label="Currency Name"
                            placeholder="e.g. US Dollar"
                            type="text"
                            autoComplete="off"
                        />
                        <FormTextField
                            form={form}
                            name="symbol"
                            label="Symbol"
                            placeholder="e.g. $, €, Rp"
                            type="text"
                            autoComplete="off"
                        />
                        <FormTextField
                            form={form}
                            name="rate"
                            label="Exchange Rate"
                            placeholder="Enter rate value"
                            type="number"
                            autoComplete="off"
                        />
                        <FormTextField
                            form={form}
                            name="operation"
                            label="Operation / Description"
                            placeholder="Enter operation info"
                            type="text"
                            autoComplete="off"
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
                        form="currency-form"
                        disabled={isPending}
                    >
                        {isPending ? "Saving..." : (currency ? "Update" : "Create")}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default FormCurrency;
