import z from "zod";
import { Status } from "../enum/status";
import { PurchaseStatus } from "../enum/purchaseStatus";
import { PurchasePaymentStatus } from "../enum/purchasePaymentStatus";
import type { BaseResponse, PageFilter } from "../pagination";

export interface PurchaseItemResponse extends BaseResponse {
  productId: number;
  productName: string;
  productCode: string;
  quantity: number;
  costPrice: number;
  totalDiscount: number;
  subtotal: number;
  unitName: string;
  unitId?: number;
}

export type PurchaseItem = {
  productId: number;
  unitId?: number;
  quantity: number;
  costPrice: number;
  totalDiscount: number;
  unitName?: string;
  productName?: string;
};

export interface PurchaseResponse extends BaseResponse {
  reference: string;
  date: string;
  note: string;
  supplierId: number;
  supplierName: string;
  storeId: number;
  storeName: string;
  sellerId: number;
  sellerName: string;
  total: number;
  totalDiscount: number;
  orderDiscount?: number;
  grandTotal: number;
  purchasesStatus: string;
  paymentStatus: string;
  status: string;
  items: PurchaseItemResponse[];
}

export const PurchaseSchema = z.object({
  reference: z.string().trim().min(1, "Reference is required"),
  date: z.string().trim().min(1, "Date is required"),
  note: z.string().trim().optional(),
  supplierId: z.coerce.number().min(1, "Supplier is required"),
  storeId: z.coerce.number().min(1, "Store is required"),
  sellerId: z.coerce.number().min(0, "Seller is required"),

  orderDiscount: z.coerce
    .number()
    .min(0, "Order Discount must be greater than or equal to 0"),
  total: z.coerce.number().min(0, "Total must be greater than or equal to 0"),
  totalDiscount: z.coerce
    .number()
    .min(0, "Total Discount must be greater than or equal to 0"),
  grandTotal: z.coerce
    .number()
    .min(0, "Grand Total must be greater than or equal to 0"),

  purchasesStatus: z.enum([PurchaseStatus.Ordered, PurchaseStatus.Completed]),
  paymentStatus: z.enum([
    PurchasePaymentStatus.Pending,
    PurchasePaymentStatus.Paid,
    PurchasePaymentStatus.Partial,
  ]),
  status: z.enum([Status.ACTIVE, Status.INACTIVE]),
  items: z
    .array(
      z.object({
        productId: z.coerce.number().min(1, "Product is required"),
        unitId: z.coerce.number().min(1, "Unit is required"),
        quantity: z.coerce
          .number()
          .min(0.01, "Quantity must be greater than 0"),
        costPrice: z.coerce
          .number()
          .min(0, "Cost Price must be greater than or equal to 0"),
        totalDiscount: z.coerce
          .number()
          .min(0, "Total Discount must be greater than or equal to 0"),
        productName: z.string().optional(),
        unitName: z.string().optional(),
      }),
    )
    .min(1, "At least one item is required"),
});

export interface PurchaseFilter extends PageFilter {
  reference?: string;
  supplierId?: number;
  storeId?: number;
  status?: Status;
}

export type PurchaseFormValues = z.input<typeof PurchaseSchema>;
export type PurchaseRequest = z.output<typeof PurchaseSchema>;
