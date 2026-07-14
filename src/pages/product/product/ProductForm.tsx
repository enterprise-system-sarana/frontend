import { FieldGroup } from "@/components/ui/field";
import { useProduct } from "@/hooks/product/useProduct";
import { Status } from "@/types/enum/status";
import { ProductShema, type ProductFormValues } from "@/types/product/Product";
import { useForm, useStore } from "@tanstack/react-form";
import { useEffect, useMemo } from "react";
import FormTextField, { FormSelectField } from "@/components/ui/FormTextField";
import { Button } from "@/components/ui/button";
import { useGetAllCategory } from "@/hooks/product/useCategory";
import { useSubCategory } from "@/hooks/product/useSubCategory";
import { useUnit } from "@/hooks/product/useUnit";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { usePermission } from "@/utils/UsePermission";
import { PERMISSION } from "@/constants/Permission";

export const ProductForm = () => {
    const { Can } = usePermission();
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const productId = id ? Number(id) : undefined;
    const isEdit = !!productId;

    const canAccess = isEdit ? Can(PERMISSION.PRODUCT.UPDATE) : Can(PERMISSION.PRODUCT.CREATE);

    const { mutate: createProduct, isPending: isCreating } = useProduct.useCreateProduct();
    const { mutate: updateProduct, isPending: isUpdating } = useProduct.useUpdateProduct();
    const isPending = isCreating || isUpdating;

    if (!canAccess) {
        return (
            <div className="flex flex-col items-center justify-center h-[50vh] text-center p-4">
                <h2 className="text-xl font-semibold text-destructive mb-2">Access Denied</h2>
                <p className="text-muted-foreground">You do not have permission to access this page.</p>
            </div>
        );
    }

    const { data: categoryData } = useGetAllCategory({ page: 1, size: 100 });
    const { data: subCategoryData } = useSubCategory.useGetAllSubCategory({ page: 1, size: 100 });
    const { data: unitData } = useUnit.useUnitGetAll({ page: 1, size: 100 });

    const categories = categoryData?.payload?.data || [];
    const subCategories = subCategoryData?.payload?.data || [];
    const units = unitData?.payload?.data || [];

    // Fetch product details if editing
    const { data: productDetail, isLoading: isLoadingProduct } = useProduct.useGetProductById(
        productId || 0,
        !!productId
    );
    const product = productDetail?.payload || null;

    const form = useForm({
        defaultValues: {
            name: product?.name || "",
            code: product?.code || "",
            salePrice: product?.salePrice || 0,
            costPrice: product?.costPrice || 0,
            alertQuantity: product?.alertQuantity || 0,
            categoryId: product?.categoryId || 0,
            subCategoryId: product?.subCategoryId || 0,
            unitId: product?.unitId || 0,
            defaultSaleUnit: product?.defaultSaleUnit || 0,
            defaultPurchaseUnit: product?.defaultPurchaseUnit || 0,
            printer: product?.printer || 0,
            status: product?.status || Status.Active,
            type: product?.type || "",
            details: product?.details || "",
        } as ProductFormValues,
        validators: {
            onSubmit: ProductShema,
        },
        onSubmit: async ({ value }) => {
            const payload = ProductShema.parse(value);
            const handleSuccess = () => {
                navigate("/product");
            };
            if (product) {
                updateProduct({ id: product.id, req: payload }, { onSuccess: handleSuccess });
            } else {
                createProduct(payload, { onSuccess: handleSuccess });
            }
        }
    });

    const categoryId = useStore(form.store, (state) => state.values.categoryId);

    // Filter subcategories belonging to the selected category
    const filteredSubCategories = useMemo(() => {
        if (!categoryId) return [];
        return subCategories.filter((sub: any) => String(sub.categoryId) === String(categoryId));
    }, [subCategories, categoryId]);

    // Reset subCategoryId if it's not valid for the selected category anymore
    useEffect(() => {
        const subCategoryId = form.state.values.subCategoryId;
        if (subCategoryId && !filteredSubCategories.some((sub: any) => String(sub.id) === String(subCategoryId))) {
            form.setFieldValue("subCategoryId", 0);
        }
    }, [categoryId, filteredSubCategories, form]);

    useEffect(() => {
        if (product) {
            form.reset();
        }
    }, [product, form]);

    if (productId && isLoadingProduct) {
        return (
            <div className="flex h-64 items-center justify-center">
                <div className="text-muted-foreground animate-pulse text-lg">Loading product details...</div>
            </div>
        );
    }

    return (
        <div className="container max-w-full">
            <div className="flex items-center gap-4 mb-6">
                <Button variant="ghost" size="icon" onClick={() => navigate("/product")}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <h1 className="text-2xl font-bold tracking-tight">
                    {product ? "Edit Product" : "Create Product"}
                </h1>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>{product ? "Edit Product Specifications" : "Create New Product"}</CardTitle>
                </CardHeader>
                <CardContent>
                    <form
                        id="product-form"
                        onSubmit={(e) => {
                            e.preventDefault();
                            form.handleSubmit();
                        }}
                    >
                        <FieldGroup>
                            <div className="grid grid-cols-2 gap-4">
                                <FormTextField
                                    form={form}
                                    name="name"
                                    label="Name"
                                    required={true}
                                    placeholder="Enter Product Name"
                                    type="text"
                                />
                                <FormTextField
                                    form={form}
                                    name="code"
                                    label="Code"
                                    required={true}
                                    placeholder="Enter Product Code"
                                    type="text"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <FormTextField
                                    form={form}
                                    name="salePrice"
                                    label="Sale Price"
                                    required={true}
                                    placeholder="Enter Sale Price"
                                    type="number"
                                />
                                <FormTextField
                                    form={form}
                                    name="costPrice"
                                    label="Cost Price"
                                    required={true}
                                    placeholder="Enter Cost Price"
                                    type="number"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <FormTextField
                                    form={form}
                                    name="alertQuantity"
                                    label="Alert Quantity"
                                    required={true}
                                    placeholder="Enter Alert Quantity"
                                    type="number"
                                />
                                <FormTextField
                                    form={form}
                                    name="details"
                                    label="Details"
                                    required={true}
                                    placeholder="Enter Details"
                                    type="text"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <FormSelectField
                                    form={form}
                                    name="categoryId"
                                    label="Category"
                                    placeholder="Select Category"
                                    options={categories.map((category: any) => ({
                                        value: String(category.id),
                                        label: category.name,
                                    }))}
                                    required={true}
                                />

                                <FormSelectField
                                    form={form}
                                    name="subCategoryId"
                                    label="Sub Category"
                                    placeholder={categoryId && Number(categoryId) !== 0 ? "Select Sub Category" : "Select Category first"}
                                    options={filteredSubCategories.map((subCategory: any) => ({
                                        value: String(subCategory.id),
                                        label: subCategory.name,
                                    }))}
                                    required={true}
                                    disabled={!categoryId || Number(categoryId) === 0}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <FormSelectField
                                    form={form}
                                    name="unitId"
                                    label="Unit"
                                    placeholder={units.length > 0 ? "Select Unit" : "No Units available"}
                                    options={units.map((unit: any) => ({
                                        value: String(unit.id),
                                        label: unit.name,
                                    }))}
                                    required={true}
                                />
                                <FormTextField
                                    form={form}
                                    name="defaultSaleUnit"
                                    label="Default Sale Unit"
                                    required={true}
                                    placeholder="Enter Default Sale Unit"
                                    type="number"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <FormTextField
                                    form={form}
                                    name="defaultPurchaseUnit"
                                    label="Default Purchase Unit"
                                    required={true}
                                    placeholder="Enter Default Purchase Unit"
                                    type="number"
                                />
                                <FormTextField
                                    form={form}
                                    name="printer"
                                    label="Printer"
                                    required={true}
                                    placeholder="Enter Printer"
                                    type="number"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <FormSelectField
                                    form={form}
                                    name="status"
                                    label="Status"
                                    required={true}
                                    placeholder="Select Status"
                                    options={Object.entries(Status).map(([, value]) => ({
                                        value: value,
                                        label: value,
                                    }))}
                                />
                            </div>
                        </FieldGroup>
                    </form>
                </CardContent>
                <CardFooter className="flex justify-end gap-4 border-t py-4">
                    <Button variant="outline" type="button" onClick={() => navigate("/product")}>
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        form="product-form"
                        disabled={isPending}
                    >
                        {isPending ? "Saving..." : (product ? "Update Product" : "Create Product")}
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
};