
import api from "@/services/lib/axios"
import type { CustomerFilter, CustomerRequest } from "@/types/sales/Customer";


export const CustomerService = {
    findAll: async (filter: CustomerFilter) => {
        return api.get("/customer", { params: filter }).then((res) => res.data)
    },
    create: async (request: CustomerRequest) => {
        return api.post("/customer", request).then((res) => res.data);

    },
    update: async (id: number, request: CustomerRequest) => {
        return api.put(`/customer/${id}`, request).then((res) => res.data);

    },
    delete: async (id: number) => {
        return api.delete(`/customer/${id}`).then((res) => res.data)
    }
}