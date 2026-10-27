import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { currencyService } from "@/services/finance/currency.service";
import type { CurrencyFilter, CurrencyRequest } from "@/types/finance/Currency";
import { mutationHandler } from "../handleMutaion";

export const useCurrency = {
    currency: {
        all: ["currency"],
        list: (filter: CurrencyFilter) => [...useCurrency.currency.all, "list", { ...filter }],
        detail: (id: number) => [...useCurrency.currency.all, "detail", id]
    },
    GetAllCurrency: (filter: CurrencyFilter = { page: 1, size: 10 }) => {
        return useQuery({

            queryKey: useCurrency.currency.list(filter),
            queryFn: () => currencyService.findAll(filter),
            retry: 1
        });
    },

    CreateCurrency: () => {
        const queryClient = useQueryClient();
        return useMutation({
            mutationFn: (req: CurrencyRequest) => currencyService.create(req),
            ...mutationHandler({
                queryClient,
                queryKey: useCurrency.currency.all
            })
        });
    },
    UpdateCurrency: () => {
        const queryClient = useQueryClient();
        return useMutation({
            mutationFn: ({ id, req }: { id: number; req: CurrencyRequest }) => currencyService.update(id, req),
            ...mutationHandler({
                queryClient,
                queryKey: useCurrency.currency.all
            })
        });
    },
    DeleteCurrency: () => {
        const queryClient = useQueryClient();
        return useMutation({
            mutationFn: ({ id }: { id: number }) => currencyService.delete(id),
            ...mutationHandler({
                queryClient,
                queryKey: useCurrency.currency.all
            })
        });
    }
}