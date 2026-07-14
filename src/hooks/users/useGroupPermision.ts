import { groupPermissionService } from "@/services/users/group.Permission.service"
import type { GroupPermissionRequest } from "@/types/users/Group"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"


export const useGroupPermission = {
    keys: {
        all: ["group-permission"],
        list: (filter: any) => [...useGroupPermission.keys.all, "list", { ...filter }],
    },
    useFindAll: () => {
        return useQuery({
            queryKey: useGroupPermission.keys.all,
            queryFn: () => groupPermissionService.findAll(),
        })
    },
    useCreate: () => {
        const queryClient = useQueryClient();
        return useMutation({
            mutationFn: (request: GroupPermissionRequest) => groupPermissionService.create(request),
            onSuccess: (data: any) => {
                queryClient.invalidateQueries({ queryKey: useGroupPermission.keys.all });
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
            mutationFn: ({ id, request }: { id: number, request: GroupPermissionRequest }) => groupPermissionService.update(id, request),
            onSuccess: (data: any) => {
                queryClient.invalidateQueries({ queryKey: useGroupPermission.keys.all });
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
            mutationFn: (id: number) => groupPermissionService.delete(id),
            onSuccess: (data: any) => {
                queryClient.invalidateQueries({ queryKey: useGroupPermission.keys.all });
                toast.success(data?.message);
            },
            onError: (error: any) => {
                toast.error(error?.message);
            },
        })
    }   
}
