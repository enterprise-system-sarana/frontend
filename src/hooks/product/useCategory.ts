import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { findAll, create, update, deleteCategory } from "@/services/category.service";
import type { CategoryRequest, CategoryFilter } from "@/types/product/Category";
import { toast } from "sonner";

export const categoryKeys = {
    all: ["categories"],
    list: (filter: CategoryFilter) => [...categoryKeys.all, "list", { ...filter }],
    details: (id: number) => [...categoryKeys.all, "detail", id],
};

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
        onSuccess: (res: any) => {
            queryClient.invalidateQueries({ queryKey: categoryKeys.all })
            toast.success(res?.message)
        },
        onError: (error: any) => {
            toast.error(error?.message)
        }
    })
}

export const useUpdateCategory = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: ({ id, request }: { id: number; request: CategoryRequest }) => update(id, request),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: categoryKeys.all })
        }, onError: (error: any) => {
            toast.error(error?.message)
        }
    })
}

export const useDeleteCategory = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: deleteCategory,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: categoryKeys.all })
        }, onError: (error: any) => {
            toast.error(error?.message)
        }
    })
}