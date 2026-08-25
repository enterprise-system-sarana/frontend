import { z } from "zod";
import type { BaseResponse, PageFilter } from "../pagination";
import { Status } from "../enum/status";
import { validateNumber, validateString } from "../validator";

export interface VariantValueResponse extends BaseResponse {
    name: string;
    code: string;
    variantTypeId: number;
    variantTypeName: string;
    status: Status;
}

export const VariantValueSchema = z.object({
    name: validateString("Name"),
    code: validateString("Code"),
    variantTypeId: validateNumber("Variant Type"),
    status: validateString("Status"),
});

export interface VariantValueFilter extends PageFilter {
    name?: string;
    code?: string;
    variantTypeId?: number;
}

export type VariantValueRequest = z.infer<typeof VariantValueSchema>;