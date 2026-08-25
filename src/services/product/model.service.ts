
import api from "@/services/lib/axios"
import type { ModelFilter, ModelRequest } from "@/types/product/Model";


export const ModelService = {
    findAll: async (filter: ModelFilter) => {
        return api.get("/model", { params: filter }).then((res) => res.data)
    },
    create: async (request: ModelRequest) => {
        return api.post("/model", request).then((res) => res.data);

    },
    update: async (id: number, request: ModelRequest) => {
        return api.put(`/model/${id}`, request).then((res) => res.data);

    },
    delete: async (id: number) => {
        return api.delete(`/model/${id}`).then((res) => res.data)
    }
}