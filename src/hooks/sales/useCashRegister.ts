import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { mutationHandler } from "../handleMutaion";
import { cashRegisterService } from "@/services/sales/cashRegister.service";
import type {
  CashRegisterFilter,
  OpenCashRegisterRequest,
  CloseCashRegisterRequest,
} from "@/types/sales/CashRegister";

export const useCashRegister = {
  keys: {
    all: ["cash-registers"] as const,
    current: () => [...useCashRegister.keys.all, "current"] as const,
    list: (filter: CashRegisterFilter) =>
      [...useCashRegister.keys.all, "list", { ...filter }] as const,
    detail: (id: number) => [...useCashRegister.keys.all, "detail", id] as const,
  },

  GetCurrent: (options?: { enabled?: boolean }) => {
    return useQuery({
      queryKey: useCashRegister.keys.current(),
      queryFn: async () => {
        try {
          const res = await cashRegisterService.getCurrentOpen();
          return res.data?.payload ?? null;
        } catch {
          return null;
        }
      },
      retry: 1,
      staleTime: 1000 * 30, // 30 seconds
      ...options,
    });
  },

  GetAll: (filter: CashRegisterFilter = { page: 1, size: 10 }) => {
    return useQuery({
      queryKey: useCashRegister.keys.list(filter),
      queryFn: async () => {
        const res = await cashRegisterService.findAll(filter);
        return res.data?.payload ?? (res.data as any);
      },
      retry: 1,
    });
  },

  GetById: (id: number, options?: { enabled?: boolean }) => {
    return useQuery({
      queryKey: useCashRegister.keys.detail(id),
      queryFn: async () => {
        const res = await cashRegisterService.getById(id);
        return res.data?.payload;
      },
      retry: 1,
      ...options,
    });
  },

  Open: () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: async (request: OpenCashRegisterRequest) => {
        const res = await cashRegisterService.openRegister(request);
        return res.data;
      },
      ...mutationHandler({
        queryClient,
        queryKey: useCashRegister.keys.all,
      }),
    });
  },

  Close: () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: async ({
        id,
        request,
      }: {
        id: number;
        request: CloseCashRegisterRequest;
      }) => {
        const res = await cashRegisterService.closeRegister(id, request);
        return res.data;
      },
      ...mutationHandler({
        queryClient,
        queryKey: useCashRegister.keys.all,
      }),
    });
  },
};
