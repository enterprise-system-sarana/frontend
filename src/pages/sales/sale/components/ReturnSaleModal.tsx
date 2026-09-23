import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RotateCcw, X, AlertTriangle } from "lucide-react";

interface ReturnSaleModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    saleReference?: string | null;
    grandTotal?: number;
    onConfirm: (reason: string) => void;
    isPending?: boolean;
}

function formatCurrency(value: number) {
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
    }).format(Number(value) || 0);
}

export default function ReturnSaleModal({
    open,
    onOpenChange,
    saleReference,
    grandTotal = 0,
    onConfirm,
    isPending = false,
}: ReturnSaleModalProps) {
    const [reason, setReason] = useState("");

    const handleConfirm = () => {
        onConfirm(reason);
        setReason("");
    };

    const handleCancel = () => {
        setReason("");
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={(v) => { if (!v) handleCancel(); }}>
            <DialogContent
                showCloseButton={false}
                className="max-w-md gap-0 overflow-hidden rounded-xl border-border/70 p-0"
            >
                {/* Header */}
                <DialogHeader className="border-b border-amber-500/25 bg-amber-500/10 px-6 py-4">
                    <div className="flex items-center justify-between">
                        <DialogTitle className="flex items-center gap-2 text-base font-bold text-foreground">
                            <RotateCcw className="h-4 w-4 text-amber-500" />
                            Return Sale
                        </DialogTitle>
                        <DialogClose asChild>
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={handleCancel}
                                className="h-8 w-8 rounded-md hover:bg-amber-500/10 hover:text-amber-600"
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </DialogClose>
                    </div>
                </DialogHeader>

                {/* Body */}
                <div className="px-6 py-5 space-y-4 bg-background">
                    {/* Warning Banner */}
                    <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30 px-4 py-3">
                        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
                        <div className="text-xs leading-relaxed text-amber-800 dark:text-amber-300">
                            <p className="font-semibold mb-0.5">This action cannot be undone.</p>
                            <p>
                                Sale{" "}
                                {saleReference && (
                                    <span className="font-mono font-bold">#{saleReference}</span>
                                )}{" "}
                                worth{" "}
                                <span className="font-bold">{formatCurrency(grandTotal)}</span>{" "}
                                will be marked as <span className="font-semibold">RETURNED</span> and
                                inventory will be restocked.
                            </p>
                        </div>
                    </div>

                    {/* Sale Info Card */}
                    <div className="grid grid-cols-2 gap-3 rounded-md border border-border/70 bg-card p-3 text-sm">
                        <div>
                            <p className="text-xs text-muted-foreground">Reference</p>
                            <p className="font-mono font-bold text-primary">
                                {saleReference ? `#${saleReference}` : "—"}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">Grand Total</p>
                            <p className="font-bold">{formatCurrency(grandTotal)}</p>
                        </div>
                    </div>

                    {/* Reason Input */}
                    <div className="space-y-1.5">
                        <label
                            htmlFor="return-reason"
                            className="block text-xs font-semibold text-foreground"
                        >
                            Return Reason{" "}
                            <span className="font-normal text-muted-foreground">(optional)</span>
                        </label>
                        <textarea
                            id="return-reason"
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="e.g. Defective product, customer changed mind…"
                            rows={3}
                            className="w-full resize-none rounded-md border border-border/70 bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 transition-colors"
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-2 border-t border-border/70 bg-card px-6 py-4">
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={handleCancel}
                        disabled={isPending}
                        className="rounded-md px-5 text-sm font-medium"
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        onClick={handleConfirm}
                        disabled={isPending}
                        className="h-9 rounded-md bg-amber-500 px-6 text-sm font-bold text-white shadow-sm hover:bg-amber-600 disabled:opacity-60"
                    >
                        {isPending ? (
                            <span className="flex items-center gap-2">
                                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                Processing…
                            </span>
                        ) : (
                            <span className="flex items-center gap-2">
                                <RotateCcw className="h-3.5 w-3.5" />
                                Confirm Return
                            </span>
                        )}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
