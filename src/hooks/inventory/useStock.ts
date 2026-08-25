import type { StockFilter } from "@/types/inventory/Stock";
import { StockService } from "@/services/inventory/stock.service";
import { useQuery } from "@tanstack/react-query";

export const useStock = {
    keys: {
        all: ["stocks"] as const,
        list: (filter: StockFilter) => [...useStock.keys.all, "list", { ...filter }] as const,
    },
    useGetAllStock: (filter: StockFilter = { page: 1, size: 10 }) => {
        return useQuery({
            queryKey: useStock.keys.list(filter),
            queryFn: () => StockService.findAll(filter),
            retry: 1,
        });
    },
};
