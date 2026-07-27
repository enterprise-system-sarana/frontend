import { purchaseService } from "@/services/purchases/purchase.service";
import type {
  PurchaseFilter,
  PurchaseRequest,
} from "@/types/purchases/Purchase";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { mutationHandler } from "../handleMutaion";

export const usePurchase = {
  keys: {
    all: ["purchases"] as const,
    list: (filter: PurchaseFilter) =>
      [...usePurchase.keys.all, "list", { ...filter }] as const,
    detail: (id: number) => [...usePurchase.keys.all, "detail", id] as const,
  },

  useGetAllPurchase: (filter: PurchaseFilter = { page: 1, size: 10 }) => {
    return useQuery({
      queryKey: usePurchase.keys.list(filter),
      queryFn: () => purchaseService.findAll(filter),
      retry: 1,
    });
  },

  useCreatePurchase: () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: purchaseService.create,
      ...mutationHandler({
        queryClient,
        queryKey: usePurchase.keys.all,
      }),
    });
  },

  useUpdatePurchase: () => {
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
  useGetPurchaseById: (id: number) => {
    return useQuery({
      queryKey: usePurchase.keys.detail(id),
      queryFn: () => purchaseService.findById(id),
      enabled: !!id && !isNaN(id),
      retry: 1,
    });
  },

  useDeletePurchase: () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: purchaseService.delete,
      ...mutationHandler({
        queryClient,
        queryKey: usePurchase.keys.all,
      }),
    });
  },

  useApprovePurchase: () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: purchaseService.approve,
      ...mutationHandler({
        queryClient,
        queryKey: usePurchase.keys.all,
      }),
    });
  },

  useCompletePurchase: () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: purchaseService.complete,
      ...mutationHandler({
        queryClient,
        queryKey: usePurchase.keys.all,
      }),
    });
  },
};
