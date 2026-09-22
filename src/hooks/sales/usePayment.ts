import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { mutationHandler } from "../handleMutaion";
import type { PaymentFilter, PaymentRequest } from "@/types/sales/Payment";
import { PaymentService } from "@/services/sales/payment.service";


export const usePayment = {
    paymentKey: {
        all: ["payments"],
        list: (filter: PaymentFilter) => [...usePayment.paymentKey.all, "list", { ...filter }],
        detail: (id: number) => [...usePayment.paymentKey.all, "detail", id]
    },
    getAllPayments: (filter: PaymentFilter = { page: 1, size: 10}) => {
        return useQuery({
            queryKey: usePayment.paymentKey.list(filter),
            queryFn: () => PaymentService.findAll(filter),
            retry: 1
        });
    },
    createPayment: () => {
        const queryClient = useQueryClient();
        return useMutation({
            mutationFn: (req: PaymentRequest) => PaymentService.create(req),
            ...mutationHandler({
                queryClient,
                queryKey: usePayment.paymentKey.all
            })
        });
    },
    updatePayment: () => {
        const queryClient = useQueryClient();
        return useMutation({
            mutationFn: ({ id, req }: { id: number; req: PaymentRequest }) => PaymentService.update(id, req),
            ...mutationHandler({
                queryClient,
                queryKey: usePayment.paymentKey.all
            })
        });
    },
    deletePayment: () => {
        const queryClient = useQueryClient();
        return useMutation({
            mutationFn: ({ id }: { id: number }) => PaymentService.delete(id),
            ...mutationHandler({
                queryClient,
                queryKey: usePayment.paymentKey.all
            })
        });
    }
}