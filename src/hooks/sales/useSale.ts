import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { mutationHandler } from "../handleMutaion";
import type { SaleFilter, SaleRequest } from "@/types/sales/Sale";
import { saleService } from "@/services/sales/sale.service";

export const useSale = {
  keys: {
    all: ["sales"] as const,
    list: (filter: SaleFilter) => ["sales", "list", { ...filter }] as const,
    detail: (id: number) => ["sales", "detail", id] as const,
  },
  getAll: (filter: SaleFilter = { page: 1, size: 10 }) => useQuery({ queryKey: useSale.keys.list(filter), queryFn: () => saleService.findAll(filter), retry: 1 }),
  getById: (id: number, enabled: boolean) => useQuery({ queryKey: useSale.keys.detail(id), queryFn: () => saleService.findById(id), enabled, retry: 1 }),
  create: () => {
    const queryClient = useQueryClient();
    return useMutation({ mutationFn: saleService.create, ...mutationHandler({ queryClient, queryKey: useSale.keys.all }) });
  },
  update: () => {
    const queryClient = useQueryClient();
    return useMutation({ mutationFn: ({ id, request }: { id: number; request: SaleRequest }) => saleService.update(id, request), ...mutationHandler({ queryClient, queryKey: useSale.keys.all }) });
  },
  remove: () => {
    const queryClient = useQueryClient();
    return useMutation({ mutationFn: saleService.delete, ...mutationHandler({ queryClient, queryKey: useSale.keys.all }) });
  },
};