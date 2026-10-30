import { getMethodIcon, getMethodToneClass } from "@/components/ui/payment-method-badge";
import type { ColumnDef } from "@tanstack/react-table";
import {
    Hash,
    ShoppingBag,
    ShoppingCart,
} from "lucide-react";

import { StatusBadge } from "@/components/ui/status-badge";
import { TableActions } from "@/components/ui/table-actions";
import { Money, formatMoney } from "@/components/ui/money";
import { PersonCell } from "@/components/ui/initials-avatar";
import { SortableHeader } from "@/utils/sort-table-header";
import type {
    PaymentResponse,
    PaymentLineResponseDTO,
} from "@/types/sales/Payment";
import { formatDate } from "@/utils/formatDate";

interface PaymentColumnsProps {
    onView?: (payment: PaymentResponse) => void;
    onEdit?: (payment: PaymentResponse) => void;
    onDelete?: (id: number) => void;
    mode?: "sale" | "purchase" | "all";
    t?: (key: string, fallback?: string) => string;
}

const formatMethod = (method?: string | null) => {
    const value = String(method || "CASH")
        .trim()
        .replace(/_/g, " ")
        .toLowerCase();

    return value.replace(/\b\w/g, (char) => char.toUpperCase()).replace(/\bKhqr\b/, "KHQR");
};

const extractLines = (
    payment: PaymentResponse,
): PaymentLineResponseDTO[] => {
    if (Array.isArray(payment.lines) && payment.lines.length > 0) {
        return payment.lines;
    }

    if (
        Array.isArray(payment.paymentLines) &&
        payment.paymentLines.length > 0
    ) {
        return payment.paymentLines;
    }

    if (Array.isArray(payment.payments) && payment.payments.length > 0) {
        return payment.payments;
    }

    if (payment.paymentMethod || payment.amount != null) {
        return [
            {
                id: payment.id,
                paymentMethod: payment.paymentMethod || "CASH",
                amount: payment.totalAmount ?? payment.amount ?? 0,
                bankId: payment.bankId ?? null,
                bankName: payment.bankName ?? null,
                transactionNo: payment.transactionNo ?? null,
                currencyCode: (payment as any).currencyCode ?? null,
                currencyId: (payment as any).currencyId ?? null,
            },
        ];
    }

    return [];
};

const KHR_RATE = 4100;

const getCurrencyInfo = (
    currency?: string | null,
    currencyId?: number | null,
    amount?: number | null,
) => {
    const raw = String(currency || "").trim();
    const upper = raw.toUpperCase();

    // Check for Khmer Riel: "Kh", "KHR", "៛", "RIEL", or currencyId === 2
    if (
        upper === "KHR" ||
        upper === "KH" ||
        upper === "RIEL" ||
        raw === "៛" ||
        upper.includes("KHR") ||
        upper.includes("KH") ||
        raw.includes("៛") ||
        currencyId === 2
    ) {
        return { isKhr: true, code: "KHR", symbol: "៛" };
    }

    if (upper === "THB" || raw === "฿") {
        return { isKhr: false, code: "THB", symbol: "฿" };
    }

    if (upper === "EUR" || raw === "€") {
        return { isKhr: false, code: "EUR", symbol: "€" };
    }

    // Auto-detect Khmer Riel if no currency is specified and amount is an integer >= 500 (e.g. 81,980)
    if (!currency && !currencyId && amount != null && amount >= 500) {
        return { isKhr: true, code: "KHR", symbol: "៛" };
    }

    // Default to USD ($)
    return { isKhr: false, code: "USD", symbol: "$" };
};

const formatLineAmount = (
    value: number | string | null | undefined,
    currency?: string | null,
    currencyId?: number | null,
) => {
    const amount = Number(value ?? 0);
    const validAmount = Number.isFinite(amount) ? amount : 0;
    const info = getCurrencyInfo(currency, currencyId, validAmount);

    if (info.isKhr) {
        return `${Math.round(validAmount).toLocaleString("en-US")} ៛`;
    }

    return `${info.symbol}${validAmount.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`;
};

type Translate = (key: string, fallback?: string) => string;
const passthrough: Translate = (_key, fallback) => fallback ?? "";

