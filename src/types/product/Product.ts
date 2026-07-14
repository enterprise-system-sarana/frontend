import z from "zod";
import { Status } from "../enum/status";
import type { PageFilter } from "../pagination";
export type ProductResponse = {
    id: number;
    code: string
    name: string
    salePrice: number
    costPrice: number
    image: string
    type: string
    details: string
    alertQuantity: number
    categoryId: number
    categoryName: string
    subCategoryId: number
    subCategoryName: string
    unitId: number
    unitName: string
    defaultSaleUnit: number
    defaultPurchaseUnit: number
    printer: number
    status: Status
}

export const ProductShema = z.object({
    code: z.string().min(1, "Code is required"),
    name: z.string().min(1, "Name is required"),
    costPrice: z.union([z.number(), z.string().transform((v) => v === "" ? undefined : Number(v))]).optional(),
    salePrice: z.union([z.number(), z.string().transform((v) => v === "" ? undefined : Number(v))]).optional(),
    type: z.string().max(20).optional(),
    details: z.string().min(1, "Details is required"),
    alertQuantity: z.union([z.number(), z.string().transform((v) => v === "" ? undefined : Number(v))]).optional(),
    categoryId: z.union([z.number(), z.string().transform((v) => v === "" ? undefined : Number(v))]).optional(),
    subCategoryId: z.union([z.number(), z.string().transform((v) => v === "" ? undefined : Number(v))]).optional(),
    unitId: z.union([z.number(), z.string().transform((v) => v === "" ? undefined : Number(v))]).optional(),
    defaultSaleUnit: z.union([z.number(), z.string().transform((v) => v === "" ? undefined : Number(v))]).optional(),
    defaultPurchaseUnit: z.union([z.number(), z.string().transform((v) => v === "" ? undefined : Number(v))]).optional(),
    printer: z.union([z.number(), z.string().transform((v) => v === "" ? undefined : Number(v))]).optional(),
    status: z.enum([Status.Active, Status.Inactive]),
})

export interface ProductFilter extends PageFilter {
    name?: string;
    code?: string;
    categoryId?: number;
    subCategoryId?: number;
    minPrice?: number;
    maxPrice?: number;
    status?: Status;
}



export type ProductRequest = z.infer<typeof ProductShema>;
export type ProductFormValues = z.input<typeof ProductShema>;