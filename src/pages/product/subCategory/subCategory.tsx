import { DataTable } from "@/components/ui/data-table"
import { QueryBoundary } from "@/components/ui/query-boundary"
import { useState } from "react"
import { SubCategoryForm } from "./SubCategoryForm"
import { subCategoryColumns } from "./SubCategoryColumn"
import { useSubCategory } from "@/hooks/product/useSubCategory"
import type { SubCategoryResponse } from "@/types/product/SubCategory"
import PageHeader from "@/components/ui/page-header"
import ConfirmDelete from "@/components/ui/confirmDelete"
import { usePermission } from "@/utils/UsePermission"
import { PERMISSION } from "@/constants/Permission"
import { useSearch } from "@/utils/useSearch"
import { PageFilter } from "@/utils/PageFilter"

const SubCategory = () => {
    const { Can } = usePermission();
    const canCreate = Can(PERMISSION.SUBCATEGORY.CREATE);
    const canRead = Can(PERMISSION.SUBCATEGORY.READ);
    const canUpdate = Can(PERMISSION.SUBCATEGORY.UPDATE);
    const canDelete = Can(PERMISSION.SUBCATEGORY.DELETE);

    const [open, setOpen] = useState(false)
    const [subCategory, setSubCategory] = useState<SubCategoryResponse | null>(null);
    const [page, setPage] = useState(1);
    const [size, setSize] = useState(10);
    const [search, setSearch] = useState("");
    const { data, isError, isLoading } = useSubCategory.useGetAllSubCategory({ page, size });

    const filteredSubCategories = useSearch<SubCategoryResponse>(data?.payload?.data, search, ["name", "categoryName"]);

    const [openConfirmDelete, setOpenConfirmDelete] = useState(false);
    const { mutate: useSubCategoryDelete } = useSubCategory.useDeleteSubCategory()
    const handleEdit = (subCategory: any) => {
        setSubCategory(subCategory);
        setOpen(true);
    }

    const handleDelete = (id: number) => {
        const selected = data?.payload?.data?.find((subCategory: SubCategoryResponse) => subCategory.id === id);
        if (selected) {
            setSubCategory(selected);
            setOpenConfirmDelete(true);
        }
    }

    const confirmDelete = () => {
        if (subCategory?.id) {
            useSubCategoryDelete(subCategory.id, {
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
                <p className="text-muted-foreground">You do not have permission to view sub-categories.</p>
            </div>
        );
    }

    return (
        <>

            <PageHeader
                title="Sub Category"
                buttonText={canCreate ? "Add Sub Category" : undefined}
                onButtonClick={canCreate ? () => { setSubCategory(null); setOpen(true); } : undefined}
            />
            <PageFilter
                search={search}
                onSearchChange={setSearch}
                searchPlaceholder="Search sub-categories..."
                onReset={() => setSearch("")}
            />
            <QueryBoundary isLoading={isLoading} isError={isError}>
                <DataTable
                    columns={subCategoryColumns({
                        onEdit: handleEdit,
                        onDelete: handleDelete,
                        canEdit: canUpdate,
                        canDelete: canDelete,
                    })}
                    data={filteredSubCategories}
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

            <SubCategoryForm
                open={open}
                setOpen={setOpen}
                subCategory={subCategory}
            />

            <ConfirmDelete
                isOpen={openConfirmDelete}
                setIsOpen={setOpenConfirmDelete}
                entityName="Sub Category"
                confirmDelete={confirmDelete}
            />
        </>
    )
}

export default SubCategory