import { useForm } from "@tanstack/react-form";
import { Button } from "@/components/ui/button";
import { FieldGroup, } from "@/components/ui/field";
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { useEffect } from "react";
import { CategorySchema } from "@/types/product/Category";
import type { CategoryResponse, CategoryRequest } from "@/types/product/Category";
import { Status } from "@/types/enum/status";
import { useCreateCategory, useUpdateCategory } from "@/hooks/product/useCategory";
import FormTextField, { FormImageUpload, FormSelectField } from "@/components/ui/FormTextField";

type FormCategoryProps = {
    open: boolean;
    setOpen: (open: boolean) => void;
    category: CategoryResponse | null;
};

const FormCategory = ({ open, setOpen, category }: FormCategoryProps) => {
    const { mutate: createCategoryMutate, isPending: isCreating } = useCreateCategory();
    const { mutate: updateCategoryMutate, isPending: isUpdating } = useUpdateCategory();

    const isPending = isCreating || isUpdating;
    const form = useForm({
        defaultValues: {
            name: category?.name || "",
            code: category?.code || "",
            imageUrl: category?.imageUrl || "",
            status: category?.status || Status.Active,
        } as CategoryRequest,
        validators: {
            onSubmit: CategorySchema,
        },
        onSubmit: async ({ value }) => {
            const payload = value as CategoryRequest;
            const handleSuccess = () => {
                setOpen(false);
                form.reset();
            };

            if (category) {
                updateCategoryMutate(
                    { id: category.id, request: payload },
                    { onSuccess: handleSuccess },
                );
            } else {
                createCategoryMutate(payload, { onSuccess: handleSuccess });
            }
        },
    });

    useEffect(() => {
        form.reset();
    }, [category, open]);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="md:max-w-[450px]">
                <DialogHeader>
                    <DialogTitle>{category ? "Edit" : "Create"} category</DialogTitle>
                </DialogHeader>
                <form
                    id="category-form"
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
                            placeholder="Enter Category Name"
                            type="text"
                        />
                        <FormTextField
                            form={form}
                            name="code"
                            label="Code"
                            required={true}
                            placeholder="Enter Category Code"
                            type="text"
                        />
                        <FormImageUpload
                            form={form}
                            name="imageUrl"
                            label="Image"
                        />
                        <FormSelectField
                            form={form}
                            name="status"
                            label="Status"
                            required={true}
                            placeholder="Select Status"
                            options={Object.entries(Status).map(([, value]) => ({
                                value: value,
                                label: value,
                            })) || []}
                        />
                    </FieldGroup>
                </form>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="outline">Cancel</Button>
                    </DialogClose>
                    <Button
                        type="submit"
                        form="category-form"
                        disabled={isPending}
                    >
                        {isPending ? "Saving..." : (category ? "Update" : "Create")}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default FormCategory;