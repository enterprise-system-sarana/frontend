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
import { DetailGrid, DetailItem, DetailSection, SummaryRow } from "@/components/ui/detail-list";
import { InitialsAvatar } from "@/components/ui/initials-avatar";
import { Money, formatMoney } from "@/components/ui/money";
import { StatusBadge, statusToneClass, type StatusTone } from "@/components/ui/status-badge";
import { useLanguage } from "@/i18n/LanguageContext";
import { cn } from "@/lib/utils";
import type { CashRegisterResponse } from "@/types/sales/CashRegister";
import { ListChecks, Lock, Printer } from "lucide-react";
import { formatDate } from "@/utils/formatDate";

interface RegisterDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  register: CashRegisterResponse | null;
  onOpenCloseModal?: () => void;
}

const getShiftMinutes = (openedAt?: string, closedAt?: string | null) => {
  if (!openedAt) return null;
  const start = new Date(openedAt).getTime();
  const end = closedAt ? new Date(closedAt).getTime() : Date.now();
  if (Number.isNaN(start) || Number.isNaN(end) || end < start) return null;
  return Math.floor((end - start) / (1000 * 60));
};

/** "1h 45m" / "45m", or the same shape from a translated template. */
const formatDuration = (minutes: number | null, hoursTemplate = "{h}h {m}m", minutesTemplate = "{m}m") => {
  if (minutes === null) return null;
  const hours = Math.floor(minutes / 60);
  return (hours ? hoursTemplate : minutesTemplate)
    .replace("{h}", String(hours))
    .replace("{m}", String(minutes % 60));
};

