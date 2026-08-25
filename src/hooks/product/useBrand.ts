import type { BrandFilter, BrandRequest } from "@/types/product/Brand";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { mutationHandler } from "../handleMutaion";
import { BrandService } from "@/services/product/brand.service";


export const useBrand = {
    brandkey: {
        all: ["brand"],
        list: (filter: BrandFilter) => [...useBrand.brandkey.all, "list", { ...filter }],
        detail: (id: number) => [...useBrand.brandkey.all, "detail", id]
    },
    useGetAllBrand: (filter: BrandFilter = { page: 1, size: 10 }) => {
        return useQuery({
            queryKey: useBrand.brandkey.list(filter),
            queryFn: () => BrandService.findAll(filter),
            retry: 1
        });
    },
    useCreateBrand: () => {
        const queryClient = useQueryClient();
        return useMutation({
            mutationFn: (req: BrandRequest) => BrandService.create(req),
            ...mutationHandler({
                queryClient,
                queryKey: useBrand.brandkey.all
            })
        });
    },
    useUpdateBrand: () => {
        const queryClient = useQueryClient();
        return useMutation({
            mutationFn: ({ id, req }: { id: number; req: BrandRequest }) => BrandService.update(id, req),
            ...mutationHandler({
                queryClient,
                queryKey: useBrand.brandkey.all
            })
        });
    },
    useDeleteBrand: () => {
        const queryClient = useQueryClient();
        return useMutation({
            mutationFn: ({ id }: { id: number }) => BrandService.delete(id),
            ...mutationHandler({
                queryClient,
                queryKey: useBrand.brandkey.all
            })
        });
    }
}