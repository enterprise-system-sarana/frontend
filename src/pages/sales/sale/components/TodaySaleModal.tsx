
import { useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/i18n/LanguageContext";
import { useReport } from "@/hooks/reports/useReport";
import { useSale } from "@/hooks/sales/useSale";
import type { CashRegisterResponse } from "@/types/sales/CashRegister";
import type { SaleResponse } from "@/types/sales/Sale";
import {
  CalendarDays,
  Receipt,
  DollarSign,
  TrendingUp,
  CreditCard,
  Banknote,
  Printer,
  ExternalLink,
  Store,
  RefreshCw,
  ShoppingBag,
  CircleDollarSign,
  Wallet,
  Clock3,
  UserRound,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ROUTERS } from "@/constants/Route";
import { formatDate } from "@/utils/formatDate";

interface TodaySaleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  storeId?: number;
  storeName?: string;
  currentRegister?: CashRegisterResponse | null;
}

const localDateStr = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const money = (value: number) =>
  `$${Number(value || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const escapeHtml = (value: unknown) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

export default function TodaySaleModal({
  open,
  onOpenChange,
  storeId,
  storeName,
  currentRegister,
}: TodaySaleModalProps) {
  const { language } = useLanguage();
  const isKm = language === "km";
  const navigate = useNavigate();

  const todayStr = useMemo(() => localDateStr(), []);

  const filter = useMemo(
    () => ({
      page: 1,
      size: 500,
      startDate: todayStr,
      endDate: todayStr,
      storeId: storeId || undefined,
    }),
    [todayStr, storeId]
  );

  const {
    data: reportData,
    isLoading: isReportLoading,
    refetch: refetchReport,
    isFetching: isFetchingReport,
  } = useReport.useSalesReport(open ? filter : undefined);

  const {
    data: liveSalesData,
    refetch: refetchLiveSales,
    isFetching: isFetchingLive,
  } = useSale.GetAll({
    page: 1,
    size: 500,
  });

  const isFetching = isFetchingReport || isFetchingLive;
  const isLoading = open && isReportLoading;

  const parsedReport = useMemo(() => {
    const payload = (reportData as any)?.payload ?? reportData ?? {};

    if (
      payload.totalSalesAmount !== undefined &&
      !Array.isArray(payload.data)
    ) {
      return {
        totalSalesAmount: Number(payload.totalSalesAmount || 0),
        totalDiscount: Number(payload.totalDiscount || 0),
        totalPaidAmount: Number(payload.totalPaidAmount || 0),
        totalProfit: Number(payload.totalProfit || 0),
        totalTransactions: Number(payload.totalTransactions || 0),
        sales: Array.isArray(payload.sales)
          ? (payload.sales as SaleResponse[])
          : [],
      };
    }

    const dataArray = Array.isArray(payload.data)
      ? payload.data
      : Array.isArray(payload)
        ? payload
        : [];

    if (dataArray.length > 0) {
      let totalSalesAmount = 0;
      let totalDiscount = 0;
      let totalPaidAmount = 0;
      let totalProfit = 0;
      let totalTransactions = 0;
      const sales: SaleResponse[] = [];

      for (const item of dataArray) {
        totalSalesAmount += Number(item.totalSalesAmount || 0);
        totalDiscount += Number(item.totalDiscount || 0);
        totalPaidAmount += Number(item.totalPaidAmount || 0);
        totalProfit += Number(item.totalProfit || 0);
        totalTransactions += Number(item.totalTransactions || 0);

        if (Array.isArray(item.sales)) {
          sales.push(...item.sales);
        } else if (item.reference || item.id) {
          sales.push(item);
        }
      }

      return {
        totalSalesAmount,
        totalDiscount,
        totalPaidAmount,
        totalProfit,
        totalTransactions: totalTransactions || sales.length,
        sales,
      };
    }

    return {
      totalSalesAmount: Number(payload.totalSalesAmount || 0),
      totalDiscount: Number(payload.totalDiscount || 0),
      totalPaidAmount: Number(payload.totalPaidAmount || 0),
      totalProfit: Number(payload.totalProfit || 0),
      totalTransactions: Number(payload.totalTransactions || 0),
      sales: Array.isArray(payload.sales)
        ? (payload.sales as SaleResponse[])
        : [],
    };
  }, [reportData]);

  const clientTodaySales = useMemo(() => {
    const response = liveSalesData as any;

    const data =
      response?.payload?.data ??
      response?.payload?.content ??
      response?.data ??
      response?.payload ??
      response;

    const list: SaleResponse[] = Array.isArray(data) ? data : [];

    return list.filter((sale) => {
      const value = sale.saleDate ?? sale.createdAt ?? sale.date;

      if (!value) return false;

      const dateString = String(value).trim();

      const isToday = dateString.startsWith(todayStr)
        ? true
        : (() => {
          const date = new Date(dateString);
          return (
            !Number.isNaN(date.getTime()) &&
            localDateStr(date) === todayStr
          );
        })();

      if (!isToday) return false;

      // If a store is selected, do not include sales from other stores
      // or sales whose store association is missing.
      if (storeId) {
        return Number(sale.storeId) === Number(storeId);
      }

      return true;
    });
  }, [liveSalesData, todayStr, storeId]);

  const salesList = useMemo(() => {
    if (parsedReport.sales.length > 0) {
      return parsedReport.sales;
    }

    return clientTodaySales;
  }, [parsedReport.sales, clientTodaySales]);

  const clientTotals = useMemo(() => {
    let salesTotal = 0;
    let paidTotal = 0;
    let discountTotal = 0;
    let costTotal = 0;

    salesList.forEach((sale) => {
      salesTotal += Number(
        sale.grandTotal ?? sale.totalAmount ?? (sale as any).total ?? 0
      );

      paidTotal += Number(sale.paidAmount ?? 0);
      discountTotal += Number(sale.discount ?? 0);

      if (Array.isArray(sale.items)) {
        costTotal += sale.items.reduce(
          (sum: number, item: any) =>
            sum +
            (Number(item.quantity) || 0) *
            (Number(item.costPrice ?? item.cost) || 0),
          0
        );
      }
    });

    return {
      salesTotal,
      paidTotal,
      discountTotal,
      estimatedProfit: salesTotal - costTotal,
    };
  }, [salesList]);

  const totalSalesAmount =
    parsedReport.totalSalesAmount > 0
      ? parsedReport.totalSalesAmount
      : clientTotals.salesTotal;

  const totalPaidAmount =
    parsedReport.totalPaidAmount > 0
      ? parsedReport.totalPaidAmount
      : clientTotals.paidTotal;

  const totalDiscount =
    parsedReport.totalDiscount > 0
      ? parsedReport.totalDiscount
      : clientTotals.discountTotal;

  const totalProfit =
    parsedReport.totalProfit !== 0
      ? parsedReport.totalProfit
      : clientTotals.estimatedProfit;

  const totalTransactions =
    salesList.length || parsedReport.totalTransactions;

  const paymentBreakdown = useMemo(() => {
    let cash = 0;
    let bank = 0;
    let unpaid = 0;

    salesList.forEach((sale) => {
      const grandTotal = Number(
        sale.grandTotal ?? sale.totalAmount ?? (sale as any).total ?? 0
      );

      const paid = Number(sale.paidAmount ?? 0);
      const due = Number(
        sale.dueAmount ?? Math.max(0, grandTotal - paid)
      );

      unpaid += Math.max(0, due);

      if (sale.bankId || sale.bankName) {
        bank += paid;
      } else {
        cash += paid;
      }
    });

    return { cash, bank, unpaid };
  }, [salesList]);

  const handleRefresh = async () => {
    try {
      await Promise.all([refetchReport(), refetchLiveSales()]);
    } catch (error) {
      console.error("Failed to refresh today's sales", error);
    }
  };

  const handlePrintSummary = () => {
    const printWindow = window.open(
      "",
      "_blank",
      "width=420,height=720"
    );

    if (!printWindow) {
      alert(
        isKm
          ? "សូមអនុញ្ញាតឱ្យ Browser បើក Popup ដើម្បីបោះពុម្ព។"
          : "Please allow pop-ups to print the sales summary."
      );
      return;
    }

    const now = new Date();

    const formattedDate = now.toLocaleDateString(
      isKm ? "km-KH" : "en-US",
      {
        weekday: "long",
        year: "numeric",
        month: "short",
        day: "numeric",
      }
    );

    const formattedTime = now.toLocaleTimeString(
      isKm ? "km-KH" : "en-US",
      {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }
    );

    const safeStoreName = escapeHtml(storeName || "Main Counter");
    const safeRegister = escapeHtml(currentRegister?.registerNo || "-");

    const printHtml = `
      <!DOCTYPE html>
      <html lang="${isKm ? "km" : "en"}">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>Daily Sales Summary - ${escapeHtml(todayStr)}</title>

          <style>
            * {
              box-sizing: border-box;
            }

            body {
              font-family: "Courier New", monospace;
              width: 100%;
              max-width: 360px;
              margin: 0 auto;
              padding: 18px;
              color: #111827;
              background: #fff;
              font-size: 12px;
              line-height: 1.55;
            }

            .center {
              text-align: center;
            }

            .muted {
              color: #6b7280;
            }

            .brand {
              font-size: 21px;
              font-weight: 800;
              letter-spacing: 1px;
              margin: 0 0 3px;
            }

            .subtitle {
              font-size: 11px;
              letter-spacing: 1px;
              font-weight: 700;
              margin: 10px 0 4px;
            }

            .divider {
              border-top: 1px dashed #9ca3af;
              margin: 12px 0;
            }

            .row {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              gap: 12px;
              margin: 5px 0;
            }

            .row span:first-child {
              flex: 1;
            }

            .row span:last-child {
              text-align: right;
              font-weight: 700;
              white-space: nowrap;
            }

            .section-title {
              font-weight: 700;
              margin-bottom: 8px;
            }

            .total {
              font-size: 15px;
              font-weight: 800;
            }

            .profit {
              font-size: 14px;
              font-weight: 800;
            }

            .footer {
              margin-top: 20px;
              text-align: center;
              font-size: 10px;
              color: #4b5563;
            }

            @page {
              size: 80mm auto;
              margin: 4mm;
            }

            @media print {
              body {
                width: 100%;
                max-width: none;
                margin: 0;
                padding: 0;
              }

              .no-print {
                display: none;
              }
            }
          </style>
        </head>

        <body>
          <header class="center">
            <h1 class="brand">SARANA STORE</h1>
            <p>${safeStoreName}</p>
            <p>Register: ${safeRegister}</p>
            <p class="subtitle">DAILY SALES SUMMARY</p>
            <p>${escapeHtml(formattedDate)}</p>
          </header>

          <div class="divider"></div>

          <div class="row">
            <span>Invoices / Transactions</span>
            <span>${escapeHtml(totalTransactions)}</span>
          </div>

          <div class="divider"></div>

          <p class="section-title">SALES SUMMARY</p>

          <div class="row">
            <span>Gross Sales</span>
            <span>${escapeHtml(money(totalSalesAmount))}</span>
          </div>

          <div class="row">
            <span>Discounts</span>
            <span>-${escapeHtml(money(totalDiscount))}</span>
          </div>

          <div class="row total">
            <span>Net Sales</span>
            <span>${escapeHtml(money(totalSalesAmount - totalDiscount))}</span>
          </div>

          <div class="row">
            <span>Total Collected</span>
            <span>${escapeHtml(money(totalPaidAmount))}</span>
          </div>

          <div class="divider"></div>

          <p class="section-title">PAYMENT BREAKDOWN</p>

          <div class="row">
            <span>Cash</span>
            <span>${escapeHtml(money(paymentBreakdown.cash))}</span>
          </div>

          <div class="row">
            <span>Bank / QR</span>
            <span>${escapeHtml(money(paymentBreakdown.bank))}</span>
          </div>

          ${paymentBreakdown.unpaid > 0
        ? `
                <div class="row">
                  <span>Outstanding Balance</span>
                  <span>${escapeHtml(money(paymentBreakdown.unpaid))}</span>
                </div>
              `
        : ""
      }

          <div class="divider"></div>

          <div class="row profit">
            <span>Profit ${parsedReport.totalProfit !== 0 ? "" : "(Est.)"}</span>
            <span>${escapeHtml(money(totalProfit))}</span>
          </div>

          <div class="divider"></div>

          <footer class="footer">
            <p>Printed: ${escapeHtml(formattedTime)}</p>
            <p>Thank you for your business!</p>
            <p>Please keep this report for your records.</p>
          </footer>

          <script>
            window.onload = function () {
              window.focus();
              window.print();
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(printHtml);
    printWindow.document.close();
  };

  const handleOpenFullReport = () => {
    onOpenChange(false);
    navigate(ROUTERS.REPORT_SALES);
  };

  const MetricCard = ({
    label,
    value,
    icon: Icon,
    iconClass,
    valueClass,
  }: {
    label: string;
    value: string;
    icon: React.ElementType;
    iconClass: string;
    valueClass?: string;
  }) => (
    <div className="min-w-0 border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900">
      <div className="flex items-center justify-between gap-2">
        <span className="truncate text-[11px] font-medium text-slate-500 dark:text-slate-400">
          {label}
        </span>
        <Icon className={`size-4 shrink-0 ${iconClass}`} />
      </div>

      <p
        className={`mt-2 break-words text-lg font-bold tabular-nums tracking-tight ${valueClass || "text-slate-900 dark:text-white"
          }`}
      >
        {value}
      </p>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="
          flex max-h-[92dvh] w-[calc(100%-1rem)] max-w-3xl
          flex-col gap-0 overflow-hidden rounded-none border
          border-slate-200 bg-white p-0 shadow-2xl
          dark:border-slate-700 dark:bg-slate-950
          [&>button:last-child]:hidden
        "
      >
        {/* Header */}
        <DialogHeader className="shrink-0 border-b border-slate-200 bg-white px-4 py-4 dark:border-slate-800 dark:bg-slate-950 sm:px-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-start gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
                <CalendarDays className="size-5" />
              </div>

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <DialogTitle className="text-base font-bold tracking-tight text-slate-900 dark:text-white sm:text-lg">
                    {isKm ? "របាយការណ៍ការលក់ថ្ងៃនេះ" : "Today's Sales"}
                  </DialogTitle>

                  <Badge
                    variant="outline"
                    className="rounded-none border-emerald-200 bg-emerald-50 text-[10px] font-semibold text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300"
                  >
                    {new Date().toLocaleDateString(
                      isKm ? "km-KH" : "en-US",
                      {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      }
                    )}
                  </Badge>
                </div>

                <DialogDescription className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                  <span className="flex items-center gap-1.5">
                    <Store className="size-3.5" />
                    {storeName ||
                      (isKm ? "គ្រប់ហាង" : "All Stores")}
                  </span>

                  {currentRegister && (
                    <span className="flex items-center gap-1.5">
                      <Clock3 className="size-3.5" />
                      {isKm ? "វេន" : "Register"}:
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        {currentRegister.registerNo}
                      </span>
                    </span>
                  )}
                </DialogDescription>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-1">
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={handleRefresh}
                disabled={isFetching}
                className="size-9 rounded-none"
                title={isKm ? "ផ្ទុកឡើងវិញ" : "Refresh"}
              >
                <RefreshCw
                  className={`size-4 ${isFetching ? "animate-spin" : ""}`}
                />
              </Button>

              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => onOpenChange(false)}
                className="size-9 rounded-none"
                aria-label={isKm ? "បិទ" : "Close"}
              >
                <X className="size-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* Scrollable content */}
        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto bg-slate-50/70 p-4 dark:bg-slate-950 sm:p-5">
          {isLoading ? (
            <div className="flex min-h-52 flex-col items-center justify-center gap-3 text-sm text-slate-500">
              <RefreshCw className="size-6 animate-spin text-emerald-600" />
              {isKm ? "កំពុងទាញយកទិន្នន័យ..." : "Loading sales report..."}
            </div>
          ) : (
            <>
              {/* Metrics */}
              <section>
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                    {isKm ? "សង្ខេបការលក់" : "Sales Overview"}
                  </h3>

                  <span className="text-[11px] text-slate-500">
                    {isFetching
                      ? isKm
                        ? "កំពុងធ្វើបច្ចុប្បន្នភាព..."
                        : "Updating..."
                      : isKm
                        ? "ទិន្នន័យថ្ងៃនេះ"
                        : "Today's figures"}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  <MetricCard
                    label={isKm ? "វិក្កយបត្រ" : "Transactions"}
                    value={String(totalTransactions)}
                    icon={Receipt}
                    iconClass="text-slate-500"
                  />

                  <MetricCard
                    label={isKm ? "ការលក់សរុប" : "Gross Sales"}
                    value={money(totalSalesAmount)}
                    icon={DollarSign}
                    iconClass="text-emerald-600"
                    valueClass="text-emerald-700 dark:text-emerald-400"
                  />

                  <MetricCard
                    label={isKm ? "ប្រាក់ប្រមូលបាន" : "Collected"}
                    value={money(totalPaidAmount)}
                    icon={Wallet}
                    iconClass="text-blue-600"
                    valueClass="text-blue-700 dark:text-blue-400"
                  />

                  <MetricCard
                    label={isKm ? "ប្រាក់ចំណេញ" : "Profit / Est."}
                    value={money(totalProfit)}
                    icon={TrendingUp}
                    iconClass="text-amber-600"
                    valueClass="text-amber-700 dark:text-amber-400"
                  />
                </div>
              </section>

              {/* Payment summary */}
              <section className="border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-3 py-3 dark:border-slate-800 sm:px-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                      {isKm ? "សង្ខេបការទូទាត់" : "Payment Summary"}
                    </h3>
                    <p className="mt-0.5 text-[11px] text-slate-500">
                      {isKm
                        ? "បែងចែកតាមមធ្យោបាយទូទាត់"
                        : "Breakdown by payment type"}
                    </p>
                  </div>

                  <CircleDollarSign className="size-5 text-emerald-600" />
                </div>

                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  <div className="flex items-center justify-between gap-3 px-3 py-3 sm:px-4">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <div className="flex size-8 shrink-0 items-center justify-center bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
                        <Banknote className="size-4" />
                      </div>

                      <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                        {isKm ? "សាច់ប្រាក់" : "Cash"}
                      </span>
                    </div>

                    <span className="font-mono text-sm font-bold tabular-nums text-slate-900 dark:text-white">
                      {money(paymentBreakdown.cash)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-3 px-3 py-3 sm:px-4">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <div className="flex size-8 shrink-0 items-center justify-center bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-400">
                        <CreditCard className="size-4" />
                      </div>

                      <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                        {isKm ? "ធនាគារ / KHQR" : "Bank / KHQR"}
                      </span>
                    </div>

                    <span className="font-mono text-sm font-bold tabular-nums text-slate-900 dark:text-white">
                      {money(paymentBreakdown.bank)}
                    </span>
                  </div>

                  {totalDiscount > 0 && (
                    <div className="flex items-center justify-between gap-3 px-3 py-3 sm:px-4">
                      <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                        {isKm ? "ការបញ្ចុះតម្លៃ" : "Discounts"}
                      </span>

                      <span className="font-mono text-sm font-bold tabular-nums text-rose-600">
                        -{money(totalDiscount)}
                      </span>
                    </div>
                  )}

                  {paymentBreakdown.unpaid > 0 && (
                    <div className="flex items-center justify-between gap-3 bg-rose-50/70 px-3 py-3 dark:bg-rose-950/20 sm:px-4">
                      <div>
                        <p className="text-xs font-bold text-rose-700 dark:text-rose-300">
                          {isKm ? "ប្រាក់ជំពាក់" : "Outstanding Balance"}
                        </p>
                        <p className="mt-0.5 text-[10px] text-rose-600 dark:text-rose-400">
                          {isKm
                            ? "មិនទាន់បានទូទាត់"
                            : "Unpaid customer balance"}
                        </p>
                      </div>

                      <span className="font-mono text-sm font-bold tabular-nums text-rose-700 dark:text-rose-300">
                        {money(paymentBreakdown.unpaid)}
                      </span>
                    </div>
                  )}
                </div>
              </section>

              {/* Transactions */}
              <section>
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <h3 className="flex items-center gap-2 text-sm font-bold text-slate-800 dark:text-slate-100">
                      <ShoppingBag className="size-4 text-emerald-600" />
                      {isKm ? "ប្រតិបត្តិការថ្ងៃនេះ" : "Today's Transactions"}
                    </h3>

                    <p className="mt-1 text-[11px] text-slate-500">
                      {salesList.length}{" "}
                      {isKm ? "ប្រតិបត្តិការ" : "transactions"}
                    </p>
                  </div>

                  <Badge
                    variant="outline"
                    className="rounded-none border-slate-200 bg-white text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                  >
                    {isKm ? "ថ្ងៃនេះ" : "Today"}
                  </Badge>
                </div>

                {salesList.length === 0 ? (
                  <div className="flex min-h-36 flex-col items-center justify-center border border-dashed border-slate-300 bg-white px-4 py-8 text-center dark:border-slate-700 dark:bg-slate-900">
                    <Receipt className="mb-3 size-8 text-slate-300" />

                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                      {isKm
                        ? "មិនទាន់មានការលក់ថ្ងៃនេះ"
                        : "No sales recorded today"}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      {isKm
                        ? "ប្រតិបត្តិការថ្មីនឹងបង្ហាញនៅទីនេះ"
                        : "New transactions will appear here."}
                    </p>
                  </div>
                ) : (
                  <div className="max-h-64 overflow-auto border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                    {/* Table header */}
                    <div className="sticky top-0 z-10 grid grid-cols-[minmax(0,1fr)_auto] gap-3 border-b border-slate-200 bg-slate-100 px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300 sm:px-4">
                      <span>
                        {isKm ? "វិក្កយបត្រ / អតិថិជន" : "Invoice / Customer"}
                      </span>
                      <span>{isKm ? "ចំនួនទឹកប្រាក់" : "Amount"}</span>
                    </div>

                    {salesList.map((sale) => {
                      const saleAmount = Number(
                        sale.grandTotal ??
                        sale.totalAmount ??
                        (sale as any).total ??
                        0
                      );

                      const status = String(
                        sale.paymentStatus || "UNPAID"
                      ).toUpperCase();

                      const isPaid =
                        status === "PAID" ||
                        status === "COMPLETE" ||
                        status === "COMPLETED";

                      return (
                        <div
                          key={sale.id}
                          className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-slate-100 px-3 py-3 last:border-b-0 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/50 sm:px-4"
                        >
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="truncate font-mono text-xs font-bold text-slate-900 dark:text-white">
                                {sale.no ||
                                  sale.reference ||
                                  `#${sale.id}`}
                              </span>

                              <Badge
                                variant="outline"
                                className={`rounded-none px-1.5 py-0 text-[9px] font-bold ${isPaid
                                    ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300"
                                    : "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300"
                                  }`}
                              >
                                {status}
                              </Badge>
                            </div>

                            <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-slate-500">
                              <span className="flex items-center gap-1">
                                <UserRound className="size-3" />
                                {sale.customerName ||
                                  (isKm ? "អតិថិជនទូទៅ" : "Walk-in Customer")}
                              </span>

                              <span className="flex items-center gap-1">
                                <Clock3 className="size-3" />
                                {formatDate(
                                  sale.createdAt ?? sale.saleDate ?? sale.date,
                                  "time"
                                )}
                              </span>

                              <span className="flex items-center gap-1">
                                <CreditCard className="size-3" />
                                {sale.bankId || sale.bankName
                                  ? sale.bankName || "Bank / QR"
                                  : "Cash"}
                              </span>
                            </div>
                          </div>

                          <span className="whitespace-nowrap font-mono text-xs font-bold tabular-nums text-slate-900 dark:text-white">
                            {money(saleAmount)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            </>
          )}
        </div>

        {/* Fixed responsive footer */}
        <DialogFooter
          className="
            m-0 shrink-0 rounded-none border-t border-slate-200 bg-white
            p-4 dark:border-slate-800 dark:bg-slate-950
            sm:px-5 sm:py-4
          "
        >
          <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            {/* Left-side actions */}
            <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
              <Button
                type="button"
                variant="outline"
                onClick={handlePrintSummary}
                className="h-9 w-full gap-2 rounded-none text-xs sm:w-auto"
              >
                <Printer className="size-4" />
                {isKm ? "បោះពុម្ព" : "Print Summary"}
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={handleOpenFullReport}
                className="h-9 w-full gap-2 rounded-none border-sky-200 text-xs text-sky-700 hover:bg-sky-50 hover:text-sky-800 dark:border-sky-900 dark:text-sky-400 dark:hover:bg-sky-950 sm:w-auto"
              >
                <ExternalLink className="size-4" />
                {isKm ? "របាយការណ៍ពេញ" : "Full Report"}
              </Button>
            </div>

            {/* Right-side action */}
            <Button
              type="button"
              onClick={() => onOpenChange(false)}
              className="h-9 w-full rounded-none bg-slate-900 text-xs font-semibold text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200 sm:w-auto sm:min-w-24"
            >
              {isKm ? "បិទ" : "Close"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
