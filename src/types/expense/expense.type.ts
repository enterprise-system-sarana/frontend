import z from "zod";
import { stringValidate, validateString } from "../validator";
import type { BaseResponse, PageFilter } from "../pagination";

export interface ExpenseTypeResponse extends BaseResponse {
    code: string;
    name: string;
    description: string;
    status: string;
}

export const ExpenseTypeSchema = z.object(
    {
        name: validateString("Name"),
        code: validateString("Code"),
        description: stringValidate(),
        status: validateString("Status"),
    }
)

export interface ExpenseTypeFilter extends PageFilter {
    name?: string;
    code?: string;
}

export type ExpenseTypeRequest = z.infer<typeof ExpenseTypeSchema>;

