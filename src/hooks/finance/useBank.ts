import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { mutationHandler } from "../handleMutaion";
import { bankService } from "@/services/finance/bank.service";
import type { BankFilter, BankRequest } from "@/types/finance/Bank";


export const useBank = {
    bankkey: {
        all: ["bank"],
        list: (filter: BankFilter) => [...useBank.bankkey.all, "list", { ...filter }],
        detail: (id: number) => [...useBank.bankkey.all, "detail", id]
    },
    useGetAllBank: (filter: BankFilter = { page: 1, size: 10 }) => {
        return useQuery({
            queryKey: useBank.bankkey.list(filter),
            queryFn: () => bankService.findAll(filter),
            retry: 1
        });
    },
    useCreateBank: () => {
        const queryClient = useQueryClient();
        return useMutation({
            mutationFn: (req: BankRequest) => bankService.create(req),
            ...mutationHandler({
                queryClient,
                queryKey: useBank.bankkey.all
            })
        });
    },
    useUpdateBank: () => {
        const queryClient = useQueryClient();
        return useMutation({
            mutationFn: ({ id, req }: { id: number; req: BankRequest }) => bankService.update(id, req),
            ...mutationHandler({
                queryClient,
                queryKey: useBank.bankkey.all
            })
        });
    },
    useDeleteBank: () => {
        const queryClient = useQueryClient();
        return useMutation({
            mutationFn: ({ id }: { id: number }) => bankService.delete(id),
            ...mutationHandler({
                queryClient,
                queryKey: useBank.bankkey.all
            })
        });
    }
}