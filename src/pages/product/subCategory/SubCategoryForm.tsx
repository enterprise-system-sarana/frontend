import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FieldGroup } from "@/components/ui/field";
import FormTextField, { FormSelectField } from "@/components/ui/FormTextField";
import { Status } from "@/types/enum/status";
import { SubCategoryShema, type SubCategoryRequest, type SubCategoryResponse } from "@/types/product/SubCategory"
import { useForm } from "@tanstack/react-form";
import { useGetAllCategory } from "@/hooks/product/useCategory";
import { useSubCategory } from "@/hooks/product/useSubCategory";

type subCategoryFormProps = {
    open: boolean;
    setOpen: (open: boolean) => void;
    subCategory: SubCategoryResponse | null;
}
export const SubCategoryForm = ({ open, setOpen, subCategory }: subCategoryFormProps) => {
    const { mutate: createSubCategory, } = useSubCategory.useCreateSubCategory()
    const { mutate: updateSubCategory } = useSubCategory.useUpdateSubCategory()

    const { data } = useGetAllCategory({ page: 1, size: 100 });
    const categories = data?.payload?.data || []
    const form = useForm({
        defaultValues: {
            name: subCategory?.name || "",
            status: subCategory?.status || Status.Active,
            categoryId: subCategory ? String(subCategory.categoryId) : "",
        },
        validators: {
            onSubmit: SubCategoryShema
        },
        onSubmit: async ({ value }) => {
            const payload: SubCategoryRequest = {
                name: value.name,
                status: value.status,
                categoryId: Number(value.categoryId),
            };
            const handleSuccess = () => {
                setOpen(false);
                form.reset();
            };

            if (subCategory) {
                updateSubCategory({ id: subCategory.id, request: payload },
                    { onSuccess: handleSuccess })
            } else {
                createSubCategory(payload,
                    { onSuccess: handleSuccess })
            }


        },
    })


    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="sm:max-[400px]">
                <DialogHeader>
                    <DialogTitle>{subCategory ? "Edit" : "Create"} sub category</DialogTitle>
                </DialogHeader>
                <form
                    id="sub-category-form"
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
                            placeholder="Enter Sub Category Name"
                            type="text"
                            required={true}

                        />


                        <FormSelectField
                            form={form}
                            name="categoryId"
                            label="Category"
                            placeholder="Select Category"
                            options={categories.map((category: any) => ({
                                value: String(category.id),
                                label: category.name,
                            })) || []}
                            required={true}


                        />

                        <FormSelectField
                            form={form}
                            name="status"
                            label="Status"
                            placeholder="Select Status"
                            options={Object.entries(Status).map(([key, value]) => ({
                                value: value,
                                label: key,
                            })) || []}
                            required={true}

                        />

                    </FieldGroup>

                </form>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="outline">Cancel</Button>
                    </DialogClose>
                    <Button
                        type="submit"
                        form="sub-category-form"
                    >
                        Create
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}