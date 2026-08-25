import { z } from "zod";
import { validateString } from "../validator";
import type { BaseResponse, PageFilter } from "../pagination";

export interface BankResponse extends BaseResponse {
    name: string;
    accountName: string;
    accountNumber: string;
    openingBalance: string;
    currentBalance: string;
    status: string;
}

export const BankSchema = z.object({
    name: validateString("Name"),
    accountName: validateString("Account Name"),
    accountNumber: validateString("Account Number"),
    openingBalance: validateString("Opening Balance"),
    currentBalance: validateString("Current Balance"),
    status: validateString("Status"),
});




export interface BankFilter extends PageFilter {
    name?: string;
    accountName?: string;
    accountNumber?: string;
}

export type BankRequest = z.infer<typeof BankSchema>;


