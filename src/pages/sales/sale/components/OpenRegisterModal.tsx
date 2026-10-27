import { useState, useEffect, useMemo } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCashRegister } from "@/hooks/sales/useCashRegister";
import { useStore } from "@/hooks/inventory/useStore";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/store/useAuth";
import {
  DollarSign,
  Store,
  KeyRound,
  Loader2,
  User,
  Calendar,
  Info,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";
import { formatDate } from "@/utils/formatDate";

interface OpenRegisterModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  defaultStoreId?: number;
}

const CASH_PRESETS = [0, 20, 50, 100, 200, 300];

export default function OpenRegisterModal({
  open,
  onOpenChange,
  onSuccess,
  defaultStoreId,
}: OpenRegisterModalProps) {
  const { language } = useLanguage();
  const isKm = language === "km";
  const { user } = useAuth();
  const { data: storeData } = useStore.useGetAllStore();
  const stores = storeData?.payload?.data ?? [];

  const [storeId, setStoreId] = useState<string>("");
  const [openingBalance, setOpeningBalance] = useState<string>("0.00");

  const cashierName = useMemo(() => {
    if (!user) return isKm ? "អ្នកគិតលុយ" : "Cashier";
    if (user.firstName || user.lastName) {
      return `${user.firstName || ""} ${user.lastName || ""}`.trim();
    }
    return user.username || (isKm ? "អ្នកគិតលុយ" : "Cashier");
  }, [user, isKm]);

  const currentDateFormatted = useMemo(() => {
    return formatDate(new Date(), "dateTime");
  }, [open]);

  useEffect(() => {
    if (defaultStoreId) {
      setStoreId(String(defaultStoreId));
    } else if (user?.storeId) {
      setStoreId(String(user.storeId));
    } else if (stores.length > 0 && !storeId) {
      setStoreId(String(stores[0].id));
    }
  }, [defaultStoreId, user?.storeId, stores, storeId]);

  const openMutation = useCashRegister.Open();

  const handleOpenRegister = async () => {
    if (!storeId) {
      toast.error(isKm ? "សូមជ្រើសរើសហាង" : "Please select a store");
      return;
    }

    const balanceNum = parseFloat(openingBalance);
    if (isNaN(balanceNum) || balanceNum < 0) {
      toast.error(
        isKm
          ? "ចំនួនទឹកប្រាក់ដើមមិនត្រឹមត្រូវ"
          : "Opening cash amount must be 0 or greater"
      );
      return;
    }

    try {
      await openMutation.mutateAsync({
        storeId: Number(storeId),
        openingBalance: balanceNum,
      });
      toast.success(
        isKm ? "បានបើកបញ្ជីលក់ជោគជ័យ" : "Cash register opened successfully"
      );
      onOpenChange(false);
      onSuccess?.();
    } catch {
      // Handled by mutationHandler
    }
  };

  const handleApplyPreset = (amount: number) => {
    setOpeningBalance(amount.toFixed(2));
  };

  const currentAmountNum = parseFloat(openingBalance) || 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-0 overflow-hidden shadow-2xl">
        {/* Modal Header */}
        <DialogHeader className="p-6 border-b border-slate-100 dark:border-slate-800 bg-linear-to-r from-blue-600/10 via-sky-500/5 to-transparent">
          <div className="flex items-center gap-3.5">
            <div className="size-11 rounded-xl bg-blue-600/15 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <KeyRound className="size-5.5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-slate-900 dark:text-white">
                {isKm ? "បើកបញ្ជីលក់ (ចាប់ផ្តើមវេន)" : "Open Cash Register (Start Shift)"}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                {isKm
                  ? "បញ្ចូលទឹកប្រាក់ដើមគ្រាក្នុងថតប្រាក់ ដើម្បីចាប់ផ្តើមលក់"
                  : "Enter the initial cash drawer amount to begin your shift"}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="p-6 space-y-5">
          {/* Cashier & Current Date Badge */}
          <div className="grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-xs">
            <div className="flex items-center gap-2 min-w-0">
              <div className="size-7 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                <User className="size-3.5" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] text-muted-foreground block leading-tight">
                  {isKm ? "អ្នកគិតលុយ" : "Cashier"}
                </span>
                <span className="font-semibold text-slate-800 dark:text-slate-200 truncate block text-xs">
                  {cashierName}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 min-w-0">
              <div className="size-7 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <Calendar className="size-3.5" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] text-muted-foreground block leading-tight">
                  {isKm ? "កាលបរិច្ឆេទ" : "Shift Time"}
                </span>
                <span className="font-semibold text-slate-800 dark:text-slate-200 truncate block text-xs">
                  {currentDateFormatted}
                </span>
              </div>
            </div>
          </div>

          {/* Store Selection */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
              <Store className="size-3.5 text-slate-400" />
              {isKm ? "សាខា" : "Store / Branch"}
              <span className="text-rose-500">*</span>
            </Label>
            <Select value={storeId} onValueChange={setStoreId}>
              <SelectTrigger className="w-full text-xs h-9 bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700">
                <SelectValue placeholder={isKm ? "ជ្រើសរើសហាង" : "Select Store"} />
              </SelectTrigger>
              <SelectContent>
                {stores.map((s: any) => (
                  <SelectItem key={s.id} value={String(s.id)} className="text-xs">
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Opening Cash Balance Input */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                <DollarSign className="size-3.5 text-slate-400" />
                {isKm ? "ទឹកប្រាក់ដើមគ្រាក្នុងថត (Opening Cash)" : "Opening Cash Balance"}
                <span className="text-rose-500">*</span>
              </Label>
              {currentAmountNum > 0 && (
                <button
                  type="button"
                  onClick={() => setOpeningBalance("0.00")}
                  className="text-[11px] text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 flex items-center gap-1 font-medium cursor-pointer"
                >
                  <RotateCcw className="size-3" />
                  {isKm ? "កំណត់ឡើងវិញ" : "Reset"}
                </button>
              )}
            </div>

            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-base font-bold text-slate-500 dark:text-slate-400">
                $
              </span>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={openingBalance}
                onChange={(e) => setOpeningBalance(e.target.value)}
                placeholder="0.00"
                className="pl-8 h-12 text-lg font-bold font-mono bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 focus-visible:ring-blue-600 tabular-nums"
              />
            </div>

            {/* Quick Cash Presets */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block">
                {isKm ? "ចំនួនទឹកប្រាក់រហ័ស (Quick Presets):" : "Quick Presets:"}
              </span>
              <div className="grid grid-cols-6 gap-2">
                {CASH_PRESETS.map((preset) => {
                  const isSelected = Math.abs(currentAmountNum - preset) < 0.001;
                  return (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => handleApplyPreset(preset)}
                      className={`h-8.5 px-1 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                        isSelected
                          ? "bg-blue-600 text-white border-blue-600 shadow-xs ring-2 ring-blue-500/20"
                          : "bg-slate-50 dark:bg-slate-800/70 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:border-blue-300"
                      }`}
                    >
                      ${preset}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Helper Info Note */}
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 text-xs text-blue-700 dark:text-blue-300">
              <Info className="size-4 shrink-0 mt-0.5" />
              <p className="leading-snug">
                {isKm
                  ? "ចំនួនទឹកប្រាក់នេះជាប្រាក់ដើមគ្រាក្នុងថត។ ប្រាក់លក់ដែលទទួលបានក្នុងវេននេះ នឹងបូកបន្ថែមលើចំនួននេះ។"
                  : "This amount is recorded as your initial drawer float. Cash sales made during this shift will accumulate on top of this balance."}
              </p>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={openMutation.isPending}
            className="text-xs h-9 px-4 rounded-lg font-medium cursor-pointer"
          >
            {isKm ? "បោះបង់" : "Cancel"}
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleOpenRegister}
            disabled={openMutation.isPending}
            className="text-xs h-9 px-5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold cursor-pointer shadow-sm flex items-center gap-1.5"
          >
            {openMutation.isPending ? (
              <>
                <Loader2 className="size-3.5 animate-spin" />
                {isKm ? "កំពុងបើក..." : "Opening..."}
              </>
            ) : (
              <>
                <KeyRound className="size-3.5" />
                {isKm ? "បើកបញ្ជីលក់" : "Open Register"}
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
