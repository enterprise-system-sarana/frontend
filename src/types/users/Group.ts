import { z } from "zod";
import type { BaseResponse } from "../pagination";

export interface GroupPermission extends BaseResponse {
    code: string;
    name: string;
    description: string;
}

export type GroupPermissionResponse = GroupPermission;

export const GroupShema = z.object({
    code : z.string().min(1, "Code is required"),
    name: z.string().min(1, "Name is required"),
    description: z.string().optional().nullable(),
})


export type GroupPermissionRequest = z.infer<typeof GroupShema>

