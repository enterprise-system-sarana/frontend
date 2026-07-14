import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface QueryBoundaryProps {
    isLoading: boolean;
    isError: boolean;
    /** Optional error detail — shown under the headline if provided */
    error?: unknown;
    /** Called when the person clicks "Try again". Omit to hide the button. */
    onRetry?: () => void;
    /** Set false to render inline instead of filling the viewport (e.g. inside a card) */
    fullScreen?: boolean;
    /** Short label under the loader, e.g. "Loading your projects" */
    loadingLabel?: string;
    className?: string;
    children: ReactNode;
}

function getErrorMessage(error: unknown): string | undefined {
    if (!error) return undefined;
    if (error instanceof Error) return error.message;
    if (typeof error === "string") return error;
    return undefined;
}

/** A two-tone ring loader — reads as more considered than a generic spinner icon. */
function RingLoader() {
    return (
        <div className="relative size-10">
            <div className="absolute inset-0 rounded-full border-2 border-muted" />
            <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-primary border-r-primary animate-spin [animation-duration:0.8s]" />
        </div>
    );
}

export function QueryBoundary({
    isLoading,
    isError,
    error,
    onRetry,
    fullScreen = true,
    loadingLabel,
    className,
    children,
}: QueryBoundaryProps) {
    const wrapperClass = cn(
        "flex flex-col items-center justify-center gap-4",
        fullScreen ? "h-screen" : "h-full min-h-[16rem] w-full",
        className,
    );

    if (isLoading) {
        return (
            <div
                className={cn(wrapperClass, "animate-in fade-in duration-300")}
                role="status"
                aria-live="polite"
                aria-busy="true"
            >
                <RingLoader />
                {loadingLabel && (
                    <p className="text-sm text-muted-foreground tracking-wide">
                        {loadingLabel}
                    </p>
                )}
                <span className="sr-only">Loading…</span>
            </div>
        );
    }

    if (isError) {
        const detail = getErrorMessage(error);

        return (
            <div
                className={cn(
                    wrapperClass,
                    "text-center px-6 animate-in fade-in zoom-in-95 duration-300",
                )}
                role="alert"
            >
                <div className="relative flex size-16 items-center justify-center">
                    <div className="absolute inset-0 rounded-full bg-destructive/10 blur-md" />
                    <div className="relative flex size-14 items-center justify-center rounded-full bg-destructive/10 ring-1 ring-destructive/20">
                        <AlertCircle className="size-7 text-destructive" strokeWidth={1.75} />
                    </div>
                </div>

                <div className="space-y-1.5">
                    <p className="text-lg font-medium text-foreground">
                        Couldn't load this data
                    </p>
                    <p className="text-sm text-muted-foreground max-w-sm text-balance">
                        {detail ?? "Something went wrong. Try again in a moment."}
                    </p>
                </div>

                {onRetry && (
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onRetry}
                        className="gap-2 mt-1 transition-transform hover:-translate-y-0.5"
                    >
                        <RefreshCw className="size-4" />
                        Try again
                    </Button>
                )}
            </div>
        );
    }

    return <>{children}</>;
}