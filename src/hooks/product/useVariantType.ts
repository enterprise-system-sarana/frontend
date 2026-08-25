import type { VariantTypeFilter, VariantTypeRequest } from "@/types/product/VariantType";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { mutationHandler } from "../handleMutaion";
import { VariantTypeService } from "@/services/product/variantType.service";


export const useVariantType = {
    variantTypeKey: {
        all: ["variantType"],
        list: (filter: VariantTypeFilter) => [...useVariantType.variantTypeKey.all, "list", { ...filter }],
        detail: (id: number) => [...useVariantType.variantTypeKey.all, "detail", id]
    },
    useGetAllVariantType: (filter: VariantTypeFilter = { page: 1, size: 10 }) => {
        return useQuery({
            queryKey: useVariantType.variantTypeKey.list(filter),
            queryFn: () => VariantTypeService.findAll(filter),
            retry: 1
        });
    },
    useCreateVariantType: () => {
        const queryClient = useQueryClient();
        return useMutation({
            mutationFn: (req: VariantTypeRequest) => VariantTypeService.create(req),
            ...mutationHandler({
                queryClient,
                queryKey: useVariantType.variantTypeKey.all
            })
        });
    },
    useUpdateVariantType: () => {
        const queryClient = useQueryClient();
        return useMutation({
            mutationFn: ({ id, req }: { id: number; req: VariantTypeRequest }) => VariantTypeService.update(id, req),
            ...mutationHandler({
                queryClient,
                queryKey: useVariantType.variantTypeKey.all
            })
        });
    },
    useDeleteVariantType: () => {
        const queryClient = useQueryClient();
        return useMutation({
            mutationFn: ({ id }: { id: number }) => VariantTypeService.delete(id),
            ...mutationHandler({
                queryClient,
                queryKey: useVariantType.variantTypeKey.all
            })
        });
    }
}