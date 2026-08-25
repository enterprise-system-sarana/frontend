import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { mutationHandler } from "../handleMutaion";
import type { CategoryFilter, CategoryRequest } from "@/types/product/Category";
import { CategoryService } from "@/services/product/category.service";



export const useCategory = {
    categoryKey: {
        all: ["category"],
        list: (filter: CategoryFilter) => [...useCategory.categoryKey.all, "list", { ...filter }],
        detail: (id: number) => [...useCategory.categoryKey.all, "detail", id]
    },
    useGetAllCategory: (filter: CategoryFilter = { page: 1, size: 10 }) => {
        return useQuery({
            queryKey: useCategory.categoryKey.list(filter),
            queryFn: () => CategoryService.findAll(filter),
            retry: 1
        });
    },
    useCreateCategory: () => {
        const queryClient = useQueryClient();
        return useMutation({
            mutationFn: (req: CategoryRequest) => CategoryService.create(req),
            ...mutationHandler({
                queryClient,
                queryKey: useCategory.categoryKey.all
            })
        });
    },
    useUpdateCategory: () => {
        const queryClient = useQueryClient();
        return useMutation({
            mutationFn: ({ id, req }: { id: number; req: CategoryRequest }) => CategoryService.update(id, req),
            ...mutationHandler({
                queryClient,
                queryKey: useCategory.categoryKey.all
            })
        });
    },
    useDeleteCategory: () => {
        const queryClient = useQueryClient();
        return useMutation({
            mutationFn: ({ id }: { id: number }) => CategoryService.delete(id),
            ...mutationHandler({
                queryClient,
                queryKey: useCategory.categoryKey.all
            })
        });
    }
}