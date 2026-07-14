import z from "zod"

export type PermissionResponse = {
    id:number
    code:string
    name : string
    description:string
    groupId:number
    groupCode:string
    groupName:string
}

export const PermissionSchema = z.object({
    code:z.string().min(1,"Code is required"),
    name:z.string().min(1,"Name is required"),
    description:z.string().optional().nullable(),
    groupId:z.number().min(1,"Group id is required"),
})


export type PermissionRequest = z.infer<typeof PermissionSchema>