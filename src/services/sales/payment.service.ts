import api from "@/services/lib/axios";
import type {
  PaymentFilter,
  PaymentRequest,
} from "@/types/sales/Payment";

export const PaymentService = {
  findAll: async (filter: PaymentFilter) => {
    return api.get("/payments", { params: filter }).then((res) => res.data);
  },
  findById: async (id: number) => {
    return api.get(`/payments/${id}`).then((res) => res.data);
  },
  create: async (request: PaymentRequest) => {
    return api.post("/payments", request).then((res) => res.data);
  },
  recordPayments: async (request: any) => {
    return api.post("/payments", request).then((res) => res.data);
  },
  getSalePaymentSummary: async (saleId: number) => {
    return api.get(`/payments/sale/${saleId}/summary`).then((res) => res.data);
  },
  getPaymentsBySaleId: async (saleId: number) => {
    return api.get(`/payments/sale/${saleId}`).then((res) => res.data);
  },
  voidPayment: async (id: number, request?: any) => {
    return api.patch(`/payments/${id}/void`, request).then((res) => res.data);
  },
  verifyPayment: async (id: number) => {
    return api.patch(`/payments/${id}/verify`).then((res) => res.data);
  },
  update: async (id: number, request: PaymentRequest) => {
    return api.put(`/payments/${id}`, request).then((res) => res.data);
  },
  delete: async (id: number) => {
    return api.delete(`/payments/${id}`).then((res) => res.data);
  },
};