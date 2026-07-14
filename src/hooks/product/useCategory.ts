import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { findAll, create, update, deleteCategory } from "@/services/product/category.service";
import type { CategoryRequest, CategoryFilter } from "@/types/product/Category";
import { mutationHandler } from "../handleMutaion";

export const categoryKeys = {
    key: "categories",
    list: (filter: CategoryFilter) => [categoryKeys.key, "list", { ...filter }],
};


export const useGetAllCategory = (filter: CategoryFilter) => {
    return useQuery({
        queryKey: [categoryKeys.key],
        queryFn: () => findAll(filter),
    })
}


export const useCategory = (filter: CategoryFilter = { page: 1, size: 10 }) => {
    return useQuery({
        queryKey: categoryKeys.list(filter),
        queryFn: () => findAll(filter),
    })
}

export const useCreateCategory = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: create,
        ...mutationHandler({
            queryClient,
            queryKey: [categoryKeys.key],
        }),
    })
}

export const useUpdateCategory = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: ({ id, request }: { id: number; request: CategoryRequest }) => update(id, request),
        ...mutationHandler({
            queryClient,
            queryKey: [categoryKeys.key],
        }),
    })
}

export const useDeleteCategory = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: ({ id }: { id: number }) => deleteCategory(id),

        ...mutationHandler({
            queryClient,
            queryKey: [categoryKeys.key],
        }),
    })
}