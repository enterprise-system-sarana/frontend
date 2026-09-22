import type { PurchaseFilter, PurchaseRequest } from "@/types/purchases/Purchase";
import api from "../lib/axios";


export const purchaseService = {
    findAll(filter: PurchaseFilter) {
        return api.get("/purchases", { params: filter }).then((res) => res.data);
    },
    findById(id: number) {
        return api.get(`/purchases/${id}`).then((res) => res.data);
    },
    create (request: PurchaseRequest) {
        return api.post("/purchases", request).then((res) => res.data);
    },
    update(id: number, request: PurchaseRequest) {
        return api.put(`/purchases/${id}`, request).then((res) => res.data);
    },
    delete(id: number) {
        return api.delete(`/purchases/${id}`).then((res) => res.data);
    },
    approve(id: number) {
        return api.patch(`/purchases/${id}/approve`).then((res) => res.data);
    },
    complete(id: number) {
        return api.patch(`/purchases/${id}/complete`).then((res) => res.data);
    },
    generateInvoice(id: number) {
        return api.get(`/purchases/${id}/invoice`).then((res) => res.data);
    }

}