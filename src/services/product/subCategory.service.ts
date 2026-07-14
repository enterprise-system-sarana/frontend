import type { subCategoryFilter, SubCategoryRequest } from "@/types/product/SubCategory";
import api from "../lib/axios";

export const subCategoryService = {
  findAll: async (filter: subCategoryFilter) => {
    return api.get("sub-category", { params: filter }).then(res => res.data)
  },
  create: async (req: SubCategoryRequest) => {
    return api.post("sub-category", req).then(res => res.data)
  },
  update: async (id: number, req: SubCategoryRequest) => {
    return api.put(`sub-category/${id}`, req).then(res => res.data)
  },
  deleteSubCategory: async (id: number) => {
    return api.delete(`/sub-category/${id}`).then(res => res.data)
  },
  
}
