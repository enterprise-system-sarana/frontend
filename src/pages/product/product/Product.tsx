import { DataTable } from "@/components/ui/data-table"
import { QueryBoundary } from "@/components/ui/query-boundary"
import { useProduct } from "@/hooks/product/useProduct"
import { ProductColumns } from "./ProductColumn"
import { useState, useMemo } from "react"
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
    const [filters, setFilters] = useState<Record<string, string>>({});
    const [search, setSearch] = useState("");

    const { data, isError, isLoading } = useProduct.useGetAllProduct({
        page,
        size,
        name: filters.name || undefined,
        code: filters.code || undefined,
        categoryId: filters.categoryId ? Number(filters.categoryId) : undefined,
    });

    const filteredProducts = useSearch<ProductResponse>(
        data?.payload?.data, 
        search, 
        ["name", "code", "categoryName", "subCategoryName", "unitName"]
    );

    const { mutate: useProductDelete } = useProduct.useDeleteProduct();

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
                onReset={() => setSearch("")}
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