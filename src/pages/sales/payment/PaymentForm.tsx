import React, { useState, useMemo, useEffect } from "react";
import {
  Plus,
  Trash2,
  X,
  CheckCircle,
  AlertCircle,
  Calculator,
  Loader2,
  CreditCard,
  Coins,
  Receipt,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { useCurrency } from "@/hooks/finance/useCurrency";
import { useBank } from "@/hooks/finance/useBank";
import { usePayment } from "@/hooks/sales/usePayment";
import type { PaymentRequest } from "@/types/sales/Payment";
import { useLanguage } from "@/i18n/LanguageContext";

// ==========================================
// FALLBACK AND EXTRACTION HELPERS
// ==========================================

const extractArray = (resp: any): any[] => {
  if (!resp) return [];
  if (Array.isArray(resp)) return resp;
  if (Array.isArray(resp?.payload?.data)) return resp.payload.data;
  if (Array.isArray(resp?.payload?.content)) return resp.payload.content;
  if (Array.isArray(resp?.payload)) return resp.payload;
  if (Array.isArray(resp?.data?.data)) return resp.data.data;
  if (Array.isArray(resp?.data?.content)) return resp.data.content;
  if (Array.isArray(resp?.data)) return resp.data;
  if (Array.isArray(resp?.content)) return resp.content;
  return [];
};

const getCurrencyFlag = (code?: string): string => {
  if (!code) return "USD";
  const upper = code.toUpperCase();
  if (upper === "USD") return "USD";
  if (upper === "KHR") return "KHR";
  return upper || "USD";
};

// Fallback currencies ONLY if database has no currency records yet
const DEFAULT_FALLBACK_CURRENCIES = [
  { id: 1, code: "USD", name: "US Dollar", rate: 1.0, operation: "*", symbol: "$", flag: "USD" },
  { id: 2, code: "KHR", name: "Khmer Riel", rate: 4100.0, operation: "/", symbol: "៛", flag: "KHR" },
];

export interface PaymentLineItemState {
  id: string;
  currencyId: number;
  paymentMethod: string;
  amount: number | "";
  bankId: number | null;
  transactionNo: string;
}

// Local alias used by useState
type PaymentLine = PaymentLineItemState;

export interface PaymentFormProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  payment?: any;
  mode?: "sale" | "purchase";
  saleId?: number;
  purchaseId?: number;
  orderRef?: string;
  amount?: number;
  totalBill?: number;
  onClose?: () => void;
  onPaymentSubmit?: (request: PaymentRequest) => Promise<boolean | void>;
  onComplete?: (data: any) => void;
  currencies?: any[];
  banks?: any[];
}

