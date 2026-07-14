import type { SubCategoryRequest, subCategoryFilter } from "@/types/product/SubCategory";
import { subCategoryService } from "@/services/product/subCategory.service";
import { toast } from "sonner";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const useSubCategory = {
    keys: {
        all: ["sub-categories"],
        list: (filter: subCategoryFilter) => [...useSubCategory.keys.all, "list", { ...filter }],
        detail: (id: number) => [...useSubCategory.keys.all, "detail", id],
    },

    useGetAllSubCategory: (filter: subCategoryFilter) => {
        return useQuery({
            queryKey: useSubCategory.keys.list(filter),
            queryFn: () => subCategoryService.findAll(filter),
            retry: 1,
        })
    },

    useCreateSubCategory: () => {
        const queryClient = useQueryClient();
        return useMutation({
            mutationFn: (request: SubCategoryRequest) => subCategoryService.create(request),
            onSuccess: (data: any) => {
                queryClient.invalidateQueries({ queryKey: useSubCategory.keys.all });
                toast.success(data?.message);
            },
            onError: (error: any) => {
                toast.error(error?.message);
            },
        })
    },

    useUpdateSubCategory: () => {
        const queryClient = useQueryClient();
        return useMutation({
            mutationFn: ({ id, request }: { id: number; request: SubCategoryRequest }) => subCategoryService.update(id, request),
            onSuccess: (data: any) => {
                queryClient.invalidateQueries({ queryKey: useSubCategory.keys.all });
                toast.success(data?.message);
            },
            onError: (error: any) => {
                toast.error(error?.message);
            },
        })
    },

    useDeleteSubCategory: () => {
        const queryClient = useQueryClient();
        return useMutation({
            mutationFn: (id: number) => subCategoryService.deleteSubCategory(id),
            onSuccess: (data: any) => {
                queryClient.invalidateQueries({ queryKey: useSubCategory.keys.all });
                toast.success(data?.message);
            },
            onError: (error: any) => {
                toast.error(error?.message);
            },
        })
    },
}