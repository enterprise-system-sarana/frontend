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

import { StatusOptions, Status } from "@/types/enum/status";
import FormTextField, { FormRadioGroupField } from "@/components/ui/FormTextField";
import { VariantTypeSchema, type VariantTypeRequest, type VariantTypeResponse } from "@/types/product/VariantType";
import { useVariantType } from "@/hooks/product/useVariantType";

type FormVariantTypeProps = {
    open: boolean;
    setOpen: (open: boolean) => void;
    variantType: VariantTypeResponse | null;
};

const VariantTypeForm = ({ open, setOpen, variantType }: FormVariantTypeProps) => {
    const { mutate: createVariantTypeMutate, isPending: isCreating } = useVariantType.useCreateVariantType();
    const { mutate: updateVariantTypeMutate, isPending: isUpdating } = useVariantType.useUpdateVariantType();

    const isPending = isCreating || isUpdating;
    const form = useForm({
        defaultValues: {
            name: variantType?.name || "",
            code: variantType?.code || "",
            status: variantType?.status || Status.ACTIVE,
        } as VariantTypeRequest,
        validators: {
            onSubmit: VariantTypeSchema,
        },
        onSubmit: async ({ value }) => {
            const payload = value as VariantTypeRequest;
            const handleSuccess = () => {
                setOpen(false);
                form.reset();
            };

            if (variantType) {
                updateVariantTypeMutate(
                    { id: variantType.id, req: payload },
                    { onSuccess: handleSuccess },
                );
            } else {
                createVariantTypeMutate(payload, { onSuccess: handleSuccess });
            }
        },
    });

    useEffect(() => {
        form.reset();
    }, [variantType, open, form]);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="md:max-w-[450px]">
                <DialogHeader>
                    <DialogTitle>{variantType ? "Edit" : "Create"} Variant Type</DialogTitle>
                </DialogHeader>
                <form
                    id="variant-type-form"
                    onSubmit={(e) => {
                        e.preventDefault();
                        form.handleSubmit();
                    }}
                >
                    <FieldGroup>
                        <FormTextField
                            form={form}
                            name="code"
                            label="Code"
                            required={true}
                            placeholder="Code"
                            type="text"
                        />
                        <FormTextField
                            form={form}
                            name="name"
                            label="Name"
                            required={true}
                            placeholder="Name"
                            type="text"
                        />

                        <FormRadioGroupField
                            form={form}
                            name="status"
                            label="Status"
                            required={true}
                            options={StatusOptions}
                        />
                    </FieldGroup>
                </form>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="outline">Cancel</Button>
                    </DialogClose>
                    <Button
                        type="submit"
                        form="variant-type-form"
                        disabled={isPending}
                    >
                        {isPending ? "Saving..." : (variantType ? "Update" : "Create")}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default VariantTypeForm;
