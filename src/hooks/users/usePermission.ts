import { permissionService } from "@/services/users/permission.service"
import type { PermissionRequest } from "@/types/users/Permission";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner";

export const usePermission = {
    keys: {
        all: ["permission"],
        list: () => [...usePermission.keys.all, "list"],
    },
    useFindAll: () => {
        return useQuery({
            queryKey: usePermission.keys.list(),
            queryFn: () => permissionService.findAll(),
        })
    },
    useCreate: () => {
        const queryClient = useQueryClient();
        return useMutation({
            mutationFn: (request: PermissionRequest) => permissionService.create(request),
            onSuccess: (data: any) => {
                queryClient.invalidateQueries({ queryKey: usePermission.keys.all });
                toast.success(data?.message);
            },
            onError: (error: any) => {
                toast.error(error?.message);
            },
        })
    },
    useUpdate: () => {
        const queryClient = useQueryClient();
        return useMutation({
            mutationFn: ({ id, request }: { id: number, request: PermissionRequest }) => permissionService.update(id, request),
            onSuccess: (data: any) => {
                queryClient.invalidateQueries({ queryKey: usePermission.keys.all });
                toast.success(data?.message);
            },
            onError: (error: any) => {
                toast.error(error?.message);
            },
        })
    },
    useDelete: () => {
        const queryClient = useQueryClient();
        return useMutation({
            mutationFn: (id: number) => permissionService.delete(id),
            onSuccess: (data: any) => {
                queryClient.invalidateQueries({ queryKey: usePermission.keys.all });
                toast.success(data?.message);
            },
            onError: (error: any) => {
                toast.error(error?.message);
            },
        })
    },
    useFindAllGrouped: () => {
        return useQuery({
            queryKey: [...usePermission.keys.all, "grouped"],
            queryFn: () => permissionService.findAllGrouped(),
        })
    }
}