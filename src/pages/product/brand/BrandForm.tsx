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
import { BrandSchema } from "@/types/product/Brand";
import type { BrandResponse, BrandRequest } from "@/types/product/Brand";
import { StatusOptions, Status } from "@/types/enum/status";
import FormTextField, { FormRadioGroupField } from "@/components/ui/FormTextField";
import FileUpload from "@/pages/FileUpload";
import { useBrand } from "@/hooks/product/useBrand";

type FormBrandProps = {
    open: boolean;
    setOpen: (open: boolean) => void;
    brand: BrandResponse | null;
};

const FormBrand = ({ open, setOpen, brand }: FormBrandProps) => {
    const { mutate: createBrandMutate, isPending: isCreating } = useBrand.useCreateBrand();
    const { mutate: updateBrandMutate, isPending: isUpdating } = useBrand.useUpdateBrand();

    const isPending = isCreating || isUpdating;
    const form = useForm({
        defaultValues: {
            name: brand?.name || "",
            imageUrl: brand?.imageUrl || "",
            status: brand?.status || Status.ACTIVE,
        } as BrandRequest,
        validators: {
            onSubmit: BrandSchema,
        },
        onSubmit: async ({ value }) => {
            const payload = value as BrandRequest;
            const handleSuccess = () => {
                setOpen(false);
                form.reset();
            };

            if (brand) {
                updateBrandMutate(
                    { id: brand.id, req: payload },
                    { onSuccess: handleSuccess },
                );
            } else {
                createBrandMutate(payload, { onSuccess: handleSuccess });
            }
        },
    });

    useEffect(() => {
        form.reset();
    }, [brand, open, form]);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="md:max-w-[450px]">
                <DialogHeader>
                    <DialogTitle>{brand ? "Edit" : "Create"} brand</DialogTitle>
                </DialogHeader>
                <form
                    id="brand-form"
                    onSubmit={(e) => {
                        e.preventDefault();
                        form.handleSubmit();
                    }}
                >
                    <FieldGroup>
                        <FormTextField
                            form={form}
                            name="name"
                            label="Name"
                            required={true}
                            placeholder="Name"
                            type="text"
                        />

                        <FileUpload
                            label="Brand Logo"
                            value={form.state.values.imageUrl || brand?.imageUrl}
                            onUploaded={(fileName) => {
                                form.setFieldValue("imageUrl", fileName);
                            }}
                            onRemove={() => {
                                form.setFieldValue("imageUrl", "");
                            }}
                            defaultBucket="brand"
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
                        form="brand-form"
                        disabled={isPending}
                    >
                        {isPending ? "Saving..." : (brand ? "Update" : "Create")}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default FormBrand;
