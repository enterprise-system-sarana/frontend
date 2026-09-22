import { z } from "zod";
import type { BaseResponse, PageFilter } from "../pagination";
import type { Status } from "../enum/status";
import { stringValidate, validateNumber, validateString } from "../validator";
import type { VariantValueResponse } from "./VariantValue";

export interface ProductSerialItem {
  id: number;
  serialNumber: string;
  barcode: string;
  costPrice: number;
  sellingPrice: number;
  status: string;
}

export interface ProductResponse extends BaseResponse {
  code: string;
  name: string;
  noted: string;
  imageUrl: string;
  status: Status;
  reorderLevel: number;
  modelId: number;
  modelName: string;
  brandId?: number;
  brandName: string;
  categoryId?: number;
  categoryName: string;
  costPrice: number;
  salePrice: number;
  quantity?: number;
  qty?: number;
  availableSerials?: number;
  serials?: ProductSerialItem[];
  serialized?: boolean;
  isSerialized?: boolean;
  serializable?: boolean;
  hasSerialNumber?: boolean;
  variantValues: VariantValueResponse[];
}

export const ProductSchema = z.object({
  code: validateString("Code"),
  name: validateString("Name"),
  noted: stringValidate(),
  imageUrl: stringValidate(),
  costPrice: validateNumber("Cost Price"),
  salePrice: validateNumber("Sale Price"),
  status: validateString("Status"),
  reorderLevel: validateNumber("Reorder Level"),
  modelId: validateNumber("Model"),
  variantValueIds: z.array(z.number()),
});

export interface ProductFilter extends PageFilter {
  modelId?: number;
  name?: string;
  code?: string;
}

export type ProductRequest = z.infer<typeof ProductSchema>;
