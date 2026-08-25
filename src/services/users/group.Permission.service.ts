import type { GroupPermissionRequest } from "@/types/users/Group"
import api from "../lib/axios"

export const groupPermissionService = {
    findAll: async (filter?: { page?: number; size?: number }) => {
        return api.get("/permission-group", { params: filter }).then((res) => res.data)
    },
    create: async (request: GroupPermissionRequest) => {
        return api.post("/permission-group", request).then((res) => res.data)
    },
    update: async (id: number, request: GroupPermissionRequest) => {
        return api.put(`/permission-group/${id}`, request).then((res) => res.data)
    },
    delete: async (id: number) => {
        return api.delete(`/permission-group/${id}`).then((res) => res.data)
    }
}
