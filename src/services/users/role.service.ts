import type { RoleFilter, RoleRequest } from "@/types/users/Role";
import api from "../lib/axios";

export const roleService = {
  findAll: async (filter: RoleFilter) => {
    return api.get("/role", { params: filter }).then((res) => res.data);
  },
  findAllNoPagination: async () => {
    return api.get("/role", { params: { page: 1, size: 1000 } }).then((res) => res.data);
  },
  create: async (request: RoleRequest) => {
    return api.post("/role", request).then((res) => res.data);
  },
  update: async (id: number, request: RoleRequest) => {
    return api.put(`/role/${id}`, request).then((res) => res.data);
  },
  delete: async (id: number) => {
    return api.delete(`/role/${id}`).then((res) => res.data);
  },
  getPermissions: async (id: number) => {
    return api.get(`/role/${id}/permissions`).then((res) => res.data);
  },
  updatePermissions: async (id: number, permissionIds: number[]) => {
    return api.put(`/role/${id}/permissions`, permissionIds).then((res) => res.data);
  }
};
