import type { SaleFilter, SaleRequest } from "@/types/sales/Sale";
import api from "../lib/axios";

export const saleService = {
  findAll: (filter: SaleFilter) => api.get("/sales", { params: filter }).then((res) => res.data),
  findById: (id: number) => api.get(`/sales/${id}`).then((res) => res.data),
  create: (request: SaleRequest) => api.post("/sales", request).then((res) => res.data),
  update: (id: number, request: SaleRequest) => api.put(`/sales/${id}`, request).then((res) => res.data),
  delete: (id: number) => api.delete(`/sales/${id}`).then((res) => res.data),
};