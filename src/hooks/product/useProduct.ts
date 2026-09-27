import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { mutationHandler } from "../handleMutaion";
import type { ProductFilter, ProductRequest } from "@/types/product/Product";
import { ProductService } from "@/services/product/product.service";


export const useProduct = {
    keys: {
        all: ["product"],
        list: (filter: ProductFilter) => [...useProduct.keys.all, "list", { ...filter }],
        detail: (id: number) => [...useProduct.keys.all, "detail", id]
    },
    useGetAllProduct: (filter: ProductFilter = { page: 1, size: 10 }, options?: any) => {
        return useQuery({
            queryKey: useProduct.keys.list(filter),
            queryFn: () => ProductService.findAll(filter),
            retry: 1,
            ...options,
        });
    },
    GetAllProduct: (filter: ProductFilter = { page: 1, size: 10 }, options?: any) => {
        return useQuery({
            queryKey: useProduct.keys.list(filter),
            queryFn: () => ProductService.findAll(filter),
            retry: 1,
            ...options,
        });
    },
    useGetProductById: (id: number, enabled: boolean = true) => {
        return useQuery({
            queryKey: useProduct.keys.detail(id),
            queryFn: () => ProductService.findById(id),
            enabled: enabled && !isNaN(id) && id > 0,
            retry: 1
        });
    },
    useCreateProduct: () => {
        const queryClient = useQueryClient();
        return useMutation({
            mutationFn: (req: ProductRequest) => ProductService.create(req),
            ...mutationHandler({
                queryClient,
                queryKey: useProduct.keys.all
            })
        });
    },
    CreateModel: () => {
        const queryClient = useQueryClient();
        return useMutation({
            mutationFn: (req: ProductRequest) => ProductService.create(req),
            ...mutationHandler({
                queryClient,
                queryKey: useProduct.keys.all
            })
        });
    },
    useUpdateProduct: () => {
        const queryClient = useQueryClient();
        return useMutation({
            mutationFn: ({ id, req }: { id: number; req: ProductRequest }) => ProductService.update(id, req),
            ...mutationHandler({
                queryClient,
                queryKey: useProduct.keys.all
            })
        });
    },
    UpdateModel: () => {
        const queryClient = useQueryClient();
        return useMutation({
            mutationFn: ({ id, req }: { id: number; req: ProductRequest }) => ProductService.update(id, req),
            ...mutationHandler({
                queryClient,
                queryKey: useProduct.keys.all
            })
        });
    },
    useDeleteProduct: () => {
        const queryClient = useQueryClient();
        return useMutation({
            mutationFn: ({ id }: { id: number }) => ProductService.delete(id),
            ...mutationHandler({
                queryClient,
                queryKey: useProduct.keys.all
            })
        });
    },
    DeleteModel: () => {
        const queryClient = useQueryClient();
        return useMutation({
            mutationFn: ({ id }: { id: number }) => ProductService.delete(id),
            ...mutationHandler({
                queryClient,
                queryKey: useProduct.keys.all
            })
        });
    }
}