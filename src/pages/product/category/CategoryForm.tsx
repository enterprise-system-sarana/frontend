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
import { CategorySchema } from "@/types/product/Category";
import type { CategoryResponse, CategoryRequest } from "@/types/product/Category";
import { StatusOptions, Status } from "@/types/enum/status";
import FormTextField, { FormRadioGroupField } from "@/components/ui/FormTextField";
import FileUpload from "@/pages/FileUpload";
import { useCategory } from "@/hooks/product/useCategory";

type FormCategoryProps = {
    open: boolean;
    setOpen: (open: boolean) => void;
    category: CategoryResponse | null;
};

const FormCategory = ({ open, setOpen, category }: FormCategoryProps) => {
    const { mutate: createCategoryMutate, isPending: isCreating } = useCategory.useCreateCategory();
    const { mutate: updateCategoryMutate, isPending: isUpdating } = useCategory.useUpdateCategory();

    const isPending = isCreating || isUpdating;
    const form = useForm({
        defaultValues: {
            name: category?.name || "",
            code: category?.code || "",
            imageUrl: category?.imageUrl || "",
            status: category?.status || Status.ACTIVE,
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
                    { id: category.id, req: payload },
                    { onSuccess: handleSuccess },
                );
            } else {
                createCategoryMutate(payload, { onSuccess: handleSuccess });
            }
        },
    });

    useEffect(() => {
        form.reset();
    }, [category, open, form]);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="md:max-w-[450px]">
                <DialogHeader>
                    <DialogTitle>{category ? "Edit" : "Create"} brand</DialogTitle>
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
                        <FormTextField
                            form={form}
                            name="code"
                            label="Code"
                            required={true}
                            placeholder="Code"
                            type="text"
                        />

                        <FileUpload
                            label="Category Image"
                            value={form.state.values.imageUrl || category?.imageUrl}
                            onUploaded={(fileName) => {
                                form.setFieldValue("imageUrl", fileName);
                            }}
                            onRemove={() => {
                                form.setFieldValue("imageUrl", "");
                            }}
                            defaultBucket="category"
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
                        {isPending ? "Saving..." : (category ? "Update" : "Create")}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default FormCategory;
