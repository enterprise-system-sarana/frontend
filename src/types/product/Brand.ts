import type { Status } from "../enum/status";
import type { BaseResponse, PageFilter } from "../pagination";
import { z } from "zod";
import { validateString } from "../validator";

export interface BrandResponse extends BaseResponse {
  name: string;
  imageUrl?: string;
  status: Status;
}

export interface BrandFilter extends PageFilter {
  name?: string;
}
export const BrandSchema = z.object({
  name: validateString("Name"),
  imageUrl: z.any().optional(),
  status: validateString("Status"),
});
export type BrandRequest = z.infer<typeof BrandSchema>;