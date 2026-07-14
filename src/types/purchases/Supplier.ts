import z from "zod";
import { Status } from "../enum/status";
import type { PageFilter } from "../pagination";

export type SupplierResponse = {
  id: number;
  name: string;
  addressOne: string;
  addressTwo: string;
  phone: string;
  email: string;
  address: string;
  status: Status;
};

export const SupplierSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  addressOne: z.string().optional().nullable(),
  addressTwo: z.string().optional().nullable(),
  phone: z.string().trim().min(1, "Phone is required").max(15, "Phone number must be at most 15 characters"),
  email: z
    .string()
    .trim()
    .email("Invalid email address")
    .min(1, "Email is required"),
  address: z.string().trim().min(1, "Address is required"),
  status: z.enum([Status.Active, Status.Inactive]),
});

export interface SupplierFilter extends PageFilter {
  name?: string;
  addressOne?: string;
  addressTwo?: string;
  phone?: string;
  email?: string;
  address?: string;
}

export type SupplierRequest = z.infer<typeof SupplierSchema>;