export const PaymentForm: React.FC<PaymentFormProps> = ({
  open,
  setOpen,
  mode = "sale",
  saleId,
  purchaseId,
  orderRef,
  amount,
  totalBill: propTotalBill,
  onClose,
  onPaymentSubmit,
  onComplete,
  currencies: propCurrencies,
  banks: propBanks,
}) => {
  const { t } = useLanguage();

  // Queries for live currencies and banks directly from database
  const { data: currencyData } = useCurrency.GetAllCurrency({
    page: 1,
    size: 1000,
  });
  const { data: bankData } = useBank.useGetAllBank({
    page: 1,
    size: 1000,
  });
  const createPaymentMutation = usePayment.createPayment();

  // Effective Total Bill
  const effectiveTotalBill = Number(amount ?? propTotalBill ?? 0);

  // ── Currencies: props → database → fallback ──
  const currencies = useMemo(() => {
    const rawList = propCurrencies && propCurrencies.length > 0 ? propCurrencies : extractArray(currencyData);
    if (Array.isArray(rawList) && rawList.length > 0) {
      return rawList
        .filter((c: any) => {
          if (!c.status) return true;
          const s = String(c.status).toUpperCase();
          return s === "ACT" || s === "ACTIVE";
        })
        .map((c: any) => ({
          id: c.id,
          code: c.code || "",
          name: c.name || c.code || "",
          rate: Number(c.rate) > 0 ? Number(c.rate) : 1,
          operation: c.operation || (c.code?.toUpperCase() === "USD" ? "*" : "/"),
          symbol: c.symbol || (c.code?.toUpperCase() === "USD" ? "$" : c.code?.toUpperCase() === "KHR" ? "៛" : c.code),
          flag: getCurrencyFlag(c.code),
        }));
    }
    return [];
  }, [propCurrencies, currencyData]);

  // Active Currencies: database currencies take priority; fallback only if database has 0 currencies
  const activeCurrencies = useMemo(() => {
    return currencies.length > 0 ? currencies : DEFAULT_FALLBACK_CURRENCIES;
  }, [currencies]);

  // Primary Default Currency (prefer USD from database, else first available)
  const defaultCurrency = useMemo(() => {
    return (
      activeCurrencies.find((c) => c.code?.toUpperCase() === "USD") ||
      activeCurrencies[0]
    );
  }, [activeCurrencies]);

  // ── Banks: props → database ──
  const banks = useMemo(() => {
    const rawList = propBanks && propBanks.length > 0 ? propBanks : extractArray(bankData);
    if (Array.isArray(rawList) && rawList.length > 0) {
      return rawList
        .filter((b: any) => {
          if (!b.status) return true;
          const s = String(b.status).toUpperCase();
          return s === "ACT" || s === "ACTIVE";
        })
        .map((b: any) => {
          const parts = [
            b.name,
            b.accountName,
            b.accountNumber ? `(${b.accountNumber})` : "",
          ].filter(Boolean);
          return {
            id: b.id,
            name: b.name || "Bank",
            accountName: b.accountName || "",
            accountNumber: b.accountNumber || "",
            displayName: parts.join(" - ") || b.name || b.name || b.accountNumber || `Bank #${b.id}`,
            code: (b.name || "BANK").slice(0, 4).toUpperCase(),
            logo: "🏦",
          };
        });
    }
    return [];
  }, [propBanks, bankData]);

  // ── Derived helpers ──
  const khrCurrency = useMemo(() => {
    return activeCurrencies.find((c) => c.code?.toUpperCase() === "KHR");
  }, [activeCurrencies]);

  const khrRate = useMemo(() => {
    return khrCurrency ? Number(khrCurrency.rate) : 4100;
  }, [khrCurrency]);

  const calculateBase = (amt: number | "", currencyId: number): number => {
    if (amt === "" || amt === 0 || isNaN(Number(amt))) return 0;
    const num = Number(amt);
    const curr = activeCurrencies.find((c) => c.id === currencyId);
    if (!curr) return num;
    if (curr.code?.toUpperCase() === "USD") return num;
    const rate = Number(curr.rate) || 1;
    if (curr.operation === "*") {
      return num * rate;
    }
    return num / rate;
  };

  const [note, setNote] = useState("");
  const [lines, setLines] = useState<PaymentLine[]>([
    {
      id: crypto.randomUUID(),
      currencyId: defaultCurrency ? defaultCurrency.id : 1,
      paymentMethod: "CASH",
      amount:
        effectiveTotalBill > 0
          ? defaultCurrency?.code?.toUpperCase() === "KHR"
            ? Math.round(effectiveTotalBill * khrRate)
            : Number(effectiveTotalBill.toFixed(2))
          : "",
      bankId: null,
      transactionNo: "",
    },
  ]);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Currency switch handler with automatic conversion (e.g. USD -> KHR: amount * rate)
  const handleCurrencyChange = (lineId: string, newCurrencyId: number) => {
    setLines((prev) =>
      prev.map((l) => {
        if (l.id !== lineId) return l;
        const oldCurr = activeCurrencies.find((c) => c.id === l.currencyId);
        const newCurr = activeCurrencies.find((c) => c.id === newCurrencyId);

        let newAmount = l.amount;
        if (
          l.amount !== "" &&
          !isNaN(Number(l.amount)) &&
          oldCurr &&
          newCurr &&
          oldCurr.id !== newCurr.id
        ) {
          // Convert existing amount from old currency to base USD first
          const oldRate = Number(oldCurr.rate) || 1;
          const baseUSD =
            oldCurr.code?.toUpperCase() === "USD"
              ? Number(l.amount)
              : oldCurr.operation === "*"
                ? Number(l.amount) * oldRate
                : Number(l.amount) / oldRate;

          // Convert base USD to the newly selected currency
          const newRate = Number(newCurr.rate) || 1;
          if (newCurr.code?.toUpperCase() === "USD") {
            newAmount = Number(baseUSD.toFixed(2));
          } else if (newCurr.code?.toUpperCase() === "KHR") {
            // Amount if Khmer: USD amount * rate from currency
            newAmount = Math.round(baseUSD * newRate);
          } else {
            newAmount =
              newCurr.operation === "*"
                ? Number((baseUSD / newRate).toFixed(2))
                : Math.round(baseUSD * newRate);
          }
        }

        return {
          ...l,
          currencyId: newCurrencyId,
          amount: newAmount,
        };
      })
    );
  };

  // Add split line: calculates remaining due in target currency (if KHR, due * rate)
  const addLine = (currencyIdOrCode?: number | string) => {
    let curr = defaultCurrency;
    if (typeof currencyIdOrCode === "number") {
      curr = activeCurrencies.find((c) => c.id === currencyIdOrCode) || defaultCurrency;
    } else if (typeof currencyIdOrCode === "string") {
      curr =
        activeCurrencies.find((c) => c.code?.toUpperCase() === currencyIdOrCode.toUpperCase()) ||
        defaultCurrency;
    }
    const targetCurrency = curr || defaultCurrency;
    const targetCurrencyId = targetCurrency ? targetCurrency.id : (defaultCurrency ? defaultCurrency.id : 1);

    // Calculate suggested amount based on remaining due (or total bill if remaining is 0)
    const baseTargetUSD = dueAmountUSD > 0.001 ? dueAmountUSD : 0;
    let suggestedAmount: number | "" = "";

    if (baseTargetUSD > 0) {
      if (targetCurrency?.code?.toUpperCase() === "KHR") {
        const rate = Number(targetCurrency.rate) || khrRate;
        suggestedAmount = Math.round(baseTargetUSD * rate);
      } else if (targetCurrency?.code?.toUpperCase() === "USD") {
        suggestedAmount = Number(baseTargetUSD.toFixed(2));
      } else {
        const rate = Number(targetCurrency?.rate) || 1;
        suggestedAmount =
          targetCurrency?.operation === "*"
            ? Number((baseTargetUSD / rate).toFixed(2))
            : Math.round(baseTargetUSD * rate);
      }
    }

    setLines((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        currencyId: targetCurrencyId,
        paymentMethod: "CASH",
        amount: suggestedAmount,
        bankId: null,
        transactionNo: "",
      },
    ]);
  };

  // Sync initial bill amount & sync currency ID with database when modal opens or database loads
  useEffect(() => {
    if (open && defaultCurrency) {
      setLines((prev) => {
        // When opening fresh or only having 1 line matching full bill
        if (
          prev.length === 0 ||
          (prev.length === 1 && (!prev[0].amount || prev[0].amount === effectiveTotalBill))
        ) {
          const isKHR = defaultCurrency.code?.toUpperCase() === "KHR";
          const initAmount =
            effectiveTotalBill > 0
              ? isKHR
                ? Math.round(effectiveTotalBill * (Number(defaultCurrency.rate) || khrRate))
                : Number(effectiveTotalBill.toFixed(2))
              : "";

          return [
            {
              id: prev[0]?.id || crypto.randomUUID(),
              currencyId: defaultCurrency.id,
              paymentMethod: prev[0]?.paymentMethod || "CASH",
              amount: initAmount,
              bankId: prev[0]?.bankId || null,
              transactionNo: prev[0]?.transactionNo || "",
            },
          ];
        }

        // Validate that each existing line has a currency ID that exists in activeCurrencies
        const hasInvalidCurrency = prev.some(
          (l) => !activeCurrencies.some((c) => c.id === l.currencyId)
        );
        if (hasInvalidCurrency) {
          return prev.map((l) =>
            activeCurrencies.some((c) => c.id === l.currencyId)
              ? l
              : { ...l, currencyId: defaultCurrency.id }
          );
        }

        return prev;
      });
      setNote("");
    }
  }, [open, effectiveTotalBill, defaultCurrency, activeCurrencies, khrRate]);

  // Calculate sum of all payment lines in USD
  const totalReceivedUSD = useMemo(() => {
    return lines.reduce((sum, item) => sum + calculateBase(item.amount, item.currencyId), 0);
  }, [lines, activeCurrencies]);

  const dueAmountUSD = Math.max(0, effectiveTotalBill - totalReceivedUSD);
  const returnAmountUSD = Math.max(0, totalReceivedUSD - effectiveTotalBill);
  const returnAmountKHR = Math.round(returnAmountUSD * khrRate);

  const removeLine = (id: string) => {
    if (lines.length === 1) return;
    setLines((prev) => prev.filter((l) => l.id !== id));
  };

  const updateLine = (id: string, field: keyof PaymentLineItemState, value: any) => {
    setLines((prev) =>
      prev.map((l) => {
        if (l.id === id) {
          const updated = { ...l, [field]: value };
          if (field === "paymentMethod" && value === "CASH") {
            updated.bankId = null;
            updated.transactionNo = "";
          }
          return updated;
        }
        return l;
      })
    );
  };

  // Fast cash tender helper (if Khmer: effectiveTotalBill * rate)
  const setExactTender = (currencyIdOrCode: number | string) => {
    let curr = defaultCurrency;
    if (typeof currencyIdOrCode === "number") {
      curr = activeCurrencies.find((c) => c.id === currencyIdOrCode) || defaultCurrency;
    } else if (typeof currencyIdOrCode === "string") {
      curr =
        activeCurrencies.find((c) => c.code?.toUpperCase() === currencyIdOrCode.toUpperCase()) ||
        defaultCurrency;
    }
    if (!curr) return;

    let exactAmount = 0;
    if (curr.code?.toUpperCase() === "USD") {
      exactAmount = Number(effectiveTotalBill.toFixed(2));
    } else if (curr.code?.toUpperCase() === "KHR") {
      // Amount if Khmer: effectiveTotalBill * rate from currency
      const rate = Number(curr.rate) || khrRate;
      exactAmount = Math.round(effectiveTotalBill * rate);
    } else {
      const rate = Number(curr.rate) || 1;
      exactAmount =
        curr.operation === "*"
          ? Number((effectiveTotalBill / rate).toFixed(2))
          : Math.round(effectiveTotalBill * rate);
    }

    setLines([
      {
        id: crypto.randomUUID(),
        currencyId: curr.id,
        paymentMethod: "CASH",
        amount: exactAmount,
        bankId: null,
        transactionNo: "",
      },
    ]);
  };

  // Build Backend Payload
  const buildPayload = (): PaymentRequest => {
    const linePayloads = lines.map((l) => ({
      currencyId: l.currencyId || null,
      paymentMethod: l.paymentMethod || "CASH",
      amount: Number(l.amount) || 0,
      bankId: l.bankId || null,
      transactionNo: l.transactionNo?.trim() || null,
    }));

    const paymentPrefix = mode === "purchase" ? "PPAY" : "SPAY";
    const refId = (mode === "purchase" ? purchaseId : saleId) || Date.now();
    const paymentNo = `${paymentPrefix}-${refId}-${Date.now().toString().slice(-4)}`;

    return {
      paymentNo,
      totalAmount: Number(effectiveTotalBill.toFixed(2)),
      receivedAmount: Number(totalReceivedUSD.toFixed(2)),
      returnAmount: Number(returnAmountUSD.toFixed(2)),
      dueAmount: Number(dueAmountUSD.toFixed(2)),
      status: dueAmountUSD <= 0.005 ? "PAID" : "PARTIAL",
      paymentDate: new Date().toISOString(),
      note: note.trim() || null,
      saleId: mode === "sale" ? (saleId ?? null) : null,
      purchaseId: mode === "purchase" ? (purchaseId ?? null) : null,
      userId: 1,
      lines: linePayloads,

      // Compatibility / legacy fields
      paymentLines: linePayloads,
      payments: linePayloads,
      amount: Number(effectiveTotalBill.toFixed(2)),
      paymentMethod: linePayloads[0]?.paymentMethod || "CASH",
      bankId: linePayloads[0]?.bankId || null,
      transactionNo: linePayloads[0]?.transactionNo || null,
      idempotencyKey: `IDEM-${mode.toUpperCase()}-${refId}-${Date.now()}`,
    };
  };

  const handleClose = () => {
    setOpen(false);
    onClose?.();
  };

  const handleSubmit = async () => {
    if (totalReceivedUSD < effectiveTotalBill - 0.001) {
      toast.error(
        `${t("payment.tender_full", "Please tender the full amount")} ($${dueAmountUSD.toFixed(2)} ${t("payment.remaining_due", "Remaining Due")}).`
      );
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = buildPayload();

      // If parent provided onPaymentSubmit callback
      if (onPaymentSubmit) {
        const success = await onPaymentSubmit(payload);
        if (success !== false) {
          handleClose();
        }
        return;
      }

      // Standalone direct API submit
      await createPaymentMutation.mutateAsync(payload);
      // toast.success(
      //   mode === "purchase"
      //     ? "Purchase payment recorded successfully!"
      //     : "Sale payment recorded successfully!"
      // );

      if (onComplete) {
        onComplete({
          ...payload,
          totalReceivedUSD,
          changeUSD: returnAmountUSD,
          changeKHR: returnAmountKHR,
        });
      }

      handleClose();
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        (typeof err?.response?.data === "string" ? err.response.data : null) ||
        err?.message ||
        t("payment.failed", "Payment submission failed.");
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!open) return null;

  const isPurchase = mode === "purchase";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-slate-900/40 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-white text-slate-800 rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200/80 flex flex-col overflow-hidden my-auto max-h-[92vh]">
        {/* MODAL HEADER */}
        <div className="bg-white px-6 py-4 flex justify-between items-center border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center ${isPurchase
                ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                : "bg-blue-50 text-blue-600 border border-blue-100"
                }`}
            >
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 leading-tight">
                  {isPurchase
                    ? t("payment.title_purchase", "Purchase Payment")
                    : t("payment.title_sale", "Payment Checkout")}
                </h2>
              </div>
            </div>
          </div>
          <span className="text-[10px] font-medium text-slate-400 block mt-0.5">
            {t("payment.exchange_rate", "Exchange Rate")}: 1 USD = {khrRate.toLocaleString()} {khrCurrency?.symbol || "៛"}
          </span>
          <button
            type="button"
            onClick={handleClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
            title={t("common.close", "Close")}
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* MODAL BODY */}
        <div className="p-6 overflow-y-auto flex-1 bg-white">
          {/* TOTAL PAYABLE BANNER (CLEAN & MODERN) */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-slate-50 via-blue-50/20 to-slate-50 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  {t("payment.total_payable", "Total Payable")}
                </span>
              </div>
              <div className="flex items-baseline gap-2.5 mt-1">
                <span className={`text-3xl font-extrabold font-mono tracking-tight ${isPurchase ? "text-emerald-600" : "text-blue-600"}`}>
                  ${effectiveTotalBill.toFixed(2)}
                </span>
                <span className="text-xs font-bold text-slate-400">USD</span>
                <span className="text-sm font-bold font-mono text-emerald-600 ml-1">
                  = {(effectiveTotalBill * khrRate).toLocaleString()} {khrCurrency?.symbol || "៛"}
                </span>
              </div>

            </div>
          </div>

          {/* PAYMENT METHOD LINES */}
          <div className="space-y-3.5">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                  {t("payment.payment_methods", "Payment Methods")}
                </span>
              </div>

              <div className="flex items-center gap-1.5 flex-wrap">
                {activeCurrencies.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => addLine(c.id)}
                    className="text-xs font-semibold px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 shadow-2xs transition cursor-pointer flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5 text-slate-400" />
                    <span>{t("payment.add_split", "+{code} Split").replace("{code}", c.code)}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Split Lines List */}
            <div className="space-y-3">
              {lines.map((line) => {
                const selectedCurrency = activeCurrencies.find((c) => c.id === line.currencyId);
                const isKHR = selectedCurrency?.code?.toUpperCase() === "KHR";
                const baseEq = calculateBase(line.amount, line.currencyId);
                const convertedPreview =
                  line.amount !== "" && !isNaN(Number(line.amount))
                    ? isKHR
                      ? `≈ $${baseEq.toFixed(2)} USD`
                      : `≈ ${(Number(line.amount) * khrRate).toLocaleString()} ${khrCurrency?.symbol || "៛"}`
                    : null;

                return (
                  <div
                    key={line.id}
                    className="p-3.5 bg-slate-50/70 hover:bg-slate-50 rounded-xl border border-slate-200/80 transition-all space-y-3"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-start">
                      {/* Method */}
                      <div className="sm:col-span-4">
                        <label className="text-[11px] font-semibold text-slate-500 block mb-1.5">
                          {t("payment.method", "Method")}
                        </label>
                        <select
                          value={line.paymentMethod}
                          onChange={(e) => updateLine(line.id, "paymentMethod", e.target.value)}
                          className="w-full text-xs font-semibold rounded-lg h-10 px-3 bg-white border border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-slate-800 cursor-pointer shadow-2xs"
                        >
                          <option value="CASH">{t("payment.method_cash", "Cash")}</option>
                          <option value="BANK_TRANSFER">{t("payment.method_bank", "Bank / KHQR")}</option>
                        </select>
                      </div>

                      {/* Currency */}
                      <div className="sm:col-span-3">
                        <label className="text-[11px] font-semibold text-slate-500 block mb-1.5">
                          {t("payment.currency", "Currency")}
                        </label>
                        <select
                          value={line.currencyId}
                          onChange={(e) => handleCurrencyChange(line.id, Number(e.target.value))}
                          className="w-full text-xs font-bold rounded-lg h-10 px-2.5 bg-white border border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-slate-800 cursor-pointer shadow-2xs"
                        >
                          {activeCurrencies.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.flag ? `${c.flag} ` : ""}{c.code} ({c.symbol})
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Amount */}
                      <div className="sm:col-span-4">
                        <label className="text-[11px] font-semibold text-slate-500 block mb-1.5 flex items-center justify-between">
                          <span>{t("payment.amount", "Amount")}</span>
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400 select-none">
                            {selectedCurrency?.symbol || "$"}
                          </span>
                          <input
                            type="number"
                            step="any"
                            placeholder={isKHR ? "0 (KHR)" : "0.00"}
                            value={line.amount}
                            onChange={(e) =>
                              updateLine(
                                line.id,
                                "amount",
                                e.target.value === "" ? "" : parseFloat(e.target.value)
                              )
                            }
                            className="w-full text-sm font-bold font-mono rounded-lg h-10 pl-8 pr-3 bg-white border border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-slate-900 shadow-2xs"
                          />
                        </div>
                      </div>

                      {/* Remove Button */}
                      <div className="sm:col-span-1 flex justify-end items-center pt-2 sm:pt-6">
                        <button
                          type="button"
                          onClick={() => removeLine(line.id)}
                          disabled={lines.length === 1}
                          title={t("payment.remove_line", "Remove split line")}
                          className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg disabled:opacity-20 disabled:hover:text-slate-400 disabled:hover:bg-transparent transition cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Bank / Reference details */}
                    {line.paymentMethod !== "CASH" && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2.5 pl-3 border-l-2 border-blue-500 bg-blue-50/30 rounded-r-lg">
                        <div>
                          <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                            {t("payment.bank_account", "Bank Account")}
                          </label>
                          <select
                            value={line.bankId || ""}
                            onChange={(e) =>
                              updateLine(line.id, "bankId", e.target.value ? Number(e.target.value) : null)
                            }
                            className="w-full text-xs font-medium rounded-lg h-9 px-2.5 bg-white border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-700 shadow-2xs"
                          >
                            <option value="">{t("payment.choose_bank", "-- Choose Bank --")}</option>
                            {banks.map((b) => (
                              <option key={b.id} value={b.id}>
                                {b.displayName}
                              </option>
                            ))}
                          </select>
                          {banks.length === 0 && (
                            <span className="text-[10px] text-amber-600 block mt-1 font-medium">
                              {t("payment.no_banks", "No active bank accounts in database")}
                            </span>
                          )}
                        </div>
                        <div>
                          <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                            {t("payment.txn_reference", "Txn Reference")}
                          </label>
                          <input
                            type="text"
                            placeholder={t("payment.txn_placeholder", "e.g. TXN-12345")}
                            value={line.transactionNo}
                            onChange={(e) => updateLine(line.id, "transactionNo", e.target.value)}
                            className="w-full text-xs font-mono rounded-lg h-9 px-3 bg-white border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-700 shadow-2xs"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* NOTE INPUT */}
          <div>
            <label className="text-[11px] font-semibold text-slate-500 block mb-1.5">
              {t("payment.note", "Note")}
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={t("payment.note_placeholder", "Add payment note or remarks...")}
              className="w-full text-xs rounded-lg h-10 px-3 border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white text-slate-700 placeholder:text-slate-400 shadow-2xs"
            />
          </div>

          {/* SETTLEMENT SUMMARY BREAKDOWN */}
          <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/80 space-y-2.5">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500 font-medium">
                {t("payment.total_received", "Total Received")}:
              </span>
              <div className="text-right">
                <span className="font-mono font-bold text-slate-800 text-sm">
                  ${totalReceivedUSD.toFixed(2)} USD
                </span>
                <span className="text-xs text-slate-400 font-mono ml-2">
                  ({Math.round(totalReceivedUSD * khrRate).toLocaleString()} {khrCurrency?.symbol || "៛"})
                </span>
              </div>
            </div>

            {dueAmountUSD > 0.001 && (
              <div className="flex justify-between items-center text-xs pt-2 border-t border-slate-200/60">
                <span className="flex items-center gap-1.5 text-rose-600 font-bold">
                  <AlertCircle className="w-4 h-4 text-rose-500" />
                  <span>{t("payment.remaining_due", "Remaining Due")}:</span>
                </span>
                <div className="text-right">
                  <span className="font-mono text-sm font-extrabold text-rose-600">
                    ${dueAmountUSD.toFixed(2)} USD
                  </span>
                  <span className="text-xs text-rose-500 font-semibold font-mono ml-2">
                    ({Math.round(dueAmountUSD * khrRate).toLocaleString()} {khrCurrency?.symbol || "៛"})
                  </span>
                </div>
              </div>
            )}

            {returnAmountUSD >= 0 && dueAmountUSD <= 0.001 && (
              <div className="flex justify-between items-center text-xs pt-2 border-t border-slate-200/60">
                <span className="flex items-center gap-1.5 text-emerald-600 font-bold">
                  <span>{t("payment.change_return", "Change Return")}:</span>
                </span>
                <div className="text-right">
                  <span className="font-mono text-base font-extrabold text-emerald-600">
                    ${returnAmountUSD.toFixed(2)} USD
                  </span>
                  <span className="text-xs text-emerald-600 font-bold font-mono ml-2">
                    ({returnAmountKHR.toLocaleString()} {khrCurrency?.symbol || "៛"})
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* MODAL FOOTER: ONLY CLOSE AND CHECKOUT */}
        <div className="px-6 py-4 bg-white border-t border-slate-100 flex items-center justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            className="px-5 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer border border-slate-200"
          >
            {t("common.close", "Close")}
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={totalReceivedUSD < effectiveTotalBill - 0.001 || isSubmitting}
            className={`py-2.5 px-6 text-white font-bold text-sm rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-sm ${isPurchase
              ? "bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none"
              : "bg-blue-600 hover:bg-blue-500 disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none"
              }`}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {t("payment.processing", "Processing...")}
              </>
            ) : totalReceivedUSD >= effectiveTotalBill - 0.001 ? (
              isPurchase
                ? t("payment.pay_purchase", "Pay Purchase")
                : t("payment.pay_now", "Pay Now")
            ) : (
              `${t("payment.due_prefix", "Due")} $${dueAmountUSD.toFixed(2)}`
            )}
          </button>
        </div>

      </div>
    </div>
  );
};

export default PaymentForm;