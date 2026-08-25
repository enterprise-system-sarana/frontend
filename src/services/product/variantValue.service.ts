
import api from "@/services/lib/axios"
import type { VariantValueFilter, VariantValueRequest } from "@/types/product/VariantValue";


export const VariantValueService = {
    findAll: async (filter: VariantValueFilter) => {
        return api.get("/variant-values", { params: filter }).then((res) => res.data)
    },
    create: async (request: VariantValueRequest) => {
        return api.post("/variant-values", request).then((res) => res.data);

    },
    update: async (id: number, request: VariantValueRequest) => {
        return api.put(`/variant-values/${id}`, request).then((res) => res.data);

    },
    delete: async (id: number) => {
        return api.delete(`/variant-values/${id}`).then((res) => res.data)
    }
}