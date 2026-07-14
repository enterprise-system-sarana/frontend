import type { UserFilter, UserRequest } from "@/types/users/Users";
import api from "../lib/axios";

export const userService = {
  findAll: async(filter:UserFilter)=>{
    return api.get("/users",{params:filter}).then((res)=>res.data)
  },
  create: async(request:UserRequest)=>{
    return api.post("/users",request).then((res)=>res.data)
  },
  update: async(id:number,request:UserRequest)=>{
    return api.put(`/users/${id}`,request).then((res)=>res.data)
  },
  delete: async(id:number)=>{
    return api.delete(`/users/${id}`).then((res)=>res.data)
  }
}