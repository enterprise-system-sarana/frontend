import type { CategoryFilter, CategoryRequest } from "@/types/product/Category"
import api from "./lib/axios"

export const findAll = async (filter: CategoryFilter) => {
  return api.get("/category", { params: filter }).then((res) => res.data)
}

export const create = async (request: CategoryRequest) => {
  return api.post("/category", request).then((res) => res.data)
}

export const update = async (id: number, request: CategoryRequest) => {
  return api.put(`/category/${id}`, request).then((res) => res.data)
}

export const deleteCategory = async (id: number) => {
  return api.delete(`/category/${id}`).then((res) => res.data)
}



export const categoryService = {
  findAll,
  create,
  update,
  deleteCategory
}