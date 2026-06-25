import { Spinner } from "@/components/ui/spinner";
import { AlertCircle } from "lucide-react";
import type { ReactNode } from "react";

interface QueryBoundaryProps {
    isLoading: boolean;
    isError: boolean;
    children: ReactNode;
}

export function QueryBoundary({ isLoading, isError, children }: QueryBoundaryProps) {
    if (isLoading) {
        return <Spinner />;
    }

    if (isError) {
        return (
            <div className="flex flex-col justify-center items-center h-screen space-y-4 text-destructive">
                <AlertCircle className="size-10" />
                <p className="text-lg font-medium">Failed to load data. Please try again later.</p>
            </div>
        );
    }

    return <>{children}</>;
}
