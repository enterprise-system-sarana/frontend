import {z} from "zod"

export type GroupPermission = {
    id: number;
    code: string;
    name: string;
    description: string;
}

export const GroupShema = z.object({
    code : z.string().min(1, "Code is required"),
    name: z.string().min(1, "Name is required"),
    description: z.string().optional().nullable(),
})


export type GroupPermissionRequest = z.infer<typeof GroupShema>

