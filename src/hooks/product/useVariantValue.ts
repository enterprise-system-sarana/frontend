import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { mutationHandler } from "../handleMutaion";
import { VariantValueService } from "@/services/product/variantValue.service";
import type { VariantValueFilter, VariantValueRequest } from "@/types/product/VariantValue";


export const useVariantValue = {
    variantValueKey: {
        all: ["variantValue"],
        list: (filter: VariantValueFilter) => [...useVariantValue.variantValueKey.all, "list", { ...filter }],
        detail: (id: number) => [...useVariantValue.variantValueKey.all, "detail", id]
    },
    useGetAllVariantValue: (filter: VariantValueFilter = { page: 1, size: 10 }) => {
        return useQuery({
            queryKey: useVariantValue.variantValueKey.list(filter),
            queryFn: () => VariantValueService.findAll(filter),
            retry: 1
        });
    },
    useCreateVariantValue: () => {
        const queryClient = useQueryClient();
        return useMutation({
            mutationFn: (req: VariantValueRequest) => VariantValueService.create(req),
            ...mutationHandler({
                queryClient,
                queryKey: useVariantValue.variantValueKey.all
            })
        });
    },
    useUpdateVariantValue: () => {
        const queryClient = useQueryClient();
        return useMutation({
            mutationFn: ({ id, req }: { id: number; req: VariantValueRequest }) => VariantValueService.update(id, req),
            ...mutationHandler({
                queryClient,
                queryKey: useVariantValue.variantValueKey.all
            })
        });
    },
    useDeleteVariantValue: () => {
        const queryClient = useQueryClient();
        return useMutation({
            mutationFn: ({ id }: { id: number }) => VariantValueService.delete(id),
            ...mutationHandler({
                queryClient,
                queryKey: useVariantValue.variantValueKey.all
            })
        });
    }
}