import type { CategoryFilter, CategoryRequest } from "@/types/product/Category"
import api from "@/services/lib/axios"
import { objectToFormData } from "@/utils/FormData"

export const findAll = async (filter: CategoryFilter) => {
  return api.get("/category", { params: filter }).then((res) => res.data)
}

export const create = async (request: CategoryRequest) => {
  const formData = objectToFormData(request);
  return api.post("/category", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  }).then((res) => res.data);

}

export const update = async (id: number, request: CategoryRequest) => {
  const formData = objectToFormData(request);
  return api.put(`/category/${id}`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  }).then((res) => res.data);

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