import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/i18n/LanguageContext";
import type { CashRegisterResponse } from "@/types/sales/CashRegister";
import {
  ListChecks,
  User,
  Store,
  Calendar,
  Receipt,
  Scale,
  Lock,
  Banknote,
  CreditCard,
  RotateCcw,
  Printer,
  ArrowDownRight,
  ArrowUpRight,
  Clock,
  FileText,
} from "lucide-react";
import { formatDate } from "@/utils/formatDate";

interface RegisterDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  register: CashRegisterResponse | null;
  onOpenCloseModal?: () => void;
}

const formatCurrency = (val: number | null | undefined) => {
  if (val === null || val === undefined) return "$0.00";
  return `$${Number(val).toFixed(2)}`;
};

const getShiftDuration = (openedAt?: string, closedAt?: string | null) => {
  if (!openedAt) return null;
  const start = new Date(openedAt).getTime();
  const end = closedAt ? new Date(closedAt).getTime() : Date.now();
  if (Number.isNaN(start) || Number.isNaN(end) || end < start) return null;
  const diffMinutes = Math.floor((end - start) / (1000 * 60));
  const hours = Math.floor(diffMinutes / 60);
  const mins = diffMinutes % 60;
  if (hours === 0) return `${mins}m`;
  return `${hours}h ${mins}m`;
};

