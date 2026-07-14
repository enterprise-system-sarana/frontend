import type { SupplierFilter, SupplierRequest } from "@/types/purchases/Supplier";
import { supplierService } from "@/services/purchases/supplier.service";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { mutationHandler } from "../handleMutaion";

export const useSupplier = {
  keys: {
    all: ["suppliers"] as const,
    list: (filter: SupplierFilter) => [...useSupplier.keys.all, "list", { ...filter }] as const,
    detail: (id: number) => [...useSupplier.keys.all, "detail", id] as const,
  },

  useGetAllSupplier: (filter: SupplierFilter = { page: 1, size: 10 }) => {
    return useQuery({
      queryKey: useSupplier.keys.list(filter),
      queryFn: () => supplierService.findAll(filter),
      retry: 1,
    });
  },

  useCreateSupplier: () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: supplierService.create,
      ...mutationHandler({
        queryClient,
        queryKey: useSupplier.keys.all,
      }),
    });
  },

  useUpdateSupplier: () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: ({ id, request }: { id: number; request: SupplierRequest }) =>
        supplierService.update(id, request),
      ...mutationHandler({
        queryClient,
        queryKey: useSupplier.keys.all,
      }),
    });
  },

  useDeleteSupplier: () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: supplierService.delete,
      ...mutationHandler({
        queryClient,
        queryKey: useSupplier.keys.all,
      }),
    });
  },
};