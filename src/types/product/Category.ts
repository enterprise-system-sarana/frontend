import { z } from "zod";
import type { PageFilter } from "../pagination";
import { Status } from "../enum/status";

export type CategoryResponse = {
  id: number;
  name: string;
  description: string;
  status: Status;
};

export const CategorySchema = z.object({
  name: z.string().min(1, "Category name is required"),
  description: z.string().optional().nullable(),
  status: z.enum([Status.ACTIVE, Status.INACTIVE]),
});

export interface CategoryFilter extends PageFilter {
  name?: string;
  status?: Status;
}

export type CategoryRequest = z.infer<typeof CategorySchema>;