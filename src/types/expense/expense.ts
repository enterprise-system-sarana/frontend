import z from "zod";
import type { BaseResponse, PageFilter } from "../pagination";
import { validateString } from "../validator";

export interface ExpenseResponse extends BaseResponse {
    reference: string;
    amount: number;
    note: string;
    storeId: number;
    storeName: string;
    bankId: number;
    bankName: string;
    expenseTypeId: number;
    expenseTypeName: string;
    description: string;
    status: string;
}

export const ExpenseSchema = z.object({
    reference: z.string().optional().default(""),
    amount: z.coerce.number().min(0.01, "Amount must be greater than 0"),
    expenseTypeId: z.coerce.number().min(1, "Please select an expense type"),
    storeId: z.coerce.number().optional().default(0),
    bankId: z.coerce.number().optional().default(0),
    note: z.string().optional().default(""),
    description: z.string().optional().default(""),
    status: validateString("Status"),
});

export interface ExpenseFilter extends PageFilter {
    reference?: string;
    createdBy?: string;
    storeId?: number;
    bankId?: number;
    expenseTypeId?: number;
}

export type ExpenseRequest = z.infer<typeof ExpenseSchema>;
