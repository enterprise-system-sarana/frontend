import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { RoleRequest, RoleFilter } from "@/types/users/Role";
import { roleService } from "@/services/users/role.service";
import { mutationHandler } from "../handleMutaion";


export const useRole = {
    roleKeys: {
        all: ["roles"],
        list: (filter: RoleFilter) => [...useRole.roleKeys.all, "list", { ...filter }],
        details: (id: number) => [...useRole.roleKeys.all, "detail", id],
    },
    GetAllRole: (filter: RoleFilter) => {
        return useQuery({
            queryKey: useRole.roleKeys.list(filter),
            queryFn: () => roleService.findAll(filter),
            retry: 1
        })
    },
    CreateRole: () => {
        const queryClient = useQueryClient();
        return useMutation({
            mutationFn: (req: RoleRequest) => roleService.create(req),
            ...mutationHandler({
                queryClient,
                queryKey: useRole.roleKeys.all
            })
        });
    },
    UpdateRole: () => {
        const queryClient = useQueryClient();
        return useMutation({
            mutationFn: ({ id, req }: { id: number; req: RoleRequest }) => roleService.update(id, req),
            ...mutationHandler({
                queryClient,
                queryKey: useRole.roleKeys.all
            })
        });
    },
    DeleteRole: () => {
        const queryClient = useQueryClient();
        return useMutation({
            mutationFn: ({ id }: { id: number }) => roleService.delete(id),
            ...mutationHandler({
                queryClient,
                queryKey: useRole.roleKeys.all
            })
        });
    },
    useFindAllNoPagination: () => {
        return useQuery({
            queryKey: useRole.roleKeys.all,
            queryFn: () => roleService.findAllNoPagination(),
            retry: 1
        })
    },
    GetRolePermission: (id: number | null) => {
        return useQuery({
            queryKey: [...useRole.roleKeys.all, "permissions", id],
            queryFn: () => roleService.getPermissions(id!),
            enabled: id !== null && id !== undefined && id !== 0,
        });
    },
    UpdateRolePermissions: () => {
        const queryClient = useQueryClient();
        return useMutation({
            mutationFn: ({ id, permissionIds }: { id: number; permissionIds: number[] }) =>
                roleService.updatePermissions(id, permissionIds),
            ...mutationHandler({
                queryClient,
                queryKey: useRole.roleKeys.all
            })
        });
    }

};
