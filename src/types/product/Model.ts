import { z } from "zod";
import type { BaseResponse, PageFilter } from "../pagination";
import { Status } from "../enum/status";
import { validateNumber, validateString } from "../validator";

export interface ModelResponse extends BaseResponse {
  name: string;
  brandId: number;
  brandName: string;
  categoryId: number;
  categoryName: string;
  status: Status;
}

export const ModelSchema = z.object({
  name: validateString("Name"),
  brandId: validateNumber("Brand"),
  categoryId: validateNumber("Category"),
  status: validateString("Status"),
});

export interface ModelFilter extends PageFilter {
  name?: string;
  brandId?: number;
  categoryId?: number;
}

export type ModelRequest = z.infer<typeof ModelSchema>;

