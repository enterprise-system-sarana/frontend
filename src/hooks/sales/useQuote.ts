import { quoteService } from "@/services/sales/quote.service";
import type { QuoteFilter, QuoteRequest } from "@/types/quote/Quote";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { mutationHandler } from "../handleMutaion";

export const useQuote = {
  keys: {
    all: ["quotes"] as const,
    list: (filter: QuoteFilter) =>
      [...useQuote.keys.all, "list", { ...filter }] as const,
    detail: (id: number) => [...useQuote.keys.all, "detail", id] as const,
  },

  useGetAllQuote: (filter: QuoteFilter = { page: 1, size: 10 }) => {
    return useQuery({
      queryKey: useQuote.keys.list(filter),
      queryFn: () => quoteService.findAll(filter),
      retry: 1,
    });
  },

  useCreateQuote: () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: (request: QuoteRequest) => quoteService.create(request),
      ...mutationHandler({
        queryClient,
        queryKey: useQuote.keys.all,
      }),
    });
  },

  useUpdateQuote: () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: ({ id, request }: { id: number; request: QuoteRequest }) =>
        quoteService.update(id, request),
      ...mutationHandler({
        queryClient,
        queryKey: useQuote.keys.all,
      }),
    });
  },

  useGetQuoteById: (id: number, enabled: boolean = true) => {
    return useQuery({
      queryKey: useQuote.keys.detail(id),
      queryFn: () => quoteService.findById(id),
      enabled: enabled && !!id && !isNaN(id),
      retry: 1,
    });
  },

  useDeleteQuote: () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: (id: number) => quoteService.delete(id),
      ...mutationHandler({
        queryClient,
        queryKey: useQuote.keys.all,
      }),
    });
  },
};
