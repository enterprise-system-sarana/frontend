import type { UnitFilter, UnitRequest } from "@/types/product/Unit";
import api from "../lib/axios";

export const unitService = {
  findAll: async (filter: UnitFilter) => {
    return api.get("/unit", { params: filter }).then(res => res.data)
  },
  create: async (req: UnitRequest) => {
    return api.post("/unit", req).then(res => res.data)
  },
  update: async (id: number, req: UnitRequest) => {
    return api.put(`/unit/${id}`, req).then(res => res.data)
  },
  delete: async (id: number) => {
    return api.delete(`/unit/${id}`).then(res => res.data)
  },
}