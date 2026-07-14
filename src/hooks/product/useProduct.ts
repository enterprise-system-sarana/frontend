import type { ProductFilter, ProductRequest } from "@/types/product/Product";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { mutationHandler } from "../handleMutaion";
import { productService } from "@/services/product/product..service";

export const useProduct = {
    keys: {
        all: ["product"],
        list: (filter: ProductFilter) => [...useProduct.keys.all, 'list', { ...filter }],
        detail: (id: number) => [...useProduct.keys.all, "detail", id]
    },
    useGetAllProduct: (filter: ProductFilter) => {
        return useQuery({
            queryKey: useProduct.keys.list(filter),
            queryFn: () => productService.findAll(filter),
            retry: 1
        })
    },
    useGetProductById: (id: number, enabled: boolean = true) => {
        return useQuery({
            queryKey: useProduct.keys.detail(id),
            queryFn: () => productService.findById(id),
            enabled: enabled && !!id,
            retry: 1
        })
    },
    useCreateProduct: () => {
        const queryClient = useQueryClient();
        return useMutation({
            mutationFn: (req: ProductRequest) => productService.create(req),
            ...mutationHandler({
                queryClient,
                queryKey: useProduct.keys.all
            })
        })
    },
    useUpdateProduct: () => {
        const queryClient = useQueryClient();
        return useMutation({
            mutationFn: ({ id, req }: { id: number, req: ProductRequest }) => productService.update(id, req),
            ...mutationHandler({
                queryClient,
                queryKey: useProduct.keys.all
            })
        })
    },
    useDeleteProduct: () => {
        const queryClient = useQueryClient();
        return useMutation({
            mutationFn: (id: number) => productService.delete(id),
            ...mutationHandler({
                queryClient,
                queryKey: useProduct.keys.all
            })
        })
    }
}