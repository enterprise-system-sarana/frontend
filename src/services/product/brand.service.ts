
import api from "@/services/lib/axios"
import type { BrandFilter, BrandRequest } from "@/types/product/Brand";


export const BrandService = {
  findAll: async (filter: BrandFilter) => {
    return api.get("/brand", { params: filter }).then((res) => res.data)
  },
  create: async (request: BrandRequest) => {
    return api.post("/brand", request).then((res) => res.data);

  },
  update: async (id: number, request: BrandRequest) => {
    return api.put(`/brand/${id}`, request).then((res) => res.data);

  },
  delete: async (id: number) => {
    return api.delete(`/brand/${id}`).then((res) => res.data)
  }
}