import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { mutationHandler } from "../handleMutaion";
import type { ExpenseFilter, ExpenseRequest } from "@/types/expense/expense";
import { ExpenseService } from "@/services/expense/expense.service";


export const useExpense = {
    expensekey: {
        all: ["expense"],
        list: (filter: ExpenseFilter) => [...useExpense.expensekey.all, "list", { ...filter }],
        detail: (id: number) => [...useExpense.expensekey.all, "detail", id]
    },
    useGetAllExpense: (filter: ExpenseFilter) => {
        return useQuery({
            queryKey: useExpense.expensekey.list(filter),
            queryFn: () => ExpenseService.findAll(filter),
            retry: 1
        });
    },
    useCreateExpense: () => {
        const queryClient = useQueryClient();
        return useMutation({
            mutationFn: (req: ExpenseRequest) => ExpenseService.create(req),
            ...mutationHandler({
                queryClient,
                queryKey: useExpense.expensekey.all
            })
        });
    },
    useUpdateExpense: () => {
        const queryClient = useQueryClient();
        return useMutation({
            mutationFn: ({ id, req }: { id: number; req: ExpenseRequest }) => ExpenseService.update(id, req),
            ...mutationHandler({
                queryClient,
                queryKey: useExpense.expensekey.all
            })
        });
    },
    useDeleteExpense: () => {
        const queryClient = useQueryClient();
        return useMutation({
            mutationFn: ({ id }: { id: number }) => ExpenseService.delete(id),
            ...mutationHandler({
                queryClient,
                queryKey: useExpense.expensekey.all
            })
        });
    }
}