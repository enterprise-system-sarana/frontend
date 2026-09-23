import { useQuery } from "@tanstack/react-query";
import { ProductSerialService } from "@/services/product/productSerial.service";
import type { ProductSerialFilter } from "@/types/product/ProductSerial";

export const useProductSerial = {
  keys: {
    all: ["product-serials"] as const,
    list: (params?: ProductSerialFilter & { page?: number; size?: number; sort?: string }) =>
      [...useProductSerial.keys.all, params ?? {}] as const,
    detail: (id: number) => [...useProductSerial.keys.all, id] as const,
  },

  useGetAllProductSerial: (
    params?: ProductSerialFilter & { page?: number; size?: number; sort?: string },
    options?: { enabled?: boolean }
  ) => {
    return useQuery({
      queryKey: useProductSerial.keys.list(params),
      queryFn: () => ProductSerialService.findAll((params || {}) as ProductSerialFilter),
      enabled: options?.enabled ?? true,
    });
  },

  useGetProductSerialById: (id: number, options?: { enabled?: boolean }) => {
    return useQuery({
      queryKey: useProductSerial.keys.detail(id),
      queryFn: () => ProductSerialService.findById(id),
      enabled: (options?.enabled ?? true) && id > 0,
    });
  },
};