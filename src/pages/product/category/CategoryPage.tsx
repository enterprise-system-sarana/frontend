import { useState } from "react";
import type { CategoryResponse } from "@/types/product/Category";
import { useCategory, useDeleteCategory } from "@/hooks/product/useCategory";
import { DataTable } from "@/components/ui/data-table";
import { CategoryColumns } from "./CategoryColumn";
import { QueryBoundary } from "@/components/ui/query-boundary";
import FormCategory from "./CategoryForm";
import ConfirmDelete from "@/components/ui/confirmDelete";
import PageHeader from "@/components/ui/page-header";
import { usePermission } from "@/utils/UsePermission";
import { PERMISSION } from "@/constants/Permission";
import { useSearch } from "@/utils/useSearch";
import { PageFilter } from "@/utils/PageFilter";

const CategoryPage = () => {
    const { Can } = usePermission();
    const canCreate = Can(PERMISSION.CATEGORY.CREATE);
    const canRead = Can(PERMISSION.CATEGORY.READ);
    const canUpdate = Can(PERMISSION.CATEGORY.UPDATE);
    const canDelete = Can(PERMISSION.CATEGORY.DELETE);

    const [open, setOpen] = useState(false)
    const [category, setCategory] = useState<CategoryResponse | null>(null);
    const [page, setPage] = useState(1);
    const [size, setSize] = useState(10);
    const [search, setSearch] = useState("");
    const { data, isError, isLoading } = useCategory({ page, size })
    const { mutate: deleteCategoryMutate } = useDeleteCategory()
    const [openConfirmDelete, setOpenConfirmDelete] = useState(false)

    const filteredCategories = useSearch<CategoryResponse>(data?.payload?.data, search, ["name", "code"]);

    const handleEdit = (category: CategoryResponse) => {
        setCategory(category);
        setOpen(true);
    }
    console.log(data)

    const handleDelete = (id: number) => {
        const selected = data?.payload?.data?.find((u: CategoryResponse) => u.id === id);
        if (selected) {
            setCategory(selected);
            setOpenConfirmDelete(true);
        }
    }

    const confirmDelete = () => {
        if (category?.id) {
            deleteCategoryMutate({ id: category.id }, {
                onSuccess: () => {
                    setOpenConfirmDelete(false)
                }
            })
        }
    };

    if (!canRead) {
        return (
            <div className="flex flex-col items-center justify-center h-[50vh] text-center p-4">
                <h2 className="text-xl font-semibold text-destructive mb-2">Access Denied</h2>
                <p className="text-muted-foreground">You do not have permission to view categories.</p>
            </div>
        );
    }

    return (
        <>
            <PageHeader
                title="Categories"
                buttonText={canCreate ? "Add Category" : undefined}
                onButtonClick={canCreate ? () => { setCategory(null); setOpen(true); } : undefined}
            />
            <PageFilter
                search={search}
                onSearchChange={setSearch}
                searchPlaceholder="Search categories..."
                onReset={() => setSearch("")}
            />
            <QueryBoundary isLoading={isLoading} isError={isError}>
                <DataTable
                    columns={CategoryColumns({
                        onEdit: handleEdit,
                        onDelete: handleDelete,
                        canEdit: canUpdate,
                        canDelete: canDelete,
                    })}
                    data={filteredCategories}
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

            <FormCategory
                open={open}
                setOpen={setOpen}
                category={category}
            />

            <ConfirmDelete
                isOpen={openConfirmDelete}
                setIsOpen={setOpenConfirmDelete}
                entityName={"Category"}
                confirmDelete={confirmDelete}
            />
        </>
    )
}

export default CategoryPage