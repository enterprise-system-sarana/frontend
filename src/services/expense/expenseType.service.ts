
import api from "@/services/lib/axios"
import type { ExpenseTypeFilter, ExpenseTypeRequest } from "@/types/expense/expense.type";


export const ExpenseTypeService = {
    findAll: async (filter: ExpenseTypeFilter) => {
        return api.get("/expense-types", { params: filter }).then((res) => res.data)
    },
    create: async (request: ExpenseTypeRequest) => {
        return api.post("/expense-types", request).then((res) => res.data);

    },
    update: async (id: number, request: ExpenseTypeRequest) => {
        return api.put(`/expense-types/${id}`, request).then((res) => res.data);

    },
    delete: async (id: number) => {
        return api.delete(`/expense-types/${id}`).then((res) => res.data)
    }
}