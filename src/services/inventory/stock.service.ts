import type { StockFilter } from "@/types/inventory/Stock";
import api from "../lib/axios";

export const StockService = {
    findAll(filter: StockFilter) {
        return api.get("/stock", { params: filter }).then((res) => res.data);
    },
};