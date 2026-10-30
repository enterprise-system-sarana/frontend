import { useState, useMemo, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCashRegister } from "@/hooks/sales/useCashRegister";
import { useLanguage } from "@/i18n/LanguageContext";
import type { CashRegisterResponse } from "@/types/sales/CashRegister";
import { AlertTriangle, CheckCircle2, DollarSign, Loader2, Lock } from "lucide-react";
import { DetailGrid, DetailItem, SummaryRow } from "@/components/ui/detail-list";
import { Money, formatMoney } from "@/components/ui/money";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { formatDate } from "@/utils/formatDate";

interface CloseRegisterModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  register: CashRegisterResponse | null;
  onSuccess?: () => void;
}

export default function CloseRegisterModal({
  open,
  onOpenChange,
  register,
  onSuccess,
}: CloseRegisterModalProps) {
  const { language } = useLanguage();
  const isKm = language === "km";

  const openingBalance = Number(register?.openingBalance || 0);
  const totalSales = Number(register?.totalSales || 0);
  const totalReturns = Number(register?.totalReturns || 0);
  const totalCashIn = Number(register?.totalCashIn || 0);
  const totalCashOut = Number(register?.totalCashOut || 0);

  // Expected Balance = opening + sales - returns + cashIn - cashOut
  const expectedBalance = useMemo(() => {
    return openingBalance + totalSales - totalReturns + totalCashIn - totalCashOut;
  }, [openingBalance, totalSales, totalReturns, totalCashIn, totalCashOut]);

  const [closingBalanceInput, setClosingBalanceInput] = useState<string>("");
  const [closingNote, setClosingNote] = useState<string>("");

  useEffect(() => {
    if (open && register) {
      // Default closing balance to expected balance for convenience, or blank
      setClosingBalanceInput(expectedBalance.toFixed(2));
      setClosingNote("");
    }
  }, [open, register, expectedBalance]);

  const countedCash = parseFloat(closingBalanceInput) || 0;
  const difference = useMemo(() => {
    return countedCash - expectedBalance;
  }, [countedCash, expectedBalance]);

  const closeMutation = useCashRegister.Close();

  const handleCloseRegister = async () => {
    if (!register?.id) {
      toast.error(isKm ? "មិនមានវេនលក់ដែលកំពុងបើកទេ" : "No active cash register found to close");
      return;
    }

    const counted = parseFloat(closingBalanceInput);
    if (isNaN(counted) || counted < 0) {
      toast.error(isKm ? "សូមបញ្ចូលចំនួនទឹកប្រាក់ដែលរាប់បានឱ្យបានត្រឹមត្រូវ" : "Please enter a valid counted cash balance");
      return;
    }

    try {
      await closeMutation.mutateAsync({
        id: register.id,
        request: {
          closingBalance: counted,
          closingNote: closingNote.trim() || undefined,
        },
      });
      onOpenChange(false);
      onSuccess?.();
    } catch {
      // Handled by mutationHandler
    }
  };

  const isBalanced = Math.abs(difference) < 0.005;
  const differenceTone = isBalanced
    ? "border-primary/20 bg-primary-light/60 text-primary"
    : difference > 0
      ? "border-success/20 bg-success/10 text-success"
      : "border-destructive/20 bg-destructive/10 text-destructive";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-lg">
        <DialogHeader className="shrink-0 border-b border-border px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary-light text-primary">
              <Lock className="size-5" strokeWidth={1.75} />
            </div>
            <div className="min-w-0">
              <DialogTitle>{isKm ? "បិទបញ្ជីលក់" : "Close Cash Register"}</DialogTitle>
              <DialogDescription className="mt-0.5">
                {isKm
                  ? "ផ្ទៀងផ្ទាត់ទឹកប្រាក់ក្នុងថត និងបិទវេនលក់ប្រចាំថ្ងៃ"
                  : "Count the drawer and finish your shift"}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 overflow-y-auto px-6 py-5">
          {/* Shift details */}
          <DetailGrid className="rounded-xl bg-muted/50 p-4">
            <DetailItem label={isKm ? "លេខបញ្ជី" : "Register"}>{register?.registerNo || "-"}</DetailItem>
            <DetailItem label={isKm ? "ហាង" : "Store"}>{register?.storeName || "-"}</DetailItem>
            <DetailItem label={isKm ? "អ្នកគិតលុយ" : "Cashier"}>{register?.userName || "-"}</DetailItem>
            <DetailItem label={isKm ? "ម៉ោងបើក" : "Opened"}>
              {register?.openedAt ? formatDate(register.openedAt, "dateTime") : "-"}
            </DetailItem>
          </DetailGrid>

          {/* Expected cash */}
          <div className="space-y-2.5 rounded-xl border border-border p-4">
            <SummaryRow label={isKm ? "ទឹកប្រាក់ដើមគ្រា" : "Opening cash"}>
              <Money value={openingBalance} />
            </SummaryRow>
            <SummaryRow label={`${isKm ? "ការលក់សរុប" : "Sales"} (${register?.saleCount || 0})`}>
              <Money value={`+${formatMoney(totalSales)}`} tone="success" />
            </SummaryRow>
            {totalReturns > 0 && (
              <SummaryRow label={isKm ? "ការសងទំនិញវិញ" : "Returns"}>
                <Money value={`-${formatMoney(totalReturns)}`} tone="danger" />
              </SummaryRow>
            )}
            <SummaryRow emphasis label={isKm ? "ទឹកប្រាក់រំពឹងទុកក្នុងថត" : "Expected in drawer"}>
              <Money value={expectedBalance} className="text-base" />
            </SummaryRow>
          </div>

          {/* Counted cash */}
          <div className="space-y-1.5">
            <Label htmlFor="closing-cash">
              {isKm ? "ទឹកប្រាក់រាប់បានជាក់ស្តែង" : "Counted cash"}
              <span className="text-destructive"> *</span>
            </Label>
            <div className="relative">
              <DollarSign className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="closing-cash"
                type="number"
                step="0.01"
                min="0"
                value={closingBalanceInput}
                onChange={(e) => setClosingBalanceInput(e.target.value)}
                placeholder="0.00"
                className="h-10 pl-9 text-base font-semibold tabular-nums"
              />
            </div>
          </div>

          {/* Difference */}
          <div className={cn("flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-sm", differenceTone)}>
            <span className="flex items-center gap-2 font-medium">
              {difference < -0.005 ? (
                <AlertTriangle className="size-4 shrink-0" />
              ) : (
                <CheckCircle2 className="size-4 shrink-0" />
              )}
              {isBalanced
                ? isKm ? "ទឹកប្រាក់ត្រូវគ្នា" : "Drawer is balanced"
                : difference > 0
                  ? isKm ? "ទឹកប្រាក់លើស" : "Cash over"
                  : isKm ? "ទឹកប្រាក់ខ្វះ" : "Cash short"}
            </span>
            <span className="font-semibold tabular-nums">
              {isBalanced ? formatMoney(0) : `${difference > 0 ? "+" : "-"}${formatMoney(Math.abs(difference))}`}
            </span>
          </div>

          {/* Note */}
          <div className="space-y-1.5">
            <Label htmlFor="closing-note">{isKm ? "ចំណាំ" : "Note"}</Label>
            <Textarea
              id="closing-note"
              rows={2}
              value={closingNote}
              onChange={(e) => setClosingNote(e.target.value)}
              placeholder={isKm ? "ចំណាំបន្ថែមនៅពេលបិទវេន..." : "Optional, e.g. why the drawer is short"}
              className="resize-none"
            />
          </div>
        </div>

        <DialogFooter className="m-0 shrink-0 rounded-none">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={closeMutation.isPending}>
            {isKm ? "បោះបង់" : "Cancel"}
          </Button>
          <Button type="button" onClick={handleCloseRegister} disabled={closeMutation.isPending}>
            {closeMutation.isPending ? (
              <>
                <Loader2 className="animate-spin" />
                {isKm ? "កំពុងបិទ..." : "Closing..."}
              </>
            ) : isKm ? (
              "បិទបញ្ជី"
            ) : (
              "Close Register"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
