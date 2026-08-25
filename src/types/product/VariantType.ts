import { z } from "zod";
import type { BaseResponse, PageFilter } from "../pagination";
import { Status } from "../enum/status";
import { validateString } from "../validator";

export interface VariantValueItem extends BaseResponse {
    code: string;
    name: string;
    status: Status;
}

export interface VariantTypeResponse extends BaseResponse {
    name: string;
    code: string;
    status: Status;
    values?: VariantValueItem[];
}

export const VariantTypeSchema = z.object({
    name: validateString("Name"),
    code: validateString("Code"),
    status: validateString("Status"),
});

export interface VariantTypeFilter extends PageFilter {
    name?: string;
    code?: string;
}

export type VariantTypeRequest = z.infer<typeof VariantTypeSchema>;