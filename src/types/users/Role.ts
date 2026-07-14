import { z } from "zod";
import type { PageFilter } from "../pagination";

export type RoleResponse = {
  id: number;
  code: string;
  name: string;
  description: string;
  permissionIds: number[];
};





export const RoleSchema = z.object({
  code: z.string().min(1, "Role code is required"),
  name: z.string().min(1, "Role name is required"),
  description: z.string().optional().nullable(),
});

export interface RoleFilter extends PageFilter {
  name?: string;
}

export type RoleRequest = z.infer<typeof RoleSchema>;
