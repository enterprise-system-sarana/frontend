import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { mutationHandler } from "../handleMutaion";
import type {
  PurchaseFilter,
  PurchaseRequest,
} from "@/types/purchases/Purchase";
import { purchaseService } from "@/services/purchases/purchase.service";

export const usePurchase = {
  keys: {
    all: ["purchases"] as const,
    list: (filter: PurchaseFilter) =>
      [...usePurchase.keys.all, "list", { ...filter }] as const,
    detail: (id: number) => [...usePurchase.keys.all, "detail", id] as const,
  },

  GetAll: (filter: PurchaseFilter = { page: 1, size: 10 }) => {
    return useQuery({
      queryKey: usePurchase.keys.list(filter),
      queryFn: () => purchaseService.findAll(filter),
      retry: 1,
    });
  },

  Complete: () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: purchaseService.complete,
      ...mutationHandler({
        queryClient,
        queryKey: usePurchase.keys.all,
      }),
    });
  },

  Create: () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: purchaseService.create,
      ...mutationHandler({
        queryClient,
        queryKey: usePurchase.keys.all,
      }),
    });
  },

  GetPurchaseById: (id: number, options?: { enabled?: boolean }) => {
    return useQuery({
      queryKey: usePurchase.keys.detail(id),
      queryFn: () => purchaseService.findById(id),
      ...options,
      retry: 1,
    });
  },
  Update: () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: ({ id, request }: { id: number; request: PurchaseRequest }) =>
        purchaseService.update(id, request),
      ...mutationHandler({
        queryClient,
        queryKey: usePurchase.keys.all,
      }),
    });
  },

  Delete: () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: purchaseService.delete,
      ...mutationHandler({
        queryClient,
        queryKey: usePurchase.keys.all,
      }),
    });
  },
};
