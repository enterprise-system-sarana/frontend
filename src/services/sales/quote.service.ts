import type { QuoteFilter, QuoteRequest } from "@/types/quote/Quote";
import api from "../lib/axios";

export const quoteService = {
  findAll(filter: QuoteFilter) {
    return api.get("/quote", { params: filter }).then((res) => res.data);
  },
  findById(id: number) {
    return api.get(`/quote/${id}`).then((res) => res.data);
  },
  create(request: QuoteRequest) {
    return api.post("/quote", request).then((res) => res.data);
  },
  update(id: number, request: QuoteRequest) {
    return api.put(`/quote/${id}`, request).then((res) => res.data);
  },
  delete(id: number) {
    return api.delete(`/quote/${id}`).then((res) => res.data);
  },
};

export const QuoteService = quoteService;
