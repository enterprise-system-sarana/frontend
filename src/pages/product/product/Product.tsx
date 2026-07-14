import { DataTable } from "@/components/ui/data-table"
import { QueryBoundary } from "@/components/ui/query-boundary"
import { useProduct } from "@/hooks/product/useProduct"
import { useGetAllCategory } from "@/hooks/product/useCategory"
import { useSubCategory } from "@/hooks/product/useSubCategory"
import { ProductColumns } from "./ProductColumn"
import { useState, useMemo, useEffect } from "react"
import type { ProductResponse } from "@/types/product/Product"
import { useNavigate } from "react-router-dom"
import PageHeader from "@/components/ui/page-header"
import ConfirmDelete from "@/components/ui/confirmDelete"
import { usePermission } from "@/utils/UsePermission"
import { PERMISSION } from "@/constants/Permission"
import { useSearch } from "@/utils/useSearch";
import { PageFilter } from "@/utils/PageFilter";

export const ProductPage = () => {
    const { Can } = usePermission();
    const canCreate = Can(PERMISSION.PRODUCT.CREATE);
    const canRead = Can(PERMISSION.PRODUCT.READ);
    const canUpdate = Can(PERMISSION.PRODUCT.UPDATE);
    const canDelete = Can(PERMISSION.PRODUCT.DELETE);

    const navigate = useNavigate()
    const [product, setProduct] = useState<ProductResponse | null>(null)
    const [openConfirmDelete, setOpenConfirmDelete] = useState(false)
    const [page, setPage] = useState(1);
    const [size, setSize] = useState(10);

    const [search, setSearch] = useState("");
    const [categoryId, setCategoryId] = useState("");
    const [subCategoryId, setSubCategoryId] = useState("");

    useEffect(() => {
        const handler = setTimeout(() => {
            setPage(1);
        }, 300);
        return () => clearTimeout(handler);
    }, [search]);

    const { data, isError, isLoading } = useProduct.useGetAllProduct({
        page,
        size,
        categoryId: categoryId && categoryId !== "all" ? Number(categoryId) : undefined,
        subCategoryId: subCategoryId && subCategoryId !== "all" ? Number(subCategoryId) : undefined,
    });

    const { data: categoriesData } = useGetAllCategory({ page: 1, size: 100 });
    const { data: subcategoriesData } = useSubCategory.useGetAllSubCategory({ page: 1, size: 100 });
    const { mutate: useProductDelete } = useProduct.useDeleteProduct();

    const categories = categoriesData?.payload?.data || [];
    const subCategories = subcategoriesData?.payload?.data || [];


    const filteredProducts = useSearch<ProductResponse>(data?.payload?.data, search, [
        "name",
        "code",
        "details",
        "categoryName",
        "subCategoryName",
    ]);



    const filteredSubCategories = useMemo(() => {
        if (!categoryId || categoryId === "all") return subCategories;
        return subCategories.filter((sub: any) => String(sub.categoryId) === String(categoryId));
    }, [subCategories, categoryId]);

    const dropdowns = useMemo(() => [
        {
            key: "categoryId",
            placeholder: "Filter by Category",
            allLabel: "All Categories",
            options: categories.map((cat: any) => ({
                label: cat.name,
                value: String(cat.id),
            })),
        },
        {
            key: "subCategoryId",
            placeholder: "Filter by Sub Category",
            allLabel: "All Sub Categories",
            options: filteredSubCategories.map((sub: any) => ({
                label: sub.name,
                value: String(sub.id),
            })),
            disabled: !categoryId || categoryId === "all",
        }
    ], [categories, filteredSubCategories, categoryId]);

    const dropdownValues = useMemo(() => ({
        categoryId: categoryId || "all",
        subCategoryId: subCategoryId || "all",
    }), [categoryId, subCategoryId]);

    const handleDropdownChange = (key: string, value: string) => {
        const actualValue = value === "all" ? "" : value;
        if (key === "categoryId") {
            setCategoryId(actualValue);
            setSubCategoryId(""); // reset subcategory on category change
        } else if (key === "subCategoryId") {
            setSubCategoryId(actualValue);
        }
        setPage(1);
    };

    const handleReset = () => {
        setSearch("");
        setCategoryId("");
        setSubCategoryId("");
        setPage(1);
    };

    const handleEdit = (product: any) => {
        navigate(`/product/edit/${product.id}`)
    }
    const handleDelete = (id: number) => {
        const selected = data?.payload?.data.find((product: ProductResponse) => product.id === id)
        if (selected) {
            setProduct(selected);
            setOpenConfirmDelete(true);
        }
    }
    const confirmDelete = () => {
        if (product?.id) {
            useProductDelete(product.id, {
                onSuccess: () => {
                    setOpenConfirmDelete(false)
                }
            })
        }
    }

    if (!canRead) {
        return (
            <div className="flex flex-col items-center justify-center h-[50vh] text-center p-4">
                <h2 className="text-xl font-semibold text-destructive mb-2">Access Denied</h2>
                <p className="text-muted-foreground">You do not have permission to view products.</p>
            </div>
        );
    }

    return (
        <>
            <PageHeader
                title="Products"
                buttonText={canCreate ? "Add Product" : undefined}
                onButtonClick={canCreate ? () => {
                    navigate("/product/create")
                } : undefined}
            />
            <PageFilter
                search={search}
                onSearchChange={setSearch}
                searchPlaceholder="Search products..."
                dropdowns={dropdowns}
                dropdownValues={dropdownValues}
                onDropdownChange={handleDropdownChange}
                onReset={handleReset}
            />
            <QueryBoundary isError={isError} isLoading={isLoading}>
                <DataTable
                    columns={ProductColumns({
                        onEdit: handleEdit,
                        onDelete: handleDelete,
                        canEdit: canUpdate,
                        canDelete: canDelete,
                    })}
                    data={filteredProducts}
                    // searchFields={searchFields}
                    // onFilterChange={handleFilterChange}
                    pagination={{
                        currentPage: page,
                        pageSize: size,
                        totalElements: data?.payload?.pagination?.totalElements || 0,
                        totalPages: data?.payload?.pagination?.totalPages || 1,
                        onPageChange: setPage,
                        onPageSizeChange: setSize,
                    }}
                />
            </QueryBoundary>
            <ConfirmDelete
                isOpen={openConfirmDelete}
                setIsOpen={setOpenConfirmDelete}
                entityName="Product"
                confirmDelete={confirmDelete}
            />
        </>
    )
}