import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { mutationHandler } from "../handleMutaion";
import type { ExpenseTypeFilter, ExpenseTypeRequest } from "@/types/expense/expense.type";
import { ExpenseTypeService } from "@/services/expense/expenseType.service";


export const useExpenseType = {
    expensekey: {
        all: ["expenseType"],
        list: (filter: ExpenseTypeFilter) => [...useExpenseType.expensekey.all, "list", { ...filter }],
        detail: (id: number) => [...useExpenseType.expensekey.all, "detail", id]
    },
    useGetAllExpenseType: (filter: ExpenseTypeFilter ) => {
        return useQuery({
            queryKey: useExpenseType.expensekey.list(filter),
            queryFn: () => ExpenseTypeService.findAll(filter),
            retry: 1
        });
    },
    useCreateExpenseType: () => {
        const queryClient = useQueryClient();
        return useMutation({
            mutationFn: (req: ExpenseTypeRequest) => ExpenseTypeService.create(req),
            ...mutationHandler({
                queryClient,
                queryKey: useExpenseType.expensekey.all
            })
        });
    },
    useUpdateExpenseType: () => {
        const queryClient = useQueryClient();
        return useMutation({
            mutationFn: ({ id, req }: { id: number; req: ExpenseTypeRequest }) => ExpenseTypeService.update(id, req),
            ...mutationHandler({
                queryClient,
                queryKey: useExpenseType.expensekey.all
            })
        });
    },
    useDeleteExpenseType: () => {
        const queryClient = useQueryClient();
        return useMutation({
            mutationFn: ({ id }: { id: number }) => ExpenseTypeService.delete(id),
            ...mutationHandler({
                queryClient,
                queryKey: useExpenseType.expensekey.all
            })
        });
    }
}