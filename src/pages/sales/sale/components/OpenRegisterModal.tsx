import { useState, useEffect, useMemo } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DetailGrid, DetailItem } from "@/components/ui/detail-list";
import { useCashRegister } from "@/hooks/sales/useCashRegister";
import { useStore } from "@/hooks/inventory/useStore";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/store/useAuth";
import { Info, KeyRound, Loader2, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
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
  const { t } = useLanguage();
  const { user } = useAuth();
  const { data: storeData } = useStore.useGetAllStore();
  const stores = storeData?.payload?.data ?? [];

  const [storeId, setStoreId] = useState<string>("");
  const [openingBalance, setOpeningBalance] = useState<string>("0.00");

  const cashierName = useMemo(() => {
    if (user?.firstName || user?.lastName) {
      return `${user.firstName || ""} ${user.lastName || ""}`.trim();
    }
    return user?.username || t("pos.cashier", "Cashier");
  }, [user, t]);

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
      toast.error(t("pos.select_store_error", "Please select a store"));
      return;
    }

    const balanceNum = parseFloat(openingBalance);
    if (isNaN(balanceNum) || balanceNum < 0) {
      toast.error(t("pos.opening_cash_error", "Opening cash must be 0 or more"));
      return;
    }

    try {
      await openMutation.mutateAsync({
        storeId: Number(storeId),
        openingBalance: balanceNum,
      });
      onOpenChange(false);
      onSuccess?.();
    } catch {
      // Handled by mutationHandler
    }
  };

  const currentAmountNum = parseFloat(openingBalance) || 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader className="flex-row items-center gap-3.5">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary-light text-primary">
            <KeyRound className="size-5" strokeWidth={1.75} />
          </span>
          <div className="min-w-0 space-y-0.5">
            <DialogTitle>{t("pos.open_register_title", "Open Cash Register")}</DialogTitle>
            <DialogDescription>
              {t("pos.open_register_desc", "Count the cash in your drawer to start the shift.")}
            </DialogDescription>
          </div>
        </DialogHeader>

        <div className="space-y-5">
          <DetailGrid className="gap-y-3 p-3.5">
            <DetailItem label={t("pos.cashier", "Cashier")}>{cashierName}</DetailItem>
            <DetailItem label={t("pos.shift_start", "Shift start")}>
              <span className="tabular-nums">{currentDateFormatted}</span>
            </DetailItem>
          </DetailGrid>

          {/* Store */}
          <div className="space-y-2">
            <Label htmlFor="open-register-store" className="text-[14px] leading-5">
              {t("pos.store_branch", "Store / Branch")}
              <span className="text-destructive">*</span>
            </Label>
            <Select value={storeId} onValueChange={setStoreId}>
              <SelectTrigger id="open-register-store" className="h-10 w-full text-[14px]">
                <SelectValue placeholder={t("pos.select_store", "Select store")} />
              </SelectTrigger>
              <SelectContent>
                {stores.map((s: any) => (
                  <SelectItem key={s.id} value={String(s.id)}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Opening cash */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="open-register-cash" className="text-[14px] leading-5">
                {t("pos.opening_cash", "Opening cash")}
                <span className="text-destructive">*</span>
              </Label>
              {currentAmountNum > 0 && (
                <button
                  type="button"
                  onClick={() => setOpeningBalance("0.00")}
                  className="inline-flex cursor-pointer items-center gap-1 text-[13px] font-medium text-muted-foreground hover:text-foreground"
                >
                  <RotateCcw className="size-3.5" />
                  {t("pos.btn_reset", "Reset")}
                </button>
              )}
            </div>

            <div className="relative">
              <span className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-[20px] font-semibold text-muted-foreground">
                $
              </span>
              <Input
                id="open-register-cash"
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0"
                value={openingBalance}
                onChange={(e) => setOpeningBalance(e.target.value)}
                onFocus={(e) => e.target.select()}
                placeholder="0.00"
                className="h-12 pl-8 text-[20px] font-semibold tabular-nums"
              />
            </div>

            <div className="space-y-1.5 pt-1">
              <span className="block text-[13px] text-muted-foreground">
                {t("pos.quick_amounts", "Quick amounts")}
              </span>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                {CASH_PRESETS.map((preset) => {
                  const isSelected = Math.abs(currentAmountNum - preset) < 0.001;
                  return (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setOpeningBalance(preset.toFixed(2))}
                      aria-pressed={isSelected}
                      className={cn(
                        "h-9 cursor-pointer rounded-lg border text-[14px] font-medium tabular-nums transition-colors",
                        isSelected
                          ? "border-primary bg-primary-light text-primary"
                          : "border-border bg-card text-text-secondary hover:border-border-strong hover:text-foreground"
                      )}
                    >
                      ${preset}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <p className="flex items-start gap-2 text-[13px] leading-5 text-muted-foreground">
            <Info className="mt-0.5 size-4 shrink-0" />
            {t(
              "pos.opening_cash_hint",
              "This is your starting drawer float. Cash sales made during the shift are added on top of it."
            )}
          </p>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={openMutation.isPending}
          >
            {t("common.cancel", "Cancel")}
          </Button>
          <Button type="button" onClick={handleOpenRegister} disabled={openMutation.isPending}>
            {openMutation.isPending ? <Loader2 className="animate-spin" /> : <KeyRound />}
            {openMutation.isPending ? t("pos.opening", "Opening...") : t("pos.open_register", "Open Register")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
