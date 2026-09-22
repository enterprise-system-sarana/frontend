
import api from "@/services/lib/axios"
import type { PaymentFilter, PaymentRequest } from "@/types/sales/Payment";


export const PaymentService = {
    findAll: async (filter: PaymentFilter) => {
        return api.get("/payments", { params: filter }).then((res) => res.data)
    },
    findById: async (id: number) => {
        return api.get(`/payments/${id}`).then((res) => res.data);
    },
    create: async (request: PaymentRequest) => {
        return api.post("/payments", request).then((res) => res.data);
    },
    update: async (id: number, request: PaymentRequest) => {
        return api.put(`/payments/${id}`, request).then((res) => res.data);
    },
    delete: async (id: number) => {
        return api.delete(`/payments/${id}`).then((res) => res.data)
    }
}