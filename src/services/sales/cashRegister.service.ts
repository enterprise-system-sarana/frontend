import api from "@/services/lib/axios";
import type {
  CashRegisterResponse,
  CashRegisterFilter,
  OpenCashRegisterRequest,
  CloseCashRegisterRequest,
} from "@/types/sales/CashRegister";

export const cashRegisterService = {
  getCurrentOpen(): Promise<{ data: { payload: CashRegisterResponse | null; success: boolean; message: string } }> {
    return api.get("/cash-registers/current");
  },

  openRegister(
    request: OpenCashRegisterRequest
  ): Promise<{ data: { payload: CashRegisterResponse; success: boolean; message: string } }> {
    return api.post("/cash-registers/open", request);
  },

  closeRegister(
    id: number,
    request: CloseCashRegisterRequest
  ): Promise<{ data: { payload: CashRegisterResponse; success: boolean; message: string } }> {
    return api.patch(`/cash-registers/${id}/close`, request);
  },

  getById(
    id: number
  ): Promise<{ data: { payload: CashRegisterResponse; success: boolean; message: string } }> {
    return api.get(`/cash-registers/${id}`);
  },

  findAll(
    filter: CashRegisterFilter
  ): Promise<{
    data: {
      payload?: {
        content?: CashRegisterResponse[];
        data?: CashRegisterResponse[];
        totalElements?: number;
        totalPages?: number;
        pagination?: {
          totalElements?: number;
          totalPages?: number;
          pageSize?: number;
          pageNumber?: number;
        };
      } | CashRegisterResponse[];
      success?: boolean;
      message?: string;
    };
  }> {
    return api.get("/cash-registers", { params: filter });
  },
};

