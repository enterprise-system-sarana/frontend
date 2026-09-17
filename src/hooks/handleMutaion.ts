import { QueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

type MutationHandlerProps = {
    queryClient: QueryClient;
    queryKey: readonly unknown[];
};

export const mutationHandler = ({
    queryClient,
    queryKey,
}: MutationHandlerProps) => ({
    onSuccess: (res: any) => {
        queryClient.invalidateQueries({ queryKey });
        toast.success(res?.message || "Success");
    },

    onError: (error: any) => {
        console.error("API mutation failed", {
            status: error.response?.status,
            url: error.config?.url,
            request: error.config?.data,
            response: error.response?.data,
        });
        let errorMsg = "Something went wrong";
        if (error.response?.data) {
            const data = error.response.data;
            if (typeof data === "string") {
                errorMsg = data;
            } else if (data.message) {
                errorMsg = data.message;
            } else if (typeof data === "object") {
                // Handle field validation errors map: { field: "error message" }
                errorMsg = Object.values(data).join(", ");
            }
        } else if (error.message) {
            errorMsg = error.message;
        }
        toast.error(errorMsg);
    },
});