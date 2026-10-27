import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { mutationHandler } from "../handleMutaion";
import type {
  PaymentFilter,
  PaymentRequest,
  RecordPaymentRequest,
  VoidPaymentRequest,
} from "@/types/sales/Payment";
import { PaymentService } from "@/services/sales/payment.service";
import { useSale } from "./useSale";
import { useCashRegister } from "./useCashRegister";
import { useProduct } from "../product/useProduct";
import { useProductSerial } from "../product/useProductSerial";

export const usePayment = {
  paymentKey: {
    all: ["payments"] as const,
    list: (filter: PaymentFilter) =>
      [...usePayment.paymentKey.all, "list", { ...filter }] as const,
    detail: (id: number) =>
      [...usePayment.paymentKey.all, "detail", id] as const,
    summary: (saleId: number) =>
      [...usePayment.paymentKey.all, "summary", saleId] as const,
    bySale: (saleId: number) =>
      [...usePayment.paymentKey.all, "bySale", saleId] as const,
  },

  getAllPayments: (filter: PaymentFilter = { page: 1, size: 10 }) => {
    return useQuery({
      queryKey: usePayment.paymentKey.list(filter),
      queryFn: () => PaymentService.findAll(filter),
      retry: 1,
    });
  },

  getPaymentById: (id: number, options?: { enabled?: boolean }) => {
    return useQuery({
      queryKey: usePayment.paymentKey.detail(id),
      queryFn: () => PaymentService.findById(id),
      ...options,
      retry: 1,
    });
  },

  getSalePaymentSummary: (saleId: number, options?: { enabled?: boolean }) => {
    return useQuery({
      queryKey: usePayment.paymentKey.summary(saleId),
      queryFn: () => PaymentService.getSalePaymentSummary(saleId),
      ...options,
      retry: 1,
    });
  },

  getPaymentsBySaleId: (saleId: number, options?: { enabled?: boolean }) => {
    return useQuery({
      queryKey: usePayment.paymentKey.bySale(saleId),
      queryFn: () => PaymentService.getPaymentsBySaleId(saleId),
      ...options,
      retry: 1,
    });
  },

  createPayment: () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: (req: PaymentRequest) => PaymentService.create(req),
      ...mutationHandler({
        queryClient,
        queryKey: usePayment.paymentKey.all,
        additionalQueryKeys: [
          useSale.keys.all,
          useCashRegister.keys.all,
          useProduct.keys.all,
          useProductSerial.keys.all,
        ],
      }),
    });
  },

  recordPayments: () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: (req: RecordPaymentRequest) =>
        PaymentService.recordPayments(req),
      ...mutationHandler({
        queryClient,
        queryKey: usePayment.paymentKey.all,
        additionalQueryKeys: [
          useSale.keys.all,
          useCashRegister.keys.all,
          useProduct.keys.all,
          useProductSerial.keys.all,
        ],
      }),
    });
  },

  voidPayment: () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: ({ id, req }: { id: number; req: VoidPaymentRequest }) =>
        PaymentService.voidPayment(id, req),
      ...mutationHandler({
        queryClient,
        queryKey: usePayment.paymentKey.all,
        additionalQueryKeys: [
          useSale.keys.all,
          useCashRegister.keys.all,
        ],
      }),
    });
  },

  verifyPayment: () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: (id: number) => PaymentService.verifyPayment(id),
      ...mutationHandler({
        queryClient,
        queryKey: usePayment.paymentKey.all,
        additionalQueryKeys: [
          useSale.keys.all,
          useCashRegister.keys.all,
        ],
      }),
    });
  },

  updatePayment: () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: ({ id, req }: { id: number; req: PaymentRequest }) =>
        PaymentService.update(id, req),
      ...mutationHandler({
        queryClient,
        queryKey: usePayment.paymentKey.all,
        additionalQueryKeys: [useSale.keys.all],
      }),
    });
  },

  deletePayment: () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: ({ id }: { id: number }) => PaymentService.delete(id),
      ...mutationHandler({
        queryClient,
        queryKey: usePayment.paymentKey.all,
        additionalQueryKeys: [useSale.keys.all],
      }),
    });
  },
};