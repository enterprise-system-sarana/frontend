import api from "@/services/lib/axios";
import type { ProductSerialFilter, ProductSerialResponse } from "@/types/product/ProductSerial";
import type { ApiResponse } from "@/types/pagination";

export const ProductSerialService = {
  findAll: async (filter: ProductSerialFilter & { page?: number; size?: number; sort?: string }) => {
    return api.get<ApiResponse<ProductSerialResponse>>("/product-serial", { params: filter }).then((res) => res.data);
  },

  findById: async (id: number) => {
    return api.get<{ payload: ProductSerialResponse }>(`/product-serial/${id}`).then((res) => res.data);
  }
};