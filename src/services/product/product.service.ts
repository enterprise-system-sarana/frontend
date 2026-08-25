
import api from "@/services/lib/axios"
import type { ProductFilter, ProductRequest } from "@/types/product/Product";


export const ProductService = {
    findAll: async (filter: ProductFilter) => {
        return api.get("/product", { params: filter }).then((res) => res.data)
    },
    findById: async (id: number) => {
        return api.get(`/product/${id}`).then((res) => res.data);
    },
    create: async (request: ProductRequest) => {
        return api.post("/product", request).then((res) => res.data);
    },
    update: async (id: number, request: ProductRequest) => {
        return api.put(`/product/${id}`, request).then((res) => res.data);
    },
    delete: async (id: number) => {
        return api.delete(`/product/${id}`).then((res) => res.data)
    }
}