const MethodIcon = ({ method }: { method: string }) => {
    const Icon = getMethodIcon(method);
    return (
        <span className={`flex size-6 shrink-0 items-center justify-center rounded-full ${getMethodToneClass(method)}`}>
            <Icon className="size-3.5" strokeWidth={1.75} />
        </span>
    );
};

const PaymentBreakdown = ({
    payment,
    t,
}: {
    payment: PaymentResponse;
    t: Translate;
}) => {
    const lines = extractLines(payment);

    if (lines.length === 0) {
        return <span className="text-muted-foreground">—</span>;
    }

    const visibleLines = lines.slice(0, 2);
    const remaining = lines.length - visibleLines.length;

    return (
        <div className="flex min-w-[170px] max-w-[240px] flex-col gap-1.5">
            {visibleLines.map((line, index) => {
                const method = String(line.paymentMethod || "CASH").toUpperCase();
                const bankName =
                    line.bankName || (line.bankId ? `Bank #${line.bankId}` : null);
                const currencyValue =
                    line.currencyCode ||
                    (line as any).currency ||
                    (line as any).currencySymbol ||
                    (line as any).symbol;

                return (
                    <div
                        key={line.id ?? `${method}-${index}`}
                        className="flex min-w-0 items-center gap-2"
                    >
                        <MethodIcon method={method} />
                        <div className="min-w-0 flex-1">
                            <p className="truncate text-sm text-foreground">
                                {formatMethod(line.paymentMethod)}
                                {bankName && (
                                    <span className="text-muted-foreground"> · {bankName}</span>
                                )}
                            </p>
                            {line.transactionNo && (
                                <p
                                    className="flex items-center gap-1 truncate text-xs text-muted-foreground"
                                    title={line.transactionNo}
                                >
                                    <Hash className="size-3 shrink-0" />
                                    {line.transactionNo}
                                </p>
                            )}
                        </div>
                        {lines.length > 1 && (
                            <Money
                                value={formatLineAmount(line.amount, currencyValue, line.currencyId)}
                                className="text-[13px] font-medium"
                            />
                        )}
                    </div>
                );
            })}

            {remaining > 0 && (
                <span className="pl-8 text-xs text-muted-foreground">
                    +{remaining} {t("payment.more_methods", "more")}
                </span>
            )}
        </div>
    );
};

const Dash = () => <span className="text-muted-foreground">—</span>;

const getPaymentReturnCurrency = (payment: PaymentResponse, amount?: number) => {
    const raw =
        (payment as any).returnCurrency ||
        (payment as any).changeCurrency ||
        (payment as any).currencyCode ||
        (payment as any).currency ||
        (payment as any).currencySymbol ||
        (payment as any).symbol;

    if (raw) {
        return getCurrencyInfo(raw, (payment as any).currencyId, amount);
    }

    if ((payment as any).currencyId != null) {
        return getCurrencyInfo(null, (payment as any).currencyId, amount);
    }

    const lines = extractLines(payment);
    const lineWithCurrency = lines.find(
        (l) => l.currencyCode || (l as any).currency || l.currencyId,
    );
    if (lineWithCurrency) {
        return getCurrencyInfo(
            lineWithCurrency.currencyCode || (lineWithCurrency as any).currency,
            lineWithCurrency.currencyId,
            amount,
        );
    }

    if (amount != null && amount >= 500) {
        return { isKhr: true, code: "KHR", symbol: "៛" };
    }

    return getCurrencyInfo("USD", 1, amount);
};


