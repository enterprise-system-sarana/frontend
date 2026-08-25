import { groupPermissionService } from "@/services/users/group.Permission.service"
import type { GroupPermissionRequest } from "@/types/users/Group"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

export const useGroupPermission = {
    keys: {
        all: ["group-permission"],
        list: (filter?: any) => [...useGroupPermission.keys.all, "list", { ...filter }],
    },
    useFindAll: (filter?: { page?: number; size?: number }) => {
        return useQuery({
            queryKey: useGroupPermission.keys.list(filter),
            queryFn: () => groupPermissionService.findAll(filter),
        })
    },
    useGetAllGroupPermission: (filter?: { page?: number; size?: number }) => {
        return useQuery({
            queryKey: useGroupPermission.keys.list(filter),
            queryFn: () => groupPermissionService.findAll(filter),
        })
    },
    useCreate: () => {
        const queryClient = useQueryClient();
        return useMutation({
            mutationFn: (request: GroupPermissionRequest) => groupPermissionService.create(request),
            onSuccess: (data: any) => {
                queryClient.invalidateQueries({ queryKey: useGroupPermission.keys.all });
                toast.success(data?.message || "Created successfully");
            },
            onError: (error: any) => {
                toast.error(error?.message || "Failed to create");
            },
        })
    },
    useCreateGroupPermission: () => {
        const queryClient = useQueryClient();
        return useMutation({
            mutationFn: (request: GroupPermissionRequest) => groupPermissionService.create(request),
            onSuccess: (data: any) => {
                queryClient.invalidateQueries({ queryKey: useGroupPermission.keys.all });
                toast.success(data?.message || "Created successfully");
            },
            onError: (error: any) => {
                toast.error(error?.message || "Failed to create");
            },
        })
    },
    useUpdate: () => {
        const queryClient = useQueryClient();
        return useMutation({
            mutationFn: ({ id, request }: { id: number, request: GroupPermissionRequest }) => groupPermissionService.update(id, request),
            onSuccess: (data: any) => {
                queryClient.invalidateQueries({ queryKey: useGroupPermission.keys.all });
                toast.success(data?.message || "Updated successfully");
            },
            onError: (error: any) => {
                toast.error(error?.message || "Failed to update");
            },
        })
    },
    useUpdateGroupPermission: () => {
        const queryClient = useQueryClient();
        return useMutation({
            mutationFn: ({ id, request }: { id: number, request: GroupPermissionRequest }) => groupPermissionService.update(id, request),
            onSuccess: (data: any) => {
                queryClient.invalidateQueries({ queryKey: useGroupPermission.keys.all });
                toast.success(data?.message || "Updated successfully");
            },
            onError: (error: any) => {
                toast.error(error?.message || "Failed to update");
            },
        })
    },
    useDelete: () => {
        const queryClient = useQueryClient();
        return useMutation({
            mutationFn: (id: number) => groupPermissionService.delete(id),
            onSuccess: (data: any) => {
                queryClient.invalidateQueries({ queryKey: useGroupPermission.keys.all });
                toast.success(data?.message || "Deleted successfully");
            },
            onError: (error: any) => {
                toast.error(error?.message || "Failed to delete");
            },
        })
    },
    useDeleteGroupPermission: () => {
        const queryClient = useQueryClient();
        return useMutation({
            mutationFn: (id: number) => groupPermissionService.delete(id),
            onSuccess: (data: any) => {
                queryClient.invalidateQueries({ queryKey: useGroupPermission.keys.all });
                toast.success(data?.message || "Deleted successfully");
            },
            onError: (error: any) => {
                toast.error(error?.message || "Failed to delete");
            },
        })
    }   
}
