import { z } from "zod";
import { Status } from "../enum/status";
import type { BaseResponse, PageFilter } from "../pagination";

export interface CurrencyResponse extends BaseResponse {
    code: string;
    name: string;
    operation: string;
    rate: number;
    symbol: string;
    status: string;
}

export const CurrencySchema = z.object({
    code: z.string().min(1, "Currency code is required"),
    name: z.string().min(1, "Currency name is required"),
    operation: z.string().optional().nullable(),
    rate: z.coerce.number().min(0, "Rate must be positive"),
    symbol: z.string().optional().nullable(),
    status: z.enum([Status.ACTIVE, Status.INACTIVE]).default(Status.ACTIVE),
});


export interface CurrencyFilter extends PageFilter {
    code?: string;
    name?: string;
}


export type CurrencyRequest = z.infer<typeof CurrencySchema>;