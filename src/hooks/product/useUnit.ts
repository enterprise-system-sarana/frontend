import { unitService } from "@/services/product/unit.service";
import type { UnitFilter, UnitRequest } from "@/types/product/Unit";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { mutationHandler } from "../handleMutaion";

export const useUnit = {
    keyUnit: {
        key: ['unit'],
        list: (filter: UnitFilter) => [...useUnit.keyUnit.key, 'list', { ...filter }],
        detail: (id: number) => [...useUnit.keyUnit.key, 'detail', id],
    },
    useUnitGetAll: (filter: UnitFilter) => {
        return useQuery({
            queryKey: useUnit.keyUnit.list(filter),
            queryFn: () => unitService.findAll(filter),
            retry: 1
        })
    },
    useUnitCreate: () => {
        const queryClient = useQueryClient();
        return useMutation({
            mutationFn: (request: UnitRequest) => unitService.create(request),
            ...mutationHandler({
                queryClient,
                queryKey: useUnit.keyUnit.key,
            }),
        })
    },
    useUnitUpdate: () => {
        const queryClient = useQueryClient();
        return useMutation({
            mutationFn: ({ id, request }: { id: number; request: UnitRequest }) => unitService.update(id, request),
            ...mutationHandler({
                queryClient,
                queryKey: useUnit.keyUnit.key,
            }),
        })
    },
    useUnitDelete: () => {
        const queryClient = useQueryClient();
        return useMutation({
            mutationFn: (id: number) => unitService.delete(id),
            ...mutationHandler({
                queryClient,
                queryKey: useUnit.keyUnit.key,
            }),
        })
    },
}