import z from "zod";
import type { BaseResponse, PageFilter } from "../pagination";
import { stringValidate, validateString } from "../validator";

export interface StoreResponse extends BaseResponse {
  name: string;
  code: string;
  logo?: string | null;
  email?: string | null;
  phone?: string | null;
  address1?: string | null;
  address2?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  country?: string | null;
  currencyCode?: string | null;
  receiptHeader?: string | null;
  receiptFooter?: string | null;
  status?: string | null;
}

export const StoreSchema = z.object({
  name: validateString("Name"),
  code: validateString("Code"),
  logo: z.string().optional().nullable(),
  email: validateString("Email"),
  phone: stringValidate(),
  address1: stringValidate(),
  address2: stringValidate(),
  city: stringValidate(),
  state: stringValidate(),
  postalCode: stringValidate(),
  country: stringValidate(),
  currencyCode: stringValidate(),
  receiptHeader: stringValidate(),
  receiptFooter: stringValidate(),
  status : validateString("Status"),
});

export interface StoreFilter extends PageFilter {
  name?: string;
  code?: string;
  email?: string;
  phone?: string;
  city?: string;
}

export type StoreRequest = z.infer<typeof StoreSchema>;
