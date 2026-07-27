import z from "zod";
import { Status } from "../enum/status";

export type AdjustmentResponse = {
  id: number;
  referenceNo: string;
  storeId: number;
  storeName: string;
  note: string;
  file: string;
  status: string;
  items: Array<{
    productId: number;
    quantity: number;
  }>;
};

// API contract schema — used only when building the final request payload.
export const AdjustmentSchema = z.object({
  referenceNo: z.string().trim().min(1, "Reference No is required"),
  storeId: z.coerce.number().min(1, "Store is required"),
  note: z.string().trim().optional().nullable(),
  file: z.string().trim().optional().nullable(),
  status: z.string().trim().min(1, "Status is required"),
  items: z
    .array(
      z.object({
        productId: z.number().min(1, "Product is required"),
        quantity: z.number().min(1, "Quantity is required"),
      })
    )
    .min(1, "At least one item is required"),
});

export const AdjustmentFormSchema = z.object({
  referenceNo: z.string().trim().min(1, "Reference No is required"),
  // storeId: z.number().min(1, "Store is required"),
  storeId: z
    .union([
      z.number(),
      z.string().transform((v) => (v === "" ? undefined : Number(v))),
    ])
    .optional(),
  note: z.string().trim().optional().nullable(),
  file: z.string().trim().optional().nullable(),
  status: z.enum([Status.Active, Status.Inactive]),
  // productId: z.number().min(1, "Product is required"),
  productId: z
    .union([
      z.number(),
      z.string().transform((v) => (v === "" ? undefined : Number(v))),
    ])
    .optional(),
  quantity: z.coerce
    .number({
      message: "Quantity is required",
    })
    .min(1, "Quantity must be greater than 0"),
});
export interface AdjustmentFilter {
  page?: number;
  size?: number;
  referenceNo?: string;
  storeId?: number;
  note?: string;
  file?: string;
  status?: string;
  items?: Array<{
    productId?: number;
    quantity?: number;
  }>;
}
export type AdjustmentRequest = z.infer<typeof AdjustmentSchema>;
export type AdjustmentFormValues = z.input<typeof AdjustmentFormSchema>;
