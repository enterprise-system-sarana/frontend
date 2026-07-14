import type { StoreFilter, StoreRequest } from "@/types/inventory/Store";
import api from "../lib/axios";

export const storeService = {
  findAll(filter: StoreFilter) {
    return api.get("/stores", { params: filter }).then((res) => res.data);
  },

  create(request: StoreRequest) {
    return api.post("/stores", request).then((res) => res.data);
  },

  update(id: number, request: StoreRequest) {
    return api.put(`/stores/${id}`, request).then((res) => res.data);
  },

  delete(id: number) {
    return api.delete(`/stores/${id}`).then((res) => res.data);
  },
};