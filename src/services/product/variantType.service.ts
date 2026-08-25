
import api from "@/services/lib/axios"
import type { VariantTypeFilter, VariantTypeRequest } from "@/types/product/VariantType";


export const VariantTypeService = {
    findAll: async (filter: VariantTypeFilter) => {
        return api.get("/variant-types", { params: filter }).then((res) => res.data)
    },
    create: async (request: VariantTypeRequest) => {
        return api.post("/variant-types", request).then((res) => res.data);

    },
    update: async (id: number, request: VariantTypeRequest) => {
        return api.put(`/variant-types/${id}`, request).then((res) => res.data);

    },
    delete: async (id: number) => {
        return api.delete(`/variant-types/${id}`).then((res) => res.data)
    }
}