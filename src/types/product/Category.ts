import { z } from "zod";
import type { BaseResponse, PageFilter } from "../pagination";
import { Status } from "../enum/status";
import { validateString } from "../validator";

export interface CategoryResponse extends BaseResponse {
  name: string;
  code: string;
  imageUrl?: string;
  status: Status;
}

export const CategorySchema = z.object({
  name: validateString("Name"),
  code: validateString("Code"),
  imageUrl: z.any().optional(),
  status: validateString("Status"),
});

export interface CategoryFilter extends PageFilter {
  name?: string;
  code?: string;
}

export type CategoryRequest = z.infer<typeof CategorySchema>;