import { z } from "zod";
import type { BaseResponse, PageFilter } from "../pagination";

export type SaleItem = {
  productId: number;
  quantity: number;
  price: number;
  itemDiscount: number;
  serialNumberIds: number[];
};

export interface SaleResponse extends BaseResponse {
  reference: string;
  storeId: number;
  storeName?: string;
  customerId: number;
  customerName?: string;
  bankId: number;
  bankName?: string;
  discount: number;
  total?: number;
  grandTotal?: number;
  paidAmount: number;
  dueAmount?: number;
  noted?: string;
  items: SaleItem[];
}

const saleItemSchema = z.object({
  productId: z.coerce.number().min(1, "Product is required"),
  quantity: z.coerce.number().positive("Quantity must be greater than 0"),
  price: z.coerce.number().positive("Price must be greater than 0"),
  itemDiscount: z.coerce.number().min(0),
  serialNumberIds: z.array(z.coerce.number().int().positive()),
});

export const SaleSchema = z.object({
  reference: z.string().trim().min(1, "Reference is required"),
  storeId: z.coerce.number().min(1, "Store is required"),
  customerId: z.coerce.number().min(1, "Customer is required"),
  discount: z.coerce.number().min(0),
  bankId: z.coerce.number().min(1, "Bank is required"),
  paidAmount: z.coerce.number().min(0),
  noted: z.string().optional(),
  items: z.array(saleItemSchema).min(1, "Add at least one item"),
});

export type SaleFormValues = z.input<typeof SaleSchema>;
export type SaleRequest = z.output<typeof SaleSchema>;

export interface SaleFilter extends PageFilter {
  reference?: string;
  customerId?: number;
  storeId?: number;
}