import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { RoleRequest, RoleFilter } from "@/types/users/Role";
import { toast } from "sonner";
import { roleService } from "@/services/users/role.service";

export const roleKeys = {
    all: ["roles"],
    list: (filter: RoleFilter) => [...roleKeys.all, "list", { ...filter }],
    details: (id: number) => [...roleKeys.all, "detail", id],
};

export const useRole = (filter: RoleFilter) => {
    return useQuery({
        queryKey: roleKeys.list(filter),
        queryFn: () => roleService.findAll(filter),
    });
};

export const useCreateRole = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: roleService.create,
        onSuccess: (res: any) => {
            queryClient.invalidateQueries({ queryKey: roleKeys.all });
            toast.success(res?.message);
        },
        onError: (error: any) => {
            toast.error(error?.message);
        },
    });
};

export const useUpdateRole = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, request }: { id: number; request: RoleRequest }) => roleService.update(id, request),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: roleKeys.all });
        },
        onError: (error: any) => {
            toast.error(error?.message);
        },
    });
};

export const useDeleteRole = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: roleService.delete,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: roleKeys.all });
        },
        onError: (error: any) => {
            toast.error(error?.message);
        },
    });
};

export const useAllRoles = () => {
    return useQuery({
        queryKey: [...roleKeys.all, "all-no-pagination"],
        queryFn: () => roleService.findAllNoPagination(),
    });
};

export const useUpdateRolePermissions = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, permissionIds }: { id: number; permissionIds: number[] }) =>
            roleService.updatePermissions(id, permissionIds),
        onSuccess: (res: any) => {
            queryClient.invalidateQueries({ queryKey: roleKeys.all });
            toast.success(res?.message || "Permissions updated successfully");
        },
        onError: (error: any) => {
            toast.error(error?.message || "Failed to update permissions");
        },
    });
};

export const useRolePermissions = (id: number | null) => {
    return useQuery({
        queryKey: [...roleKeys.all, "permissions", id],
        queryFn: () => roleService.getPermissions(id!),
        enabled: id !== null && id !== undefined && id !== 0,
    });
};
