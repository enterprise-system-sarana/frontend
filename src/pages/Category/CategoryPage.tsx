import { useState } from "react";
import type { CategoryResponse } from "@/types/product/Category";
import { useCategory, useDeleteCategory } from "@/hooks/product/useCategory";
import { DataTable } from "@/components/ui/data-table";
import { CategoryColumns } from "./CategoryColumn";
import { Button } from "@/components/ui/button";
import { QueryBoundary } from "@/components/ui/query-boundary";
import FormCategory from "./FormCategory";
// 
const CategoryPage = () => {
    const [open, setOpen] = useState(false)
    const [category, setCategory] = useState<CategoryResponse>();
    const [isOpen, setIsOpen] = useState(false);
    const { data, isError, isLoading } = useCategory({ page: 1, size: 10 })
    const { mutate: deleteCategoryMutate } = useDeleteCategory()
    const handleEdit = (category: CategoryResponse) => {
        setCategory(category);
        setOpen(true);
    }

    const handleDelete = (id: number) => {
        if (confirm("Are you sure you want to delete this category?")) {
            deleteCategoryMutate(id);
        }
    }



    return (
        <>
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">Categories</h1>
                <Button onClick={() => { setCategory; setOpen(true); }}>+ Add Category</Button>
            </div>
            <QueryBoundary isLoading={isLoading} isError={isError}>
                <DataTable
                    columns={CategoryColumns({
                        onEdit: handleEdit,
                        onDelete: handleDelete
                    })}
                    data={data?.payload?.data || []}
                />
            </QueryBoundary>

            <FormCategory
                open={open}
                setOpen={setOpen}
                category={category}
            />
        </>
    )
}

export default CategoryPage