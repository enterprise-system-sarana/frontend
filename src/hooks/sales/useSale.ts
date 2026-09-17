import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { mutationHandler } from "../handleMutaion";
import type { SaleFilter, SaleRequest } from "@/types/sales/Sale";
import { salesService } from "@/services/sales/sales.service";

export const useSale = {
  keys: {
    all: ["sales"] as const,
    list: (filter: SaleFilter) =>
      [...useSale.keys.all, "list", { ...filter }] as const,
    detail: (id: number) => [...useSale.keys.all, "detail", id] as const,
  },

  GetAll: (filter: SaleFilter = { page: 1, size: 10 }) => {
    return useQuery({
      queryKey: useSale.keys.list(filter),
      queryFn: () => salesService.findAll(filter),
      retry: 1,
    });
  },

  GetSaleById: (id: number, options?: { enabled?: boolean }) => {
    return useQuery({
      queryKey: useSale.keys.detail(id),
      queryFn: () => salesService.findById(id),
      ...options,
      retry: 1,
    });
  },

  Create: () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: salesService.create,
      ...mutationHandler({
        queryClient,
        queryKey: useSale.keys.all,
      }),
    });
  },

  Update: () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: ({ id, request }: { id: number; request: SaleRequest }) =>
        salesService.update(id, request),
      ...mutationHandler({
        queryClient,
        queryKey: useSale.keys.all,
      }),
    });
  },

  Complete: () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: salesService.complete,
      ...mutationHandler({
        queryClient,
        queryKey: useSale.keys.all,
      }),
    });
  },

  Cancel: () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: salesService.cancel,
      ...mutationHandler({
        queryClient,
        queryKey: useSale.keys.all,
      }),
    });
  },

  ReturnSale: () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: salesService.returnSale,
      ...mutationHandler({
        queryClient,
        queryKey: useSale.keys.all,
      }),
    });
  },

  Delete: () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: salesService.delete,
      ...mutationHandler({
        queryClient,
        queryKey: useSale.keys.all,
      }),
    });
  },
};