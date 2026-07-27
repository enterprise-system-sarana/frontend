import type { AdjustmentFilter, AdjustmentRequest } from "@/types/inventory/Adjutment";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  findAll,
  create,
  update,
  deleteAdjustment,
} from "@/services/inventory/adjustment.sevice";
import { mutationHandler } from "../handleMutaion";


export const AdjustmentKeys = {
    key: "adjustments",
    list: (filter: AdjustmentFilter) => [AdjustmentKeys.key, "list", { ...filter }],
};
export const useGetAllAdjustment = (filter: AdjustmentFilter) => {
    return useQuery({
        queryKey: [AdjustmentKeys.key],
        queryFn: () => findAll(filter),
    })
}
export const useAdjustment =(filter: AdjustmentFilter = { page: 1, size: 10 }) => {
    return useQuery({
        queryKey: AdjustmentKeys.list(filter),
        queryFn: () => findAll(filter),
    })
}
export const useCreateAdjustment = () => {
    const queryClient=useQueryClient()
    return useMutation({
        mutationFn: create,
        ...mutationHandler({
            queryClient,
            queryKey: [AdjustmentKeys.key],
        }),
    })
}

export const useUpdateAdjustment=()=>{
    const queryClient=useQueryClient()
    return useMutation({
        mutationFn:({id,request}:{id:number,request:AdjustmentRequest})=>update(id,request),
        ...mutationHandler({
            queryClient,
            queryKey: [AdjustmentKeys.key],
        }),
    })
}
export const useDeleteAdjustment=()=>{
    const queryClient=useQueryClient()
    return useMutation({
        mutationFn:({id}:{id:number})=>deleteAdjustment(id),
        ...mutationHandler({
            queryClient,
            queryKey: [AdjustmentKeys.key],
        }),
    })
}