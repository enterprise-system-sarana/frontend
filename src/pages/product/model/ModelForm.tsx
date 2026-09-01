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
import { useEffect, useState } from "react";
import { StatusOptions, Status } from "@/types/enum/status";
import FormTextField, { FormRadioGroupField, FormSelectField } from "@/components/ui/FormTextField";
import { ModelSchema, type ModelRequest, type ModelResponse } from "@/types/product/Model";
import { useModel } from "@/hooks/product/useModel";
import { useBrand } from "@/hooks/product/useBrand";
import { useCategory } from "@/hooks/product/useCategory";
import type { BrandResponse } from "@/types/product/Brand";
import type { CategoryResponse } from "@/types/product/Category";
import FormBrand from "@/pages/product/brand/BrandForm";
import FormCategory from "@/pages/product/category/CategoryForm";

type FormModelProps = {
    open: boolean;
    setOpen: (open: boolean) => void;
    model: ModelResponse | null;
};

const ModelForm = ({ open, setOpen, model }: FormModelProps) => {
    const { mutate: createModel, isPending: isCreating } = useModel.CreateModel();
    const { mutate: updateModel, isPending: isUpdating } = useModel.UpdateModel();

    const { data: brandData } = useBrand.useGetAllBrand({ page: 1, size: 100 });
    const { data: categoryData } = useCategory.useGetAllCategory({ page: 1, size: 100 });

    const brandOptions = (brandData?.payload?.data || []).map((b: BrandResponse) => ({
        label: b.name,
        value: String(b.id),
    }));

    const categoryOptions = (categoryData?.payload?.data || []).map((c: CategoryResponse) => ({
        label: c.name,
        value: String(c.id),
    }));

    const isPending = isCreating || isUpdating;

    // Inline create dialogs
    const [brandFormOpen, setBrandFormOpen] = useState(false);
    const [categoryFormOpen, setCategoryFormOpen] = useState(false);

    const form = useForm({
        defaultValues: {
            name: model?.name || "",
            brandId: model?.brandId || 0,
            categoryId: model?.categoryId || 0,
            status: model?.status || Status.ACTIVE,
        } as ModelRequest,
        validators: {
            onSubmit: ModelSchema,
        },
        onSubmit: async ({ value }) => {
            const payload = value as ModelRequest;
            const handleSuccess = () => {
                setOpen(false);
                form.reset();
            };

            if (model) {
                updateModel(
                    { id: model.id, req: payload },
                    { onSuccess: handleSuccess },
                );
            } else {
                createModel(payload, { onSuccess: handleSuccess });
            }
        },
    });

    useEffect(() => {
        form.reset();
    }, [model, open, form]);

    return (
        <>
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="md:max-w-[450px]">
                    <DialogHeader>
                        <DialogTitle>{model ? "Edit" : "Create"} Model</DialogTitle>
                    </DialogHeader>
                    <form
                        id="model-form"
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

                            <FormSelectField
                                form={form}
                                name="brandId"
                                label="Brand"
                                required={true}
                                options={brandOptions}
                                onAdd={() => setBrandFormOpen(true)}
                            />
                            <FormSelectField
                                form={form}
                                name="categoryId"
                                label="Category"
                                required={true}
                                options={categoryOptions}
                                onAdd={() => setCategoryFormOpen(true)}
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
                            form="model-form"
                            disabled={isPending}
                        >
                            {isPending ? "Saving..." : (model ? "Update" : "Create")}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Inline Brand Creation Dialog */}
            <FormBrand
                open={brandFormOpen}
                setOpen={setBrandFormOpen}
                brand={null}
            />

            {/* Inline Category Creation Dialog */}
            <FormCategory
                open={categoryFormOpen}
                setOpen={setCategoryFormOpen}
                category={null}
            />
        </>
    );
};

export default ModelForm;

