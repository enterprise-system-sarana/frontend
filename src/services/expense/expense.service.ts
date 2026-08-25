
import api from "@/services/lib/axios"
import type { ExpenseFilter, ExpenseRequest } from "@/types/expense/expense";


export const ExpenseService = {
    findAll: async (filter: ExpenseFilter) => {
        return api.get("/expenses", { params: filter }).then((res) => res.data)
    },
    create: async (request: ExpenseRequest) => {
        return api.post("/expenses", request).then((res) => res.data);

    },
    update: async (id: number, request: ExpenseRequest) => {
        return api.put(`/expenses/${id}`, request).then((res) => res.data);

    },
    delete: async (id: number) => {
        return api.delete(`/expenses/${id}`).then((res) => res.data)
    }
}