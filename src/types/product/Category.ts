import { z } from "zod";
import type { PageFilter } from "../pagination";
import { Status } from "../enum/status";

export type CategoryResponse = {
  id: number;
  name: string;
  code: string;
  imageUrl: string;
  status: Status;
};

export const CategorySchema = z.object({
  name: z.string().min(1, "Category name is required"),
  code: z.string().min(1, "Category code is required"),
  imageUrl: z.any().optional(),
  status: z.enum([Status.Active, Status.Inactive]),
});

export interface CategoryFilter extends PageFilter {
  name?: string;
  code?: string
}

export type CategoryRequest = z.infer<typeof CategorySchema>;