export const PaymentColumns = ({
    onView,
    onEdit,
    onDelete,
    mode = "sale",
    t = passthrough,
}: PaymentColumnsProps): ColumnDef<PaymentResponse>[] => [
        {
            accessorKey: "paymentNo",
            header: ({ column }) => (
                <SortableHeader column={column} title={t("payment.payment_no", "Payment No.")} />
            ),
            cell: ({ row }) => {
                const payment = row.original;
                return (
                    <div className="min-w-[140px]">
                        <p className="truncate font-medium text-foreground">
                            {payment.paymentNo || `PAY-${payment.id}`}
                        </p>
                        {payment.paymentDate && (
                            <p className="text-xs text-muted-foreground">
                                {formatDate(payment.paymentDate)}
                            </p>
                        )}
                    </div>
                );
            },
        },

        {
            id: "reference",
            header: mode === "purchase"
                ? t("payment.purchase_ref", "Purchase Ref.")
                : t("payment.sale_ref", "Sale Ref."),
            enableSorting: false,
            cell: ({ row }) => {
                const payment = row.original;
                const isPurchase = mode === "purchase" || (mode === "all" && (payment.purchaseId != null || Boolean(payment.purchaseNo)));
                const reference = isPurchase
                    ? payment.purchaseNo || (payment.purchaseId != null ? `PUR-${payment.purchaseId}` : null)
                    : payment.saleNo || (payment.saleId != null ? `SALE-${payment.saleId}` : null);

                if (!reference) return <Dash />;

                const Icon = isPurchase ? ShoppingBag : ShoppingCart;
                return (
                    <span className="inline-flex items-center gap-1.5 text-sm text-text-secondary">
                        <Icon className="size-4 shrink-0 text-muted-foreground" strokeWidth={1.75} />
                        {reference}
                    </span>
                );
            },
        },

        {
            id: "lines",
            header: t("payment.method", "Method"),
            enableSorting: false,
            cell: ({ row }) => <PaymentBreakdown payment={row.original} t={t} />,
        },

        {
            accessorKey: "totalAmount",
            meta: { align: "right" },
            header: ({ column }) => (
                <SortableHeader column={column} title={t("payment.total_bill", "Total Bill")} />
            ),
            cell: ({ row }) => (
                <Money value={row.original.totalAmount ?? row.original.amount ?? 0} />
            ),
        },

        {
            accessorKey: "receivedAmount",
            meta: { align: "right" },
            header: t("payment.received", "Received"),
            cell: ({ row }) => {
                const received = row.original.receivedAmount;
                return received == null ? <Dash /> : <Money value={received} tone="success" />;
            },
        },

        {
            accessorKey: "returnAmount",
            meta: { align: "right" },
            header: t("payment.change", "Change"),
            cell: ({ row }) => {
                const payment = row.original;
                const change = Number(payment.returnAmount ?? 0);

                if (change <= 0) return <Money value={0} tone="muted" className="font-normal" />;

                const currencyInfo = getPaymentReturnCurrency(payment, change);
                const isKhr = currencyInfo.isKhr || change >= 500;

                const changeUSD = (payment as any).changeUSD != null
                    ? Number((payment as any).changeUSD)
                    : isKhr
                        ? change / KHR_RATE
                        : change;

                const changeKHR = (payment as any).changeKHR != null
                    ? Number((payment as any).changeKHR)
                    : isKhr
                        ? change
                        : Math.round(change * KHR_RATE);

                const khrText = `${Math.round(changeKHR).toLocaleString("en-US")} ៛`;
                const usdText = formatMoney(changeUSD);

                return (
                    <div className="flex flex-col items-end">
                        <Money value={isKhr ? khrText : usdText} tone="warning" />
                        <span className="text-xs tabular-nums text-muted-foreground">
                            ≈ {isKhr ? usdText : khrText}
                        </span>
                    </div>
                );
            },
        },

        {
            accessorKey: "dueAmount",
            meta: { align: "right" },
            header: ({ column }) => (
                <SortableHeader column={column} title={t("payment.balance_due", "Balance Due")} />
            ),
            cell: ({ row }) => {
                const due = Number(row.original.dueAmount ?? 0);
                return due <= 0.005
                    ? <Money value={0} tone="muted" className="font-normal" />
                    : <Money value={due} tone="danger" />;
            },
        },

        {
            accessorKey: "username",
            header: t("payment.processed_by", "Processed By"),
            cell: ({ row }) => {
                const payment = row.original;
                const username =
                    payment.username ||
                    (payment.userId != null ? `User #${payment.userId}` : null);
                return username ? <PersonCell name={username} /> : <Dash />;
            },
        },

        {
            accessorKey: "status",
            header: t("common.status", "Status"),
            cell: ({ row }) => <StatusBadge status={row.original.status} />,
        },

        {
            id: "actions",
            header: t("common.action", "Actions"),
            enableHiding: false,
            enableSorting: false,
            cell: ({ row }) => (
                <TableActions
                    onView={onView ? () => onView(row.original) : undefined}
                    onEdit={onEdit ? () => onEdit(row.original) : undefined}
                    onDelete={
                        onDelete ? () => onDelete(row.original.id) : undefined
                    }
                />
            ),
        },
    ];

export default PaymentColumns;
