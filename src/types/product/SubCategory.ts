import { z } from "zod";
import { Status } from "../enum/status";
import type { PageFilter } from "../pagination";

export interface SubCategoryResponse {
    id: number;
    name: string;
    status: Status;
    categoryId: number;
    categoryName: string;
}

export interface SubCategoryRequest {
    name: string;
    status: Status;
    categoryId: number;
}

export const SubCategoryShema = z.object({
    name: z.string().min(1, "Name is required"),
    status: z.enum([Status.Active, Status.Inactive]),
    categoryId: z.string().min(1, "Category is required"),
});

export interface subCategoryFilter extends PageFilter {
    name?: string;
    categoryName?: string;
}