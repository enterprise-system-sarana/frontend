import type { SaleFilter, SaleRequest } from "@/types/sales/Sale";
import api from "@/services/lib/axios"


export const salesService = {
    findAll(filter: SaleFilter) {
        return api.get("/sales", { params: filter }).then((res) => res.data);
    },
    findById(id: number) {
        return api.get(`/sales/${id}`).then((res) => res.data);
    },
    create(request: SaleRequest) {
        return api.post("/sales", request).then((res) => res.data);
    },
    update(id: number, request: SaleRequest) {
        return api.put(`/sales/${id}`, request).then((res) => res.data);
    },
    delete(id: number) {
        return api.delete(`/sales/${id}`).then((res) => res.data);
    },
    complete(id: number) {
        return api.patch(`/sales/${id}/complete`).then((res) => res.data);
    },
    cancel(id: number) {
        return api.patch(`/sales/${id}/cancel`).then((res) => res.data);
    },
    returnSale(id: number) {
        return api.patch(`/sales/${id}/return`).then((res) => res.data);
    }
};