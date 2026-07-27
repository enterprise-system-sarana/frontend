import type { AdjustmentFilter, AdjustmentRequest } from "@/types/inventory/Adjutment"
import api from "../lib/axios"

export const findAll = async (filter: AdjustmentFilter) => {
    return api.get("/adjustment", { params: filter }).then((res) => res.data)
}

export const create = async (request: AdjustmentRequest) => {

    return api.post("/adjustment", request).then((res) => res.data);
}

export const update = async (id: number, request: AdjustmentRequest) => {
   
    return api.put(`/adjustment/${id}`, request).then((res) => res.data);
 
}

export const deleteAdjustment = async (id: number) => {
    return api.delete(`/adjustment/${id}`).then((res) => res.data)
}

export const adjustmentService = {
    findAll,
    create,
    update,
    deleteAdjustment
}