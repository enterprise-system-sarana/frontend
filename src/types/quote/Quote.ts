import { z } from "zod";
import type { BaseResponse, PageFilter } from "../pagination";

export interface QuoteItemResponse extends BaseResponse {
  productId: number;
  productName?: string;
  productCode?: string;
  price: number;
  qty: number;
  discount_item: number;
  subtotal: number;
}

export type QuoteItem = {
  productId: number;
  productName?: string;
  productCode?: string;
  price: number;
  qty: number;
  discount_item: number;
  subtotal: number;
};

export interface QuoteResponse extends BaseResponse {
  date: string;
  reference: string;
  no: string;
  customerId: number;
  customerName?: string;
  customer?: any;
  grandTotal: number;
  discount: number;
  status: string;
  statusPayment?: string;
  paymentStatus?: string;
  paidAmount: number;
  returnAmount: number;
  productId?: number;
  noted?: string;
  note?: string;
  items: QuoteItemResponse[];
}

export const QuoteSchema = z.object({
  reference: z.string().trim().min(1, "Reference is required"),
  no: z.string().trim().min(1, "Quote No is required"),
  date: z.string().trim().min(1, "Date is required"),
  customerId: z.coerce.number().min(1, "Customer is required"),
  discount: z.coerce
    .number()
    .min(0, "Discount must be greater than or equal to 0"),
  grandTotal: z.coerce
    .number()
    .min(0, "Grand Total must be greater than or equal to 0"),
  status: z.string().min(1, "Status is required"),
  paymentStatus: z.string().min(1, "Payment Status is required"),
  paidAmount: z.coerce
    .number()
    .min(0, "Paid Amount must be greater than or equal to 0"),
  returnAmount: z.coerce
    .number()
    .min(0, "Return Amount must be greater than or equal to 0"),
  noted: z.string().optional(),
  items: z
    .array(
      z.object({
        productId: z.coerce.number().min(1, "Product is required"),
        qty: z.coerce.number().min(0.01, "Quantity must be greater than 0"),
        price: z.coerce
          .number()
          .min(0, "Price must be greater than or equal to 0"),
        discount_item: z.coerce
          .number()
          .min(0, "Discount must be greater than or equal to 0"),
        subtotal: z.coerce.number().min(0, "Subtotal must be greater than or equal to 0"),
        productName: z.string().optional(),
        productCode: z.string().optional(),
      })
    )
    .min(1, "At least one item is required"),
});

export interface QuoteFilter extends PageFilter {
  reference?: string;
  no?: string;
  customerId?: number;
  status?: string;
  paymentStatus?: string;
}

export type QuoteFormValues = z.input<typeof QuoteSchema>;
export type QuoteRequest = {
  date: string;
  reference: string;
  no: string;
  customerId: number;
  grandTotal: number;
  discount: number;
  status: string;
  paymentStatus: string;
  paidAmount: number;
  returnAmount: number;
  noted?: string;
  items: {
    productId: number;
    price: number;
    qty: number;
    discount_item: number;
    subtotal: number;
  }[];
};