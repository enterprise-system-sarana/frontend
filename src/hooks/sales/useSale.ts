import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { mutationHandler } from "../handleMutaion";
import type { SaleFilter, SaleRequest } from "@/types/sales/Sale";
<<<<<<< HEAD
import { salesService } from "@/services/sales/sales.service";
=======
import { saleService } from "@/services/sales/sale.service";
>>>>>>> 90b286420616ada08320bb9e61be3df239118415

export const useSale = {
  keys: {
    all: ["sales"] as const,
<<<<<<< HEAD
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
=======
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
>>>>>>> 90b286420616ada08320bb9e61be3df239118415
  },
};