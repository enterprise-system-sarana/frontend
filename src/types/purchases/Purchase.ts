import z from "zod";
import { Status } from "../enum/status";
import type { BaseResponse, PageFilter } from "../pagination";

export interface PurchaseItemResponse extends BaseResponse {
  productId: number;
  productName: string;
  quantity: number;
  costPrice: number;
  subtotal: number;
  serialNumbers?: string[];
}

//  Long id,
//         Long purchaseId,
//         Long productId,
//         String productName,
//         BigDecimal quantity,
//         BigDecimal cost,
//         BigDecimal price ,
//         BigDecimal subtotal,
//         List <ProductSerialResponse> serialNumbers
export type PurchaseItem = {
  productId: number;
  quantity: number;
  cost: number;
  price: number;
  subtotal: number;
  productName: string;
};

//  Long id,
//         String referenceNo,
//         Long supplierId,
//         String supplierName ,
//         Long storeId,
//         String storeName,
//         Long bankId ,
//         String bankName,
//         LocalDate purchaseDate,
//         BigDecimal total,
//         BigDecimal discount,
//         BigDecimal grandTotal,
//         BigDecimal paidAmount,
//         BigDecimal dueAmount,
//         String paymentStatus,

//         String status,
//         String note,
//         List<PurchaseItemResponse> items
export interface PurchaseResponse extends BaseResponse {
  referenceNo: string;
  purchaseDate: string;
  note: string | null;
  supplierId: number | null;
  supplierName: string | null;
  storeId: number | null;
  storeName: string | null;
  bankId: number | null;
  bankName: string | null;
  total: number;
  discount: number;
  grandTotal: number;
  paidAmount: number;
  dueAmount: number;
  paymentStatus: string;
  status: string;
  items: PurchaseItemResponse[];
}

export const PurchaseSchema = z.object({
  referenceNo: z.string(),
  purchaseDate: z.string().trim().min(1, "Purchase date is required"),
  note: z.string().trim().optional(),
  supplierId: z.coerce.number().min(1, "Supplier is required"),
  storeId: z.coerce.number().min(1, "Store is required"),
  bankId: z.coerce.number().min(1, "Bank is required"),
  discount: z.coerce
    .number()
    .min(0, "Discount must be greater than or equal to 0")
    .default(0),
  total: z.coerce.number().min(0, "Total must be greater than or equal to 0"),
  grandTotal: z.coerce
    .number()
    .min(0, "Grand Total must be greater than or equal to 0"),
  paidAmount: z.coerce.number(),
  paymentStatus: z.string().optional(),
  status: z.string().optional(),
  items: z.any(),
});

export interface PurchaseFilter extends PageFilter {
  referenceNo?: string;
  supplierId?: number;
  paymentStatus?: string;
  storeId?: number;
  status?: Status;
}

export type PurchaseFormValues = z.input<typeof PurchaseSchema>;
export type PurchaseRequest = z.output<typeof PurchaseSchema>;
