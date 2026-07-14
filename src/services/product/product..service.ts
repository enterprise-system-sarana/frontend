import type { ProductFilter, ProductRequest } from "@/types/product/Product";
import api from "../lib/axios";

export const productService = {
    findAll: async (filter: ProductFilter) => {
        return api.get("/product", { params: filter }).then((res) => res.data)
    },
    findById: async (id: number) => {
        return api.get(`/product/${id}`).then(res => res.data)
    },
    create: async (req: ProductRequest) => {
        return api.post("/product", req,).then(res => res.data)
    },
    update: async (id: number, req: ProductRequest) => {
        return api.put(`/product/${id}`, req).then(res => res.data)
    },
    delete: async (id: number) => {
        return api.delete(`/product/${id}`).then(res => res.data)
    }
}


