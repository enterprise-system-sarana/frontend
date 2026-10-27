import { useState, useMemo, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import {
  DollarSign,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Loader2,
  Calendar,
  User,
  Store,
  Receipt,
  Scale,
} from "lucide-react";
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
      toast.success(isKm ? "បានបិទបញ្ជីលក់ជោគជ័យ" : "Cash register closed successfully");
      onOpenChange(false);
      onSuccess?.();
    } catch {
      // Handled by mutationHandler
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-0 overflow-hidden shadow-2xl max-h-[90vh] flex flex-col">
        <DialogHeader className="p-5 border-b border-slate-100 dark:border-slate-800 bg-linear-to-r from-rose-500/10 via-amber-500/5 to-transparent shrink-0">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-rose-500/15 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <Lock className="size-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-slate-900 dark:text-white">
                {isKm ? "បិទបញ្ជីលក់ (បញ្ចប់វេន)" : "Close Cash Register (End Shift)"}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                {isKm
                  ? "ផ្ទៀងផ្ទាត់ទឹកប្រាក់ក្នុងថត និងបិទវេនលក់ប្រចាំថ្ងៃ"
                  : "Reconcile counted cash with system sales and finalize your shift"}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="p-5 space-y-4 overflow-y-auto">
          {/* Shift Metadata Card */}
          <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-3 border border-slate-200/80 dark:border-slate-700/80 text-xs grid grid-cols-2 gap-2.5">
            <div className="flex items-center gap-2">
              <Receipt className="size-3.5 text-slate-400" />
              <span className="text-muted-foreground">{isKm ? "លេខបញ្ជី:" : "Register #:"}</span>
              <span className="font-semibold text-foreground">{register?.registerNo || "N/A"}</span>
            </div>
            <div className="flex items-center gap-2">
              <Store className="size-3.5 text-slate-400" />
              <span className="text-muted-foreground">{isKm ? "ហាង:" : "Store:"}</span>
              <span className="font-semibold text-foreground truncate">{register?.storeName || "N/A"}</span>
            </div>
            <div className="flex items-center gap-2">
              <User className="size-3.5 text-slate-400" />
              <span className="text-muted-foreground">{isKm ? "អ្នកគិតលុយ:" : "Cashier:"}</span>
              <span className="font-semibold text-foreground">{register?.userName || "N/A"}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="size-3.5 text-slate-400" />
              <span className="text-muted-foreground">{isKm ? "ម៉ោងបើក:" : "Opened At:"}</span>
              <span className="font-semibold text-foreground">
                {register?.openedAt ? formatDate(register.openedAt) : "N/A"}
              </span>
            </div>
          </div>

          {/* Breakdown Summary Table */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 text-xs">
            <div className="flex justify-between items-center p-2.5">
              <span className="text-muted-foreground">{isKm ? "ទឹកប្រាក់ដើមគ្រា (Opening Cash):" : "Opening Cash Balance:"}</span>
              <span className="font-mono font-semibold text-slate-900 dark:text-slate-100">
                ${openingBalance.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between items-center p-2.5">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <span className="size-1.5 rounded-full bg-emerald-500" />
                {isKm ? "ការលក់សរុប (Total Sales):" : "Total Sales Revenue:"}
                <span className="text-[10px] text-muted-foreground">({register?.saleCount || 0} bills)</span>
              </span>
              <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                +${totalSales.toFixed(2)}
              </span>
            </div>
            {totalReturns > 0 && (
              <div className="flex justify-between items-center p-2.5">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <span className="size-1.5 rounded-full bg-rose-500" />
                  {isKm ? "ការសងទំនិញវិញ (Total Returns):" : "Total Returns:"}
                </span>
                <span className="font-mono font-semibold text-rose-500">
                  -${totalReturns.toFixed(2)}
                </span>
              </div>
            )}
            <div className="flex justify-between items-center p-3 bg-sky-50/80 dark:bg-sky-950/30 font-bold text-sky-900 dark:text-sky-200">
              <span className="flex items-center gap-1.5">
                <Scale className="size-4 text-sky-600" />
                {isKm ? "ទឹកប្រាក់រំពឹងទុកក្នុងថត (Expected Cash):" : "Expected Cash in Drawer:"}
              </span>
              <span className="font-mono text-sm">${expectedBalance.toFixed(2)}</span>
            </div>
          </div>

          {/* Counted Cash Input */}
          <div className="space-y-1.5 pt-1">
            <Label className="text-xs font-semibold flex items-center justify-between text-slate-800 dark:text-slate-200">
              <span className="flex items-center gap-1.5">
                <DollarSign className="size-3.5 text-slate-500" />
                {isKm ? "ទឹកប្រាក់រាប់បានជាក់ស្តែងក្នុងថត (Counted Cash)" : "Counted Closing Cash"}
                <span className="text-rose-500">*</span>
              </span>
              <span className="text-[10px] text-muted-foreground font-normal">
                {isKm ? "រាប់លុយជាក់ស្តែងទាំងអស់ក្នុងថត" : "Physical cash count in drawer"}
              </span>
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">
                $
              </span>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={closingBalanceInput}
                onChange={(e) => setClosingBalanceInput(e.target.value)}
                placeholder="0.00"
                className="pl-7 h-10 text-base font-bold font-mono bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700"
              />
            </div>
          </div>

          {/* Difference Card */}
          <div
            className={`rounded-xl p-3 border flex items-center justify-between text-xs transition-colors ${
              Math.abs(difference) < 0.005
                ? "bg-blue-50/70 border-blue-200 text-blue-900 dark:bg-blue-950/40 dark:border-blue-800 dark:text-blue-200"
                : difference > 0
                ? "bg-emerald-50/70 border-emerald-200 text-emerald-900 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-200"
                : "bg-rose-50/70 border-rose-200 text-rose-900 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-200"
            }`}
          >
            <div className="flex items-center gap-2">
              {Math.abs(difference) < 0.005 ? (
                <CheckCircle2 className="size-4 text-blue-600 shrink-0" />
              ) : difference > 0 ? (
                <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertTriangle className="size-4 text-rose-600 shrink-0" />
              )}
              <span className="font-semibold">
                {Math.abs(difference) < 0.005
                  ? isKm ? "ទឹកប្រាក់ត្រូវគ្នាទាំងស្រុង (Balanced)" : "Drawer is perfectly balanced"
                  : difference > 0
                  ? isKm ? "ទឹកប្រាក់លើស (Cash Over)" : "Cash Over (Surplus)"
                  : isKm ? "ទឹកប្រាក់ខ្វះ (Cash Short)" : "Cash Short (Shortage)"}
              </span>
            </div>
            <div className="font-mono font-bold text-sm">
              {difference > 0 ? `+$${difference.toFixed(2)}` : difference < 0 ? `-$${Math.abs(difference).toFixed(2)}` : "$0.00"}
            </div>
          </div>

          {/* Closing Note */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              {isKm ? "ចំណាំ / មតិយោបល់ (Note)" : "Closing Remarks / Notes"}
            </Label>
            <Textarea
              rows={2}
              value={closingNote}
              onChange={(e) => setClosingNote(e.target.value)}
              placeholder={isKm ? "ចំណាំបន្ថែមនៅពេលបិទវេន..." : "Optional notes regarding shift closure or cash discrepancy..."}
              className="text-xs resize-none bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700"
            />
          </div>
        </div>

        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3 shrink-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={closeMutation.isPending}
            className="text-xs h-9 px-4 rounded-lg font-medium cursor-pointer"
          >
            {isKm ? "បោះបង់" : "Cancel"}
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleCloseRegister}
            disabled={closeMutation.isPending}
            className="text-xs h-9 px-5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold cursor-pointer shadow-sm"
          >
            {closeMutation.isPending ? (
              <>
                <Loader2 className="size-3.5 animate-spin mr-1.5" />
                {isKm ? "កំពុងបិទ..." : "Closing..."}
              </>
            ) : isKm ? (
              "បញ្ជាក់ការបិទបញ្ជី"
            ) : (
              "Confirm & Close Register"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
