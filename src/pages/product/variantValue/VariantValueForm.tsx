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
import { useEffect, useMemo, useState } from "react";
import { StatusOptions, Status } from "@/types/enum/status";
import FormTextField, { FormRadioGroupField, FormSelectField } from "@/components/ui/FormTextField";
import { VariantValueSchema, type VariantValueRequest, type VariantValueResponse } from "@/types/product/VariantValue";
import { useVariantValue } from "@/hooks/product/useVariantValue";
import { useVariantType } from "@/hooks/product/useVariantType";
import type { VariantTypeResponse } from "@/types/product/VariantType";
import VariantTypeForm from "../variantType/VariantTypeForm";
import { useLanguage } from "@/i18n/LanguageContext";

type FormVariantValueProps = {
    open: boolean;
    setOpen: (open: boolean) => void;
    variantValue: VariantValueResponse | null;
};

const VariantValueForm = ({ open, setOpen, variantValue }: FormVariantValueProps) => {
    const { t } = useLanguage();
    const [varaintTypeFormOpen, setvaraintTypeFormOpen] = useState(false);

    const { mutate: createVariantValueMutate, isPending: isCreating } = useVariantValue.useCreateVariantValue();
    const { mutate: updateVariantValueMutate, isPending: isUpdating } = useVariantValue.useUpdateVariantValue();

    // Fetch variant types for the select dropdown
    const { data: variantTypeData } = useVariantType.useGetAllVariantType({ page: 1, size: 100 });

    const variantTypeOptions = useMemo(() => {
        return (variantTypeData?.payload?.data || []).map((vt: VariantTypeResponse) => ({
            label: vt.name,
            value: String(vt.id),
        }));
    }, [variantTypeData]);

    const isPending = isCreating || isUpdating;

    const form = useForm({
        defaultValues: {
            name: variantValue?.name || "",
            code: variantValue?.code || "",
            variantTypeId: variantValue?.variantTypeId || 0,
            status: variantValue?.status || Status.ACTIVE,
        } as VariantValueRequest,
        validators: {
            onSubmit: VariantValueSchema,
        },
        onSubmit: async ({ value }) => {
            const payload = value as VariantValueRequest;
            const handleSuccess = () => {
                setOpen(false);
                form.reset();
            };

            if (variantValue) {
                updateVariantValueMutate(
                    { id: variantValue.id, req: payload },
                    { onSuccess: handleSuccess }
                );
            } else {
                createVariantValueMutate(payload, { onSuccess: handleSuccess });
            }
        },
    });

    useEffect(() => {
        form.reset();
    }, [variantValue, open, form]);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="md:max-w-[450px]">
                <DialogHeader>
                    <DialogTitle>{variantValue ? t("variant.edit_value", "Edit Variant Value") : t("variant.create_value", "Create Variant Value")}</DialogTitle>
                </DialogHeader>
                <form
                    id="variant-value-form"
                    onSubmit={(e) => {
                        e.preventDefault();
                        form.handleSubmit();
                    }}
                >
                    <FieldGroup>
                        <FormTextField
                            form={form}
                            name="code"
                            label={t("common.code")}
                            required={true}
                            placeholder={t("common.code")}
                            type="text"
                        />
                        <FormTextField
                            form={form}
                            name="name"
                            label={t("common.name")}
                            required={true}
                            placeholder={t("common.name")}
                            type="text"
                        />



                        <FormSelectField
                            form={form}
                            name="variantTypeId"
                            label={t("variant.type")}
                            required={true}
                            placeholder={t("common.select")}
                            options={variantTypeOptions}
                            onAdd={() => setvaraintTypeFormOpen(true)}
                        />
                        {/* VariatType form  */}
                        <VariantTypeForm
                            open={varaintTypeFormOpen}
                            setOpen={setvaraintTypeFormOpen}
                            variantType={null}
                        />

                        {/* end of variant form */}
                    </FieldGroup>
                </form>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="outline">{t("common.cancel")}</Button>
                    </DialogClose>
                    <Button
                        type="submit"
                        form="variant-value-form"
                        disabled={isPending}
                    >
                        {isPending ? t("common.saving") : variantValue ? t("common.save") : t("common.create")}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default VariantValueForm;
