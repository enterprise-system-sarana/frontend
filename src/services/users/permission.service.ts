import type { PermissionRequest } from "@/types/users/Permission";
import api from "../lib/axios";

export const permissionService = {
    findAll: async () => {
        return api.get("/permission",).then((res) => res.data)
    },
    create: async (request: PermissionRequest) => {
        return api.post("/permission", request).then((res) => res.data)
    },
    update: async (id: number, request: PermissionRequest) => {
        return api.put(`/permission/${id}`, request).then((res) => res.data)
    },
    delete: async (id: number) => {
        return api.delete(`/permission/${id}`).then((res) => res.data)
    },
    findAllGrouped: async () => {
        return api.get("/permission/grouped").then((res) => res.data)
    }
}