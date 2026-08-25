import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { mutationHandler } from "../handleMutaion";
import { ModelService } from "@/services/product/model.service";
import type { ModelFilter, ModelRequest, } from "@/types/product/Model";


export const useModel = {
    keys: {
        all: ["model"],
        list: (filter: ModelFilter) => [...useModel.keys.all, "list", { ...filter }],
        detail: (id: number) => [...useModel.keys.all, "detail", id]
    },
    GetAllModel: (filter: ModelFilter = { page: 1, size: 10 }) => {
        return useQuery({
            queryKey: useModel.keys.list(filter),
            queryFn: () => ModelService.findAll(filter),
            retry: 1
        });
    },
    CreateModel: () => {
        const queryClient = useQueryClient();
        return useMutation({
            mutationFn: (req: ModelRequest) => ModelService.create(req),
            ...mutationHandler({
                queryClient,
                queryKey: useModel.keys.all
            })
        });
    },
    UpdateModel: () => {
        const queryClient = useQueryClient();
        return useMutation({
            mutationFn: ({ id, req }: { id: number; req: ModelRequest }) => ModelService.update(id, req),
            ...mutationHandler({
                queryClient,
                queryKey: useModel.keys.all
            })
        });
    },
    DeleteModel: () => {
        const queryClient = useQueryClient();
        return useMutation({
            mutationFn: ({ id }: { id: number }) => ModelService.delete(id),
            ...mutationHandler({
                queryClient,
                queryKey: useModel.keys.all
            })
        });
    }
}