import type { CategoryFilter, CategoryRequest } from "@/types/product/Category"
import api from "@/services/lib/axios"


export const CategoryService = {
  findAll: async (filter: CategoryFilter) => {
    return api.get("/category", { params: filter }).then((res) => res.data)
  },
  create: async (request: CategoryRequest) => {
    return api.post("/category", request).then((res) => res.data);

  },
  update: async (id: number, request: CategoryRequest) => {
    return api.put(`/category/${id}`, request).then((res) => res.data);

  },
  delete: async (id: number) => {
    return api.delete(`/category/${id}`).then((res) => res.data)
  }
}