export default function RegisterDetailsModal({
  open,
  onOpenChange,
  register,
  onOpenCloseModal,
}: RegisterDetailsModalProps) {
  const { language } = useLanguage();
  const isKm = language === "km";

  if (!register) return null;

  const openingBalance = Number(register.openingBalance || 0);
  const totalSales = Number(register.totalSales || 0);
  const totalCashSales = Number(register.totalCashSales ?? 0);
  const totalBankSales = Number(register.totalBankSales ?? 0);
  const totalReturns = Number(register.totalReturns || 0);
  const totalCashIn = Number(register.totalCashIn || 0);
  const totalCashOut = Number(register.totalCashOut || 0);

  const expectedBalance =
    register.expectedBalance !== null && register.expectedBalance !== undefined
      ? Number(register.expectedBalance)
      : openingBalance + (totalCashSales || totalSales) - totalReturns + totalCashIn - totalCashOut;

  const isOpen = register.status === "OPEN";
  const duration = getShiftDuration(register.openedAt, register.closedAt);

  const handlePrintSlip = () => {
    const printWindow = window.open("", "_blank", "width=380,height=650");
    if (!printWindow) return;

    const diff = Number(register.difference || 0);
    const diffSign = diff > 0 ? `+$${diff.toFixed(2)} (Over)` : diff < 0 ? `-$${Math.abs(diff).toFixed(2)} (Short)` : "$0.00 (Balanced)";

    const printHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Shift Summary - ${register.registerNo}</title>
          <style>
            body {
              font-family: 'Courier New', Courier, monospace;
              padding: 16px;
              max-width: 320px;
              margin: 0 auto;
              color: #111;
              font-size: 12px;
              line-height: 1.4;
            }
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            .bold { font-weight: bold; }
            .divider { border-top: 1px dashed #666; margin: 8px 0; }
            .row { display: flex; justify-content: space-between; margin: 3px 0; }
            h2 { margin: 4px 0; font-size: 15px; }
            p { margin: 2px 0; }
            @media print { body { padding: 0; } }
          </style>
        </head>
        <body>
          <div class="text-center">
            <h2>SARANA STORE</h2>
            <p>${register.storeName || "Main Counter"}</p>
            <p class="bold">CASH REGISTER SHIFT SLIP</p>
            <p>${register.registerNo}</p>
          </div>
          <div class="divider"></div>
          <div class="row"><span>Cashier:</span><span class="bold">${register.userName || "N/A"}</span></div>
          <div class="row"><span>Opened:</span><span>${register.openedAt ? formatDate(register.openedAt, "dateTime") : "N/A"}</span></div>
          <div class="row"><span>Closed:</span><span>${register.closedAt ? formatDate(register.closedAt, "dateTime") : "OPEN (Active)"}</span></div>
          ${duration ? `<div class="row"><span>Duration:</span><span>${duration}</span></div>` : ""}
          <div class="divider"></div>
          <div class="row"><span>Opening Float:</span><span class="bold">$${openingBalance.toFixed(2)}</span></div>
          <div class="row"><span>Total Orders:</span><span class="bold">${register.saleCount || 0}</span></div>
          <div class="row"><span>Gross Sales:</span><span class="bold">$${totalSales.toFixed(2)}</span></div>
          <div class="row"><span>• Cash Sales:</span><span>$${totalCashSales.toFixed(2)}</span></div>
          <div class="row"><span>• Bank / QR:</span><span>$${totalBankSales.toFixed(2)}</span></div>
          ${totalCashIn > 0 ? `<div class="row"><span>• Cash In (Float):</span><span>+$${totalCashIn.toFixed(2)}</span></div>` : ""}
          ${totalCashOut > 0 ? `<div class="row"><span>• Cash Out (Payout):</span><span>-$${totalCashOut.toFixed(2)}</span></div>` : ""}
          ${totalReturns > 0 ? `<div class="row"><span>• Returns / Refunds:</span><span>-$${totalReturns.toFixed(2)}</span></div>` : ""}
          <div class="divider"></div>
          <div class="row bold"><span>Expected in Drawer:</span><span>$${expectedBalance.toFixed(2)}</span></div>
          ${register.status === "CLOSED" ? `
            <div class="row bold"><span>Actual Counted:</span><span>$${Number(register.closingBalance || 0).toFixed(2)}</span></div>
            <div class="row bold"><span>Discrepancy:</span><span>${diffSign}</span></div>
          ` : `<div class="row italic"><span>Shift Status:</span><span>STILL OPEN</span></div>`}
          ${register.closingNote ? `
            <div class="divider"></div>
            <p class="bold">Note:</p>
            <p>${register.closingNote}</p>
          ` : ""}
          <div class="divider"></div>
          <p class="text-center" style="font-size: 10px; margin-top: 12px;">
            Printed on: ${new Date().toLocaleString()}<br/>
            Thank you!
          </p>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(() => window.close(), 500);
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(printHtml);
    printWindow.document.close();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-0 overflow-hidden shadow-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <DialogHeader className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-sm font-bold flex items-center gap-2 text-slate-900 dark:text-white">
              <ListChecks className="size-4.5 text-sky-600" />
              <span>{isKm ? "ព័ត៌មានលម្អិតវេនលក់" : "Cash Register Shift Details"}</span>
              <span className="font-mono text-xs px-2 py-0.5 rounded-md bg-slate-200/70 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                {register.registerNo}
              </span>
            </DialogTitle>
            <Badge
              variant={isOpen ? "default" : "secondary"}
              className={`text-[11px] font-semibold px-2 py-0.5 ${
                isOpen
                  ? "bg-emerald-500 hover:bg-emerald-600 text-white"
                  : "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
              }`}
            >
              {isOpen ? (isKm ? "កំពុងដំណើរការ (OPEN)" : "OPEN") : (isKm ? "បានបិទ (CLOSED)" : "CLOSED")}
            </Badge>
          </div>
        </DialogHeader>

        {/* Scrollable Content */}
        <div className="p-4 space-y-3.5 text-xs overflow-y-auto">
          {/* Metadata Cards */}
          <div className="grid grid-cols-2 gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              {register.userProfileImage ? (
                <img
                  src={register.userProfileImage}
                  alt={register.userName}
                  className="size-8 rounded-full object-cover border border-slate-200"
                />
              ) : (
                <div className="size-8 rounded-full bg-linear-to-tr from-sky-500 to-indigo-500 text-white flex items-center justify-center font-bold text-xs shadow-2xs">
                  {register.userName?.charAt(0).toUpperCase() || "U"}
                </div>
              )}
              <div className="space-y-0.5 min-w-0">
                <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                  <User className="size-2.5" />
                  {isKm ? "បេឡាករ" : "Cashier"}
                </span>
                <p className="font-bold text-foreground text-xs truncate">
                  {register.userName || "N/A"}
                </p>
              </div>
            </div>

            <div className="space-y-0.5">
              <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                <Store className="size-2.5" />
                {isKm ? "ហាង / សាខា" : "Store / Branch"}
              </span>
              <p className="font-bold text-foreground text-xs truncate">
                {register.storeName || `Store #${register.storeId}`}
              </p>
            </div>

            <div className="space-y-0.5">
              <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                <Calendar className="size-2.5" />
                {isKm ? "ពេលវេលាបើកវេន" : "Opened At"}
              </span>
              <p className="font-semibold text-foreground text-[11px]">
                {register.openedAt ? formatDate(register.openedAt, "dateTime") : "N/A"}
              </p>
            </div>

            <div className="space-y-0.5">
              <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                <Clock className="size-2.5" />
                {isKm ? "ពេលវេលាបិទ / រយៈពេល" : "Closed / Duration"}
              </span>
              <p className="font-semibold text-foreground text-[11px]">
                {isOpen ? (
                  <span className="text-emerald-600 font-bold">Active ({duration || "now"})</span>
                ) : (
                  `${register.closedAt ? formatDate(register.closedAt, "time") : "N/A"}${duration ? ` (${duration})` : ""}`
                )}
              </p>
            </div>
          </div>

          {/* Sales Breakdown */}
          <div className="space-y-1.5 rounded-xl border border-slate-200 dark:border-slate-800 p-3 bg-white dark:bg-slate-900 shadow-2xs">
            <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Receipt className="size-3.5 text-emerald-600" />
                {isKm ? "ការលក់ និងមធ្យោបាយទូទាត់" : "Sales & Payment Tenders"}
              </span>
              <span className="text-[10px] text-muted-foreground font-normal">
                {register.saleCount || 0} {isKm ? "វិក្កយបត្រ" : "orders recorded"}
              </span>
            </span>

            <div className="grid grid-cols-3 gap-2 pt-1.5">
              <div className="bg-emerald-50/70 dark:bg-emerald-950/30 p-2 rounded-lg border border-emerald-100 dark:border-emerald-900/40">
                <span className="text-[10px] font-medium text-emerald-800 dark:text-emerald-300 flex items-center gap-1">
                  <Receipt className="size-2.5" />
                  {isKm ? "លក់សរុប" : "Total Sales"}
                </span>
                <p className="font-mono font-bold text-xs text-emerald-700 dark:text-emerald-300 mt-0.5">
                  {formatCurrency(totalSales)}
                </p>
              </div>

              <div className="bg-teal-50/70 dark:bg-teal-950/30 p-2 rounded-lg border border-teal-100 dark:border-teal-900/40">
                <span className="text-[10px] font-medium text-teal-800 dark:text-teal-300 flex items-center gap-1">
                  <Banknote className="size-2.5" />
                  {isKm ? "សាច់ប្រាក់ (Cash)" : "Cash Sales"}
                </span>
                <p className="font-mono font-bold text-xs text-teal-700 dark:text-teal-300 mt-0.5">
                  {formatCurrency(totalCashSales)}
                </p>
              </div>

              <div className="bg-sky-50/70 dark:bg-sky-950/30 p-2 rounded-lg border border-sky-100 dark:border-sky-900/40">
                <span className="text-[10px] font-medium text-sky-800 dark:text-sky-300 flex items-center gap-1">
                  <CreditCard className="size-2.5" />
                  {isKm ? "ធនាគារ (Bank/QR)" : "Bank / QR"}
                </span>
                <p className="font-mono font-bold text-xs text-sky-700 dark:text-sky-300 mt-0.5">
                  {formatCurrency(totalBankSales)}
                </p>
              </div>
            </div>
          </div>

          {/* Balance & Drawer Reconciliations */}
          <div className="space-y-2 rounded-xl border border-slate-200 dark:border-slate-800 p-3 bg-white dark:bg-slate-900 shadow-2xs divide-y divide-slate-100 dark:divide-slate-800">
            <div className="flex justify-between items-center pb-2">
              <span className="text-muted-foreground">{isKm ? "ទឹកប្រាក់ដើមគ្រា (Opening Float):" : "Opening Cash Float:"}</span>
              <span className="font-semibold font-mono text-foreground">{formatCurrency(openingBalance)}</span>
            </div>

            {totalCashIn > 0 && (
              <div className="flex justify-between items-center py-1.5">
                <span className="text-muted-foreground flex items-center gap-1">
                  <ArrowDownRight className="size-3 text-emerald-500" />
                  {isKm ? "លុយដាក់បន្ថែម (Cash In):" : "Cash In (Float Additions):"}
                </span>
                <span className="font-semibold font-mono text-emerald-600">+{formatCurrency(totalCashIn)}</span>
              </div>
            )}

            {totalCashOut > 0 && (
              <div className="flex justify-between items-center py-1.5">
                <span className="text-muted-foreground flex items-center gap-1">
                  <ArrowUpRight className="size-3 text-amber-500" />
                  {isKm ? "លុយដកចេញ (Cash Out):" : "Cash Out (Payouts):"}
                </span>
                <span className="font-semibold font-mono text-amber-600">-{formatCurrency(totalCashOut)}</span>
              </div>
            )}

            {totalReturns > 0 && (
              <div className="flex justify-between items-center py-1.5">
                <span className="text-muted-foreground flex items-center gap-1">
                  <RotateCcw className="size-3 text-rose-500" />
                  {isKm ? "ការសងទំនិញវិញ (Returns):" : "Total Returns & Refunds:"}
                </span>
                <span className="font-semibold font-mono text-rose-500">-{formatCurrency(totalReturns)}</span>
              </div>
            )}

            <div className="flex justify-between items-center py-2 bg-emerald-50/70 dark:bg-emerald-950/30 px-2.5 rounded-lg border border-emerald-100 dark:border-emerald-900/40">
              <span className="font-bold text-emerald-900 dark:text-emerald-200 flex items-center gap-1.5">
                <Scale className="size-3.5 text-emerald-600" />
                {isKm ? "ទឹកប្រាក់រំពឹងទុកក្នុងថត (Expected Cash):" : "Expected Cash in Drawer:"}
              </span>
              <span className="font-mono font-bold text-sm text-emerald-700 dark:text-emerald-300">
                {formatCurrency(expectedBalance)}
              </span>
            </div>

            {register.status === "CLOSED" && (
              <>
                <div className="flex justify-between items-center py-1.5 pt-2">
                  <span className="text-muted-foreground">{isKm ? "ទឹកប្រាក់រាប់បានជាក់ស្តែង:" : "Closing Counted Cash:"}</span>
                  <span className="font-semibold font-mono text-foreground text-sm">
                    {formatCurrency(register.closingBalance)}
                  </span>
                </div>

                <div className="flex justify-between items-center py-1.5">
                  <span className="text-muted-foreground">{isKm ? "ភាពខុសគ្នា (Discrepancy):" : "Discrepancy / Difference:"}</span>
                  {(() => {
                    const diff = Number(register.difference || 0);
                    const isBalanced = Math.abs(diff) < 0.005;
                    const isOver = diff > 0;
                    return (
                      <span
                        className={`font-mono font-bold text-xs px-2 py-0.5 rounded-md ${
                          isBalanced
                            ? "bg-blue-50 text-blue-700 border border-blue-200"
                            : isOver
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-rose-50 text-rose-700 border border-rose-200"
                        }`}
                      >
                        {isBalanced ? "Balanced ($0.00)" : isOver ? `+${formatCurrency(diff)} Over` : `${formatCurrency(diff)} Short`}
                      </span>
                    );
                  })()}
                </div>

                {register.closingNote && (
                  <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 text-[11px] text-muted-foreground border border-slate-100 dark:border-slate-800">
                    <span className="font-semibold text-foreground flex items-center gap-1 mb-0.5">
                      <FileText className="size-3 text-slate-400" />
                      {isKm ? "ចំណាំពេលបិទវេន:" : "Closing Remarks:"}
                    </span>
                    <p className="italic text-slate-700 dark:text-slate-300">{register.closingNote}</p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center shrink-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handlePrintSlip}
            className="text-xs h-8 px-3 gap-1.5 cursor-pointer"
          >
            <Printer className="size-3.5 text-slate-500" />
            <span>{isKm ? "បោះពុម្ពប័ណ្ណវេន" : "Print Shift Slip"}</span>
          </Button>

          <div className="flex items-center gap-2">
            {isOpen && onOpenCloseModal && (
              <Button
                type="button"
                size="sm"
                variant="destructive"
                onClick={() => {
                  onOpenChange(false);
                  onOpenCloseModal();
                }}
                className="text-xs h-8 px-3 gap-1.5 cursor-pointer font-semibold"
              >
                <Lock className="size-3.5" />
                <span>{isKm ? "បិទវេនលក់" : "Close Shift"}</span>
              </Button>
            )}

            <Button
              size="sm"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="text-xs h-8 px-3 cursor-pointer"
            >
              {isKm ? "បិទ" : "Close"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
