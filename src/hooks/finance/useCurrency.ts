import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { CurrencyRequest } from "@/types/finance/Currency";
import { toast } from "sonner";
import { currencyService } from "@/services/finance/currency.service";

export const currencyKeys = {
    all: ["currencies"],
    list: (filter: any) => [...currencyKeys.all, "list", { ...filter }],
    details: (id: number) => [...currencyKeys.all, "detail", id],
};

export const useCurrency = (filter: any) => {
    return useQuery({
        queryKey: currencyKeys.list(filter),
        queryFn: () => currencyService.findAll(filter),
    });
};

export const useCreateCurrency = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: currencyService.create,
        onSuccess: (res: any) => {
            queryClient.invalidateQueries({ queryKey: currencyKeys.all });
            toast.success(res?.message || "Currency created successfully");
        },
        onError: (error: any) => {
            toast.error(error?.message || "Failed to create currency");
        },
    });
};

export const useUpdateCurrency = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, request }: { id: number; request: CurrencyRequest }) => currencyService.update(id, request),
        onSuccess: (res: any) => {
            queryClient.invalidateQueries({ queryKey: currencyKeys.all });
            toast.success(res?.message || "Currency updated successfully");
        },
        onError: (error: any) => {
            toast.error(error?.message || "Failed to update currency");
        },
    });
};

export const useDeleteCurrency = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: currencyService.delete,
        onSuccess: (res: any) => {
            queryClient.invalidateQueries({ queryKey: currencyKeys.all });
            toast.success(res?.message || "Currency deleted successfully");
        },
        onError: (error: any) => {
            toast.error(error?.message || "Failed to delete currency");
        },
    });
};