export default function RegisterDetailsModal({
  open,
  onOpenChange,
  register,
  onOpenCloseModal,
}: RegisterDetailsModalProps) {
  const { t } = useLanguage();

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
  const isClosed = register.status === "CLOSED";
  const shiftMinutes = getShiftMinutes(register.openedAt, register.closedAt);
  const duration = formatDuration(shiftMinutes);

  const difference = Number(register.difference || 0);
  const isBalanced = Math.abs(difference) < 0.005;
  const differenceTone: StatusTone = isBalanced ? "info" : difference > 0 ? "success" : "danger";
  const differenceLabel = isBalanced
    ? t("cash_register.balanced", "Balanced")
    : `${difference > 0 ? "+" : "−"}${formatMoney(Math.abs(difference))} ${
        difference > 0 ? t("cash_register.over", "Over") : t("cash_register.short", "Short")
      }`;

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

  const salesTotals = [
    { label: t("cash_register.total_sales", "Total sales"), value: totalSales },
    { label: t("cash_register.cash_sales", "Cash sales"), value: totalCashSales },
    { label: t("cash_register.bank_qr", "Bank/QR"), value: totalBankSales },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader className="flex-row items-center gap-3.5">
          <span className="hidden size-11 shrink-0 items-center justify-center rounded-xl bg-primary-light text-primary sm:flex">
            <ListChecks className="size-5" strokeWidth={1.75} />
          </span>
          <div className="min-w-0 space-y-0.5">
            <DialogTitle>{t("cash_register.shift_details", "Register Shift Details")}</DialogTitle>
            <DialogDescription className="flex flex-wrap items-center gap-x-2 gap-y-1 tabular-nums">
              <span className="whitespace-nowrap">{register.registerNo}</span>
              <StatusBadge status={register.status} className="sm:hidden" />
            </DialogDescription>
          </div>
          <StatusBadge status={register.status} className="ml-auto hidden shrink-0 sm:inline-flex" />
        </DialogHeader>

        <div className="space-y-5">
          <DetailGrid>
            <DetailItem label={t("cash_register.cashier", "Cashier")}>
              <span className="flex min-w-0 items-center gap-2">
                {register.userProfileImage ? (
                  <img
                    src={register.userProfileImage}
                    alt=""
                    className="size-6 shrink-0 rounded-full object-cover"
                  />
                ) : (
                  <InitialsAvatar name={register.userName || "?"} className="size-6 text-[10px]" />
                )}
                <span className="truncate">{register.userName || "-"}</span>
              </span>
            </DetailItem>
            <DetailItem label={t("pos.store_branch", "Store / Branch")}>
              {register.storeName || `#${register.storeId}`}
            </DetailItem>
            <DetailItem label={t("cash_register.opened_at", "Opened At")}>
              <span className="whitespace-normal tabular-nums">
                {register.openedAt ? formatDate(register.openedAt, "dateTime") : "-"}
              </span>
            </DetailItem>
            <DetailItem label={t("cash_register.closed_at", "Closed At")}>
              {isOpen ? (
                <span className="text-success">{t("cash_register.still_open", "Still open")}</span>
              ) : (
                <span className="whitespace-normal tabular-nums">
                  {register.closedAt ? formatDate(register.closedAt, "dateTime") : "-"}
                </span>
              )}
            </DetailItem>
            <DetailItem label={t("cash_register.duration", "Duration")}>
              <span className="tabular-nums">
                {formatDuration(
                  shiftMinutes,
                  t("cash_register.duration_hm", "{h}h {m}m"),
                  t("cash_register.duration_m", "{m}m")
                ) ?? "-"}
              </span>
            </DetailItem>
            <DetailItem label={t("cash_register.orders", "Orders")}>
              <span className="tabular-nums">{register.saleCount || 0}</span>
            </DetailItem>
          </DetailGrid>

          <DetailSection title={t("cash_register.sales", "Sales")}>
            <dl className="grid grid-cols-3 divide-x divide-border rounded-xl border border-border">
              {salesTotals.map((item) => (
                <div key={item.label} className="min-w-0 space-y-1 px-4 py-3">
                  <dt className="truncate text-xs text-muted-foreground">{item.label}</dt>
                  <dd>
                    <Money value={item.value} className="text-base" />
                  </dd>
                </div>
              ))}
            </dl>
          </DetailSection>

          <DetailSection title={t("cash_register.cash_drawer", "Cash drawer")}>
            <div className="space-y-2.5">
              <SummaryRow label={t("pos.opening_cash", "Opening cash")}>
                <Money value={openingBalance} />
              </SummaryRow>
              <SummaryRow label={t("cash_register.cash_sales", "Cash sales")}>
                <Money value={`+${formatMoney(totalCashSales)}`} tone="success" />
              </SummaryRow>
              {totalCashIn > 0 && (
                <SummaryRow label={t("cash_register.cash_in", "Cash in")}>
                  <Money value={`+${formatMoney(totalCashIn)}`} tone="success" />
                </SummaryRow>
              )}
              {totalCashOut > 0 && (
                <SummaryRow label={t("cash_register.cash_out", "Cash out")}>
                  <Money value={`−${formatMoney(totalCashOut)}`} tone="danger" />
                </SummaryRow>
              )}
              {totalReturns > 0 && (
                <SummaryRow label={t("cash_register.returns", "Returns & refunds")}>
                  <Money value={`−${formatMoney(totalReturns)}`} tone="danger" />
                </SummaryRow>
              )}
              <SummaryRow label={t("cash_register.expected_cash", "Expected in drawer")} emphasis>
                <Money value={expectedBalance} />
              </SummaryRow>

              {isClosed && (
                <>
                  <SummaryRow label={t("cash_register.counted_cash", "Counted cash")}>
                    <Money value={register.closingBalance} />
                  </SummaryRow>
                  <SummaryRow label={t("cash_register.difference", "Difference")}>
                    <Badge
                      variant="outline"
                      className={cn(
                        "h-6 rounded-full border-transparent px-2.5 font-medium tabular-nums",
                        statusToneClass[differenceTone]
                      )}
                    >
                      {differenceLabel}
                    </Badge>
                  </SummaryRow>
                </>
              )}
            </div>
          </DetailSection>

          {register.closingNote && (
            <DetailSection title={t("cash_register.closing_note", "Closing note")}>
              <p className="rounded-xl border border-border bg-muted/40 p-3.5 text-sm text-foreground">
                {register.closingNote}
              </p>
            </DetailSection>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={handlePrintSlip} className="sm:mr-auto">
            <Printer />
            {t("cash_register.print_slip", "Print shift slip")}
          </Button>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {t("common.close", "Close")}
          </Button>
          {isOpen && onOpenCloseModal && (
            <Button
              type="button"
              variant="destructive"
              onClick={() => {
                onOpenChange(false);
                onOpenCloseModal();
              }}
            >
              <Lock />
              {t("cash_register.close_shift", "Close shift")}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
