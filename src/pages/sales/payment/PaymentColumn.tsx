import type { ColumnDef } from "@tanstack/react-table";
import {
    Building2,
    Coins,
    CreditCard,
    Hash,
    Receipt,
    ShoppingBag,
    ShoppingCart,
    User,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { TableActions } from "@/components/ui/table-actions";
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
}

const formatCurrency = (value: number | string | null | undefined) => {
    const amount = Number(value ?? 0);

    return `$${(Number.isFinite(amount) ? amount : 0).toLocaleString(
        "en-US",
        {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        },
    )}`;
};

const formatMethod = (method?: string | null) => {
    const value = String(method || "CASH")
        .trim()
        .replace(/_/g, " ")
        .toLowerCase();

    return value.replace(/\b\w/g, (char) => char.toUpperCase());
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

const Amount = ({
    children,
    className = "",
}: {
    children: React.ReactNode;
    className?: string;
}) => (
    <span
        className={`font-mono text-xs font-semibold tabular-nums ${className}`}
    >
        {children}
    </span>
);

const PaymentBreakdown = ({
    payment,
}: {
    payment: PaymentResponse;
}) => {
    const lines = extractLines(payment);

    if (lines.length === 0) {
        return (
            <span className="text-xs text-muted-foreground">
                No payment details
            </span>
        );
    }

    const visibleLines = lines.slice(0, 2);
    const remaining = lines.length - visibleLines.length;

    return (
        <div className="flex min-w-[155px] max-w-[230px] flex-col gap-1.5 py-0.5">
            {visibleLines.map((line, index) => {
                const method = String(line.paymentMethod || "CASH").toUpperCase();
                const isCash = method.includes("CASH");
                const bankName =
                    line.bankName || (line.bankId ? `Bank #${line.bankId}` : null);
                const currencyValue =
                    line.currencyCode ||
                    (line as any).currency ||
                    (line as any).currencySymbol ||
                    (line as any).symbol;
                const currencyInfo = getCurrencyInfo(currencyValue, line.currencyId);

                return (
                    <div
                        key={line.id ?? `${method}-${index}`}
                        className="flex min-w-0 items-center gap-2"
                    >
                        <span
                            className={`flex size-7 shrink-0 items-center justify-center ${isCash
                                ? "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
                                : "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300"
                                }`}
                        >
                            {isCash ? (
                                <Coins className="size-3.5" />
                            ) : method.includes("CARD") ? (
                                <CreditCard className="size-3.5" />
                            ) : (
                                <Building2 className="size-3.5" />
                            )}
                        </span>

                        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                            <span className="truncate text-xs font-medium text-foreground">
                                {formatMethod(line.paymentMethod)}
                            </span>

                            {bankName && (
                                <span className="truncate text-[10px] text-muted-foreground">
                                    {bankName}
                                </span>
                            )}

                            {line.transactionNo && (
                                <span
                                    className="flex items-center gap-1 truncate font-mono text-[10px] text-muted-foreground"
                                    title={line.transactionNo}
                                >
                                    <Hash className="size-2.5 shrink-0" />
                                    {line.transactionNo}
                                </span>
                            )}
                        </div>

                        <div className="flex shrink-0 flex-col items-end">
                            <Amount className="text-foreground">
                                {formatLineAmount(
                                    line.amount,
                                    currencyValue,
                                    line.currencyId,
                                )}
                            </Amount>
                            {/* <span
                                className={`text-[9px] font-mono ${
                                    currencyInfo.isKhr
                                        ? "font-semibold text-emerald-600 dark:text-emerald-400"
                                        : "text-muted-foreground"
                                }`}
                            >
                                {currencyInfo.code}
                            </span> */}
                        </div>
                    </div>
                );
            })}

            {remaining > 0 && (
                <span className="pl-9 text-[10px] text-muted-foreground">
                    +{remaining} more payment {remaining === 1 ? "method" : "methods"}
                </span>
            )}
        </div>
    );
};

const MoneyCell = ({
    value,
    currency,
    currencyId,
    color = "default",
}: {
    value: number | string | null | undefined;
    currency?: string | null;
    currencyId?: number | null;
    color?: "default" | "success" | "warning" | "danger";
}) => {
    const colors = {
        default: "text-foreground",
        success: "text-emerald-600 dark:text-emerald-400",
        warning: "text-amber-600 dark:text-amber-400",
        danger: "text-rose-600 dark:text-rose-400",
    };

    return (
        <Amount className={colors[color]}>
            {formatLineAmount(value, currency, currencyId)}
        </Amount>
    );
};

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
}: PaymentColumnsProps): ColumnDef<PaymentResponse>[] => [
        {
            accessorKey: "paymentNo",
            header: ({ column }) => (
                <SortableHeader column={column} title="Payment No." />
            ),
            cell: ({ row }) => {
                const payment = row.original;

                return (
                    <div className="flex min-w-[130px] items-center gap-2.5">
                        {/* <div className="flex size-8 shrink-0 items-center justify-center bg-muted text-muted-foreground">
                            <Receipt className="size-4" />
                        </div> */}

                        <div className="flex min-w-0 flex-col gap-0.5">
                            <span className="truncate font-mono text-xs font-semibold text-foreground">
                                {payment.paymentNo || `PAY-${payment.id}`}
                            </span>

                        </div>
                    </div>
                );
            },
        },

        // {
        //     id: "reference",
        //     header: mode === "purchase" ? "Purchase Ref." : mode === "sale" ? "Sale Ref." : "Reference",
        //     enableSorting: false,
        //     cell: ({ row }) => {
        //         const payment = row.original;

        //         if (mode === "purchase") {
        //             const reference = payment.purchaseNo
        //                 ? String(payment.purchaseNo)
        //                 : payment.purchaseId != null
        //                     ? `PUR-${payment.purchaseId}`
        //                     : null;

        //             return reference ? (
        //                 <div className="flex min-w-[110px] items-center gap-2">
        //                     <ShoppingBag className="size-3.5 shrink-0 text-muted-foreground" />
        //                     <span className="font-mono text-xs font-medium">{reference}</span>
        //                 </div>
        //             ) : (
        //                 <span className="text-xs text-muted-foreground">—</span>
        //             );
        //         }

        //         if (mode === "sale") {
        //             const reference = payment.saleNo
        //                 ? String(payment.saleNo)
        //                 : payment.saleId != null
        //                     ? `SALE-${payment.saleId}`
        //                     : null;

        //             return reference ? (
        //                 <div className="flex min-w-[110px] items-center gap-2">
        //                     <ShoppingCart className="size-3.5 shrink-0 text-muted-foreground" />
        //                     <span className="font-mono text-xs font-medium">{reference}</span>
        //                 </div>
        //             ) : (
        //                 <span className="text-xs text-muted-foreground">—</span>
        //             );
        //         }

        //         const isPurchase =
        //             payment.purchaseId != null || Boolean(payment.purchaseNo);

        //         const reference = isPurchase
        //             ? payment.purchaseNo || `PUR-${payment.purchaseId}`
        //             : payment.saleNo || (payment.saleId != null ? `SALE-${payment.saleId}` : null);

        //         return reference ? (
        //             <div className="flex min-w-[110px] items-center gap-2">
        //                 {isPurchase ? (
        //                     <ShoppingBag className="size-3.5 shrink-0 text-muted-foreground" />
        //                 ) : (
        //                     <ShoppingCart className="size-3.5 shrink-0 text-muted-foreground" />
        //                 )}
        //                 <span className="font-mono text-xs font-medium">{reference}</span>
        //             </div>
        //         ) : (
        //             <span className="text-xs text-muted-foreground">—</span>
        //         );
        //     },
        // },

        {
            id: "lines",
            header: "Payment Method",
            enableSorting: false,
            cell: ({ row }) => <PaymentBreakdown payment={row.original} />,
        },

        {
            accessorKey: "totalAmount",
            header: ({ column }) => (
                <SortableHeader column={column} title="Total Bill" />
            ),
            cell: ({ row }) => (
                <MoneyCell
                    value={row.original.totalAmount ?? row.original.amount ?? 0}
                />
            ),
        },

        {
            accessorKey: "receivedAmount",
            header: "Received",
            cell: ({ row }) => {
                const received = row.original.receivedAmount;

                if (received == null) {
                    return <span className="text-xs text-muted-foreground">—</span>;
                }

                return <MoneyCell value={received} color="success" />;
            },
        },

        {
            accessorKey: "returnAmount",
            header: "Change",
            cell: ({ row }) => {
                const payment = row.original;
                const change = Number(payment.returnAmount ?? 0);

                if (change <= 0) {
                    return (
                        <span className="font-mono text-xs text-muted-foreground">
                            $0.00
                        </span>
                    );
                }

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

                return (
                    <div className="flex min-w-[95px] flex-col gap-0.5">
                        {isKhr ? (
                            <>
                                <Amount className="text-amber-600 dark:text-amber-400 font-semibold">
                                    {Math.round(changeKHR).toLocaleString("en-US")} ៛
                                </Amount>
                                <span className="font-mono text-[10px] text-muted-foreground">
                                    ≈ ${changeUSD.toLocaleString("en-US", {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                    })}
                                </span>
                            </>
                        ) : (
                            <>
                                <Amount className="text-amber-600 dark:text-amber-400 font-semibold">
                                    ${changeUSD.toLocaleString("en-US", {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                    })}
                                </Amount>
                                <span className="font-mono text-[10px] text-muted-foreground">
                                    ≈ {Math.round(changeKHR).toLocaleString("en-US")} ៛
                                </span>
                            </>
                        )}
                    </div>
                );
            },
        },

        {
            accessorKey: "dueAmount",
            header: ({ column }) => (
                <SortableHeader column={column} title="Balance Due" />
            ),
            cell: ({ row }) => {
                const due = Number(row.original.dueAmount ?? 0);

                if (due <= 0.005) {
                    return (
                        <Badge
                            variant="outline"
                            className="border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-400"
                        >
                            Paid
                        </Badge>
                    );
                }

                return (
                    <div className="flex min-w-[85px] flex-col gap-1">
                        <MoneyCell value={due} color="danger" />
                        <span className="text-[10px] text-muted-foreground">Outstanding</span>
                    </div>
                );
            },
        },

        // {
        //     accessorKey: "paymentDate",
        //     header: ({ column }) => (
        //         <SortableHeader column={column} title="Date" />
        //     ),
        //     cell: ({ row }) => (
        //         <span className="whitespace-nowrap text-xs text-muted-foreground">
        //             {row.original.paymentDate
        //                 ? formatDate(row.original.paymentDate)
        //                 : "—"}
        //         </span>
        //     ),
        // },

        {
            accessorKey: "username",
            header: "Processed By",
            cell: ({ row }) => {
                const payment = row.original;
                const username =
                    payment.username ||
                    (payment.userId != null ? `User #${payment.userId}` : null);

                if (!username) {
                    return <span className="text-xs text-muted-foreground">—</span>;
                }

                return (
                    <div className="flex min-w-[100px] items-center gap-2">
                        <div className="flex size-7 shrink-0 items-center justify-center bg-muted">
                            <User className="size-3.5 text-muted-foreground" />
                        </div>
                        <span className="truncate text-xs font-medium">{username}</span>
                    </div>
                );
            },
        },

        {
            accessorKey: "status",
            header: "Status",
            cell: ({ row }) => <StatusBadge status={row.original.status} />,
        },

        {
            id: "actions",
            header: "Actions",
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