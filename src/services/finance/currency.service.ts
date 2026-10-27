import type { CurrencyFilter, CurrencyRequest } from "@/types/finance/Currency";
import api from "../lib/axios";

export const currencyService = {
    findAll(filter: CurrencyFilter) {
        return api.get("/currency", { params: filter }).then((res) => res.data);
    },

    create(request: CurrencyRequest) {
        return api.post("/currency", request).then((res) => res.data);
    },

    update(id: number, request: CurrencyRequest) {
        return api.put(`/currency/${id}`, request).then((res) => res.data);
    },

    delete(id: number) {
        return api.delete(`/currency/${id}`).then((res) => res.data);
    }
};
