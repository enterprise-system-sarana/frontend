import type { StoreFilter, StoreRequest } from "@/types/inventory/Store";
import { storeService } from "@/services/inventory/store.service";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { mutationHandler } from "../handleMutaion";

export const useStore = {
  keys: {
    all: ["stores"] as const,
    list: (filter: StoreFilter) => [...useStore.keys.all, "list", { ...filter }] as const,
    detail: (id: number) => [...useStore.keys.all, "detail", id] as const,
  },
  useGetAllStore: (filter: StoreFilter = { page: 1, size: 10 }) => {
    return useQuery({
      queryKey: useStore.keys.list(filter),
      queryFn: () => storeService.findAll(filter),
      retry: 1,
    });
  },

  useGetStoreById: (id: number, enabled: boolean = true) => {
    return useQuery({
      queryKey: useStore.keys.detail(id),
      queryFn: () => storeService.findById(id),
      enabled: enabled && !isNaN(id) && id > 0,
      retry: 1,
    });
  },

  useCreateStore: () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: storeService.create,
      ...mutationHandler({
        queryClient,
        queryKey: useStore.keys.all,
      }),
    });
  },

  useUpdateStore: () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: ({ id, req, }: { id: number; req: StoreRequest; }) => storeService.update(id, req),
      ...mutationHandler({
        queryClient,
        queryKey: useStore.keys.all,
      }),
    });
  },

  useDeleteStore: () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: storeService.delete,
      ...mutationHandler({
        queryClient,
        queryKey: useStore.keys.all,
      }),
    });
  },
};