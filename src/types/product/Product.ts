import { z } from "zod";
import type { BaseResponse, PageFilter } from "../pagination";
import type { Status } from "../enum/status";
import { stringValidate, validateNumber, validateString } from "../validator";
import type { VariantValueResponse } from "./VariantValue";

export interface ProductResponse extends BaseResponse {
    code: string;
    noted: string;
    imageUrl: string;
    status: Status;
    reorderLevel: number;
    modelId: number;
    modelName: string;
    brandName: string;
    categoryName: string;
    variantValues: VariantValueResponse[];
}

export const ProductSchema = z.object({
    code: validateString("Code"),
    noted: stringValidate(),
    imageUrl: stringValidate(),
    status: validateString("Status"),
    reorderLevel: validateNumber("Reorder Level"),
    modelId: validateNumber("Model"),
    variantValueIds: z.array(z.number()),
});

export interface ProductFilter extends PageFilter {
    modelId?: number;
}

export type ProductRequest = z.infer<typeof ProductSchema>;
