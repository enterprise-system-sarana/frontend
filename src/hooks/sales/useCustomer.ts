import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { mutationHandler } from "../handleMutaion";
import type { CustomerFilter, CustomerRequest } from "@/types/sales/Customer";
import { CustomerService } from "@/services/sales/customer.service";


export const useCustomer = {
    customerkey: {
        all: ["customer"],
        list: (filter: CustomerFilter) => [...useCustomer.customerkey.all, "list", { ...filter }],
        detail: (id: number) => [...useCustomer.customerkey.all, "detail", id]
    },
    useGetAllCustomer: (filter: CustomerFilter = { page: 1, size: 10 }) => {
        return useQuery({
            queryKey: useCustomer.customerkey.list(filter),
            queryFn: () => CustomerService.findAll(filter),
            retry: 1
        });
    },
    useCreateCustomer: () => {
        const queryClient = useQueryClient();
        return useMutation({
            mutationFn: (req: CustomerRequest) => CustomerService.create(req),
            ...mutationHandler({
                queryClient,
                queryKey: useCustomer.customerkey.all
            })
        });
    },
    useUpdateCustomer: () => {
        const queryClient = useQueryClient();
        return useMutation({
            mutationFn: ({ id, req }: { id: number; req: CustomerRequest }) => CustomerService.update(id, req),
            ...mutationHandler({
                queryClient,
                queryKey: useCustomer.customerkey.all
            })
        });
    },
    useDeleteCustomer: () => {
        const queryClient = useQueryClient();
        return useMutation({
            mutationFn: ({ id }: { id: number }) => CustomerService.delete(id),
            ...mutationHandler({
                queryClient,
                queryKey: useCustomer.customerkey.all
            })
        });
    }
}