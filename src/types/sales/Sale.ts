import z from "zod";
import { Status } from "../enum/status";
import type { BaseResponse, PageFilter } from "../pagination";

export interface SaleItemResponse extends BaseResponse {
  productId: number;
  productName: string;
  quantity: number;
  returnedQuantity?: number;
  price: number;
  itemDiscount: number;
  subtotal: number;
  serialNumberIds?: number[];
  productSerialIds?: number[];
  returnedProductSerialIds?: number[];
}

export interface SaleReturnItemRequest {
  saleItemId: number;
  quantity: number;
  serialNumberIds?: number[];
}

export interface SaleReturnRequest {
  items: SaleReturnItemRequest[];
}

export type SaleItem = {
  productId: number;
  quantity: number;
  price: number;
  itemDiscount: number;
  subtotal: number;
  productName: string;
  serialNumberIds?: number[];
};

export interface SaleResponse extends BaseResponse {
  reference: string;
  saleDate?: string;
  noted: string | null;
  customerId: number | null;
  customerName: string | null;
  storeId: number | null;
  storeName: string | null;
  bankId: number | null;
  bankName: string | null;
  totalAmount: number;
  discount: number;
  grandTotal: number;
  paidAmount: number;
  dueAmount: number;
  paymentStatus: string;
  status: string;
  items: SaleItemResponse[];
}

export const SaleStatus = {
  Pending: "PENDING",
  Completed: "COMPLETED",
  Cancelled: "CANCELLED",
  Returned: "RETURNED",
  PartialReturned: "PARTIAL_RETURNED",
} as const;

export type SaleStatus = (typeof SaleStatus)[keyof typeof SaleStatus];

export const SalePaymentStatus = {
  Pending: "PENDING",
  Paid: "PAID",
  Partial: "PARTIAL",
} as const;

export type SalePaymentStatus =
  (typeof SalePaymentStatus)[keyof typeof SalePaymentStatus];

export const SaleSchema = z.object({
  reference: z.string().optional(),
  saleDate: z.string().optional(),
  storeId: z.coerce.number().min(1, "Store is required"),
  customerId: z.coerce.number().optional().nullable(),
  bankId: z.coerce.number().optional().nullable(),
  discount: z.coerce
    .number()
    .min(0, "Discount must be greater than or equal to 0")
    .default(0),
  paidAmount: z.coerce
    .number()
    .min(0, "Paid amount must be greater than or equal to 0")
    .default(0),
  noted: z.string().trim().optional().nullable(),
  paymentStatus: z.string().optional(),
  status: z.string().optional(),
  paymentOption: z.enum(["PAID", "DUE"]).default("PAID"),
  items: z
    .array(
      z.object({
        productId: z.coerce.number().min(1, "Product is required"),
        quantity: z.coerce.number().min(1, "Quantity must be at least 1"),
        price: z.coerce.number().min(0, "Price must be non-negative"),
        itemDiscount: z.coerce.number().min(0).default(0),
        subtotal: z.coerce.number().optional(),
        serialNumberIds: z.array(z.number()).optional(),
      })
    )
    .min(1, "At least one item is required"),
});

export interface SaleFilter extends PageFilter {
  reference?: string;
  customerId?: number;
  storeId?: number;
  paymentStatus?: string;
  status?: string | Status;
}

export type SaleFormValues = z.input<typeof SaleSchema>;
export type SaleRequest = z.output<typeof SaleSchema>;
