import { z } from "zod";
import type { BaseResponse, PageFilter } from "../pagination";

export interface RoleResponse extends BaseResponse {
  code: string;
  name: string;
  description: string;
  permissionIds: number[];
}





export const RoleSchema = z.object({
  code: z.string().min(1, "Role code is required"),
  name: z.string().min(1, "Role name is required"),
  description: z.string().optional().nullable(),
  status: z.string().optional(),
  permissionIds: z.array(z.number()).optional(),
});

export interface RoleFilter extends PageFilter {
  name?: string;
  code?: string;
  status?: string;
}

export type RoleRequest = z.infer<typeof RoleSchema>;
