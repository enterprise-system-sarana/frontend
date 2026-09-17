import { useQuery } from "@tanstack/react-query";
import { ProductSerialService } from "@/services/product/productSerial.service";
import type { ProductSerialFilter } from "@/types/product/ProductSerial";

export const useProductSerial = {
  useGetAllProductSerial: (
    params?: ProductSerialFilter & { page?: number; size?: number; sort?: string },
    options?: { enabled?: boolean }
  ) => {
    return useQuery({
      queryKey: ["product-serials", params],
      queryFn: () => ProductSerialService.findAll((params || {}) as ProductSerialFilter),
      enabled: options?.enabled ?? true,
    });
  },

  useGetProductSerialById: (id: number, options?: { enabled?: boolean }) => {
    return useQuery({
      queryKey: ["product-serial", id],
      queryFn: () => ProductSerialService.findById(id),
      enabled: (options?.enabled ?? true) && id > 0,
    });
  },
};