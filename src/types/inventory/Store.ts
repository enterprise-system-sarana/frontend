import z from "zod";
import { Status } from "../enum/status";
import type { PageFilter } from "../pagination";

export type StoreResponse = {
  id: number;
  name: string;
  code: string;
  logo: string;
  email: string;
  phone: string;
  address1: string;
  address2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  currencyCode: string;
  receiptHeader: string;
  receiptFooter: string;
  status: Status;
};

export const StoreSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  code: z.string().trim().min(1, "Code is required"),
  logo: z.string().optional().nullable(),
  email: z
    .string()
    .trim()
    .email("Invalid email address")
    .min(1, "Email is required"),
  phone: z.string().trim().min(1, "Phone is required"),
  address1: z.string().trim().min(1, "Address 1 is required"),
  address2: z.string().optional().nullable(),
  city: z.string().trim().min(1, "City is required"),
  state: z.string().trim().min(1, "State is required"),
  postalCode: z.string().trim().min(1, "Postal Code is required"),
  country: z.string().trim().min(1, "Country is required"),
  currencyCode: z.string().trim().min(1, "Currency Code is required"),
  receiptHeader: z.string().trim().min(1, "Receipt Header is required"),
  receiptFooter: z.string().trim().min(1, "Receipt Footer is required"),
  status: z.enum([Status.Active, Status.Inactive]),
});

export interface StoreFilter extends PageFilter {
  name?: string;
  code?: string;
  email?: string;
  phone?: string;
  city?: string;
  state?: string;
  country?: string;
}

export type StoreRequest = z.infer<typeof StoreSchema>;
