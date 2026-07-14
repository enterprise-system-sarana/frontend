import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { UserRequest, UserFilter } from "@/types/users/Users";
import { toast } from "sonner";
import { userService } from "@/services/users/user.service";

export const userKeys = {
    all: ["users"],
    list: (filter: UserFilter) => [...userKeys.all, "list", { ...filter }],
    details: (id: number) => [...userKeys.all, "detail", id],
};

export const useUser = (filter: UserFilter) => {
    return useQuery({
        queryKey: userKeys.list(filter),
        queryFn: () => userService.findAll(filter),
    });
};

export const useCreateUser = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: userService.create,
        onSuccess: (res: any) => {
            queryClient.invalidateQueries({ queryKey: userKeys.all });
            toast.success(res?.message);
        },
        onError: (error: any) => {
            toast.error(error?.message);
        },
    });
};

export const useUpdateUser = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, request }: { id: number; request: UserRequest }) => userService.update(id, request),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: userKeys.all });
        },
        onError: (error: any) => {
            toast.error(error?.message);
        },
    });
};

export const useDeleteUser = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: userService.delete,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: userKeys.all });
        },
        onError: (error: any) => {
            toast.error(error?.message);
        },
    });
};
