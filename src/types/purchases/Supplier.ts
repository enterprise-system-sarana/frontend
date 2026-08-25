import z from "zod";
import type { BaseResponse, PageFilter } from "../pagination";

export interface SupplierResponse extends BaseResponse {
  code: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  country?: string;
  note?: string;
  status?: string;
}

export const SupplierSchema = z.object({
  code: z.string().trim(),
  name: z.string().trim(),
  phone: z.string().trim(),
  email: z.string().trim(),
  address: z.string().trim(),
  city: z.string().trim(),
  country: z.string().trim(),
  note: z.string().trim(),
  status: z.string().trim(),
});

export interface SupplierFilter extends PageFilter {
  code?: string;
  name?: string;
}

export type SupplierRequest = z.infer<typeof SupplierSchema>;
