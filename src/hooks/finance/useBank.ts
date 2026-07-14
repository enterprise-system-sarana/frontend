import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { BankRequest } from "@/types/finance/Bank";
import { toast } from "sonner";
import { bankService } from "@/services/finance/bank.service";

export const bankKeys = {
    all: ["banks"],
    list: (filter: any) => [...bankKeys.all, "list", { ...filter }],
    details: (id: number) => [...bankKeys.all, "detail", id],
};

export const useBank = (filter: any) => {
    return useQuery({
        queryKey: bankKeys.list(filter),
        queryFn: () => bankService.findAll(filter),
    });
};

export const useCreateBank = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: bankService.create,
        onSuccess: (res: any) => {
            queryClient.invalidateQueries({ queryKey: bankKeys.all });
            toast.success(res?.message || "Bank created successfully");
        },
        onError: (error: any) => {
            toast.error(error?.message || "Failed to create bank");
        },
    });
};

export const useUpdateBank = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, request }: { id: number; request: BankRequest }) => bankService.update(id, request),
        onSuccess: (res: any) => {
            queryClient.invalidateQueries({ queryKey: bankKeys.all });
            toast.success(res?.message || "Bank updated successfully");
        },
        onError: (error: any) => {
            toast.error(error?.message || "Failed to update bank");
        },
    });
};

export const useDeleteBank = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: bankService.delete,
        onSuccess: (res: any) => {
            queryClient.invalidateQueries({ queryKey: bankKeys.all });
            toast.success(res?.message || "Bank deleted successfully");
        },
        onError: (error: any) => {
            toast.error(error?.message || "Failed to delete bank");
        },
    });
};
