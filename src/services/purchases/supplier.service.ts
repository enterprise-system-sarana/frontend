import type { SupplierFilter, SupplierRequest } from "@/types/purchases/Supplier";
import api from "../lib/axios";

export const supplierService = {
    findAll(filter: SupplierFilter) {
        return api.get("/suppliers", { params: filter }).then((res) => res.data);
    },

    create(request: SupplierRequest) {
        return api.post("/suppliers", request).then((res) => res.data);
    },

    update(id: number, request: SupplierRequest) {
        return api.put(`/suppliers/${id}`, request).then((res) => res.data);
    },

    delete(id: number) {
        return api.delete(`/suppliers/${id}`).then((res) => res.data);
    }
};