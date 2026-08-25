import type { BankFilter, BankRequest } from "@/types/finance/Bank";
import api from "../lib/axios";

export const bankService = {
    findAll(filter: BankFilter) {
        return api.get("/bank", { params: filter }).then((res) => res.data);
    },

    create(request: BankRequest) {
        return api.post("/bank", request).then((res) => res.data);
    },

    update(id: number, request: BankRequest) {
        return api.put(`/bank/${id}`, request).then((res) => res.data);
    },

    delete(id: number) {
        return api.delete(`/bank/${id}`).then((res) => res.data);
    }
};
