import { z } from "zod";
import type { BaseResponse, PageFilter } from "../pagination";

/**
 * Payment Line Item DTO (matching PaymentLineResponseDTO & Request)
 */
export interface PaymentLineResponseDTO {
  id?: number;
  paymentMethod: string;
  amount: number;
  transactionNo?: string | null;
  bankId?: number | null;
  bankName?: string | null;
  currencyId?: number | null;
  currencyCode?: string | null;
}

export interface PaymentLineRequestDTO {
  id?: number;
  paymentMethod: string;
  amount: number;
  transactionNo?: string | null;
  bankId?: number | null;
  currencyId?: number | null;
}

// Alias for backwards compatibility
export type PaymentLine = PaymentLineRequestDTO;

/**
 * Payment Response DTO (matching backend PaymentResponse)
 */
export interface PaymentResponse extends BaseResponse {
  id: number;
  paymentNo: string;
  totalAmount: number;
  receivedAmount?: number;
  returnAmount?: number;
  dueAmount?: number;
  status: string;
  paymentDate: Date | string;
  note?: string | null;
  saleId?: number | null;
  saleNo?: string | null;
  purchaseId?: number | null;
  purchaseNo?: string | null;
  userId?: number | null;
  username?: string | null;
  lines: PaymentLineResponseDTO[];

  // Compatibility fields
  paymentLines?: PaymentLineResponseDTO[];
  payments?: PaymentLineResponseDTO[];
  amount?: number;
  paymentMethod?: string;
  bankId?: number | null;
  bankName?: string | null;
  transactionNo?: string | null;
}

/**
 * Payment Line Schema for form validation
 */
export const PaymentLineItemSchema = z.object({
  paymentMethod: z.string().min(1, "Payment method is required"),
  amount: z.number().min(0, "Amount must be >= 0"),
  bankId: z.number().nullable().optional(),
  currencyId: z.number().nullable().optional(),
  transactionNo: z.string().nullable().optional(),
});

/**
 * Payment Request Schema
 */
export const PaymentSchema = z.object({
  id: z.number().optional(),
  paymentNo: z.string().optional(),
  totalAmount: z.number(),
  receivedAmount: z.number().optional(),
  returnAmount: z.number().optional(),
  dueAmount: z.number().optional(),
  status: z.string().optional(),
  paymentDate: z.union([z.string(), z.date()]).optional(),
  note: z.string().nullable().optional(),
  saleId: z.number().nullable().optional(),
  purchaseId: z.number().nullable().optional(),
  userId: z.number().nullable().optional(),
  lines: z.array(PaymentLineItemSchema).optional(),

  // Compatibility / fallback fields
  paymentLines: z.array(PaymentLineItemSchema).optional(),
  payments: z.array(PaymentLineItemSchema).optional(),
  idempotencyKey: z.string().optional(),
  amount: z.number().optional(),
  paymentMethod: z.string().optional(),
  bankId: z.number().nullable().optional(),
  transactionNo: z.string().nullable().optional(),
});

export type PaymentRequest = z.infer<typeof PaymentSchema>;
export type RecordPaymentRequest = PaymentRequest;

export interface VoidPaymentRequest {
  reason?: string;
  note?: string;
}

export interface PaymentFilter extends PageFilter {
  status?: string;
  saleId?: number;
  purchaseId?: number;
  paymentNo?: string;
  userId?: number;
  bankId?: number;
  startDate?: string;
  endDate?: string;
}