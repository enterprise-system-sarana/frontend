import type { CashRegisterResponse } from "@/types/sales/CashRegister";
import { SortableHeader } from "@/utils/sort-table-header";
import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, Lock, Clock, Store, ArrowUpRight, ArrowDownRight, RotateCcw } from "lucide-react";
import { formatDate } from "@/utils/formatDate";

interface CashRegisterColumnProps {
  onView?: (register: CashRegisterResponse) => void;
  onClose?: (register: CashRegisterResponse) => void;
  canClose?: boolean;
}

const formatCurrency = (val: number | null | undefined) => {
  if (val === null || val === undefined) return "--";
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

export const CashRegisterColumns = ({
  onView,
  onClose,
  canClose = true,
}: CashRegisterColumnProps): ColumnDef<CashRegisterResponse>[] => [
    {
      accessorKey: "registerNo",
      header: ({ column }) => <SortableHeader column={column} title="Register #" />,
      cell: ({ row }) => {
        const reg = row.original;
        const isOpen = reg.status === "OPEN";

        return (
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-mono font-bold text-xs text-slate-900 dark:text-white">
                {reg.registerNo}
              </span>
              {isOpen && (
                <span className="flex h-2 w-2 relative" title="Active Shift">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
              )}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "userName",
      header: ({ column }) => <SortableHeader column={column} title="Cashier" />,
      cell: ({ row }) => {
        const reg = row.original;
        const initial = reg.userName?.charAt(0).toUpperCase() || "C";

        return (
          <div className="flex items-center gap-2">
            {reg.userProfileImage ? (
              <img
                src={reg.userProfileImage}
                alt={reg.userName}
                className="size-7 rounded-full object-cover border border-slate-200 dark:border-slate-700"
              />
            ) : (
              <div className="size-7 rounded-full bg-linear-to-tr from-sky-500 to-indigo-500 text-white flex items-center justify-center font-bold text-[11px] shadow-2xs">
                {initial}
              </div>
            )}
            <div className="flex flex-col">
              <span className="font-medium text-xs text-foreground leading-tight">
                {reg.userName || "N/A"}
              </span>
              <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                <Store className="size-2.5" />
                {reg.storeName || `Store #${reg.storeId}`}
              </span>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "openedAt",
      header: ({ column }) => <SortableHeader column={column} title="Shift Period" />,
      cell: ({ row }) => {
        const reg = row.original;
        const duration = getShiftDuration(reg.openedAt, reg.closedAt);
        const isOpen = reg.status === "OPEN";

        return (
          <div className="flex flex-col gap-0.5 text-xs">
            <div className="flex items-center gap-1 text-slate-800 dark:text-slate-200 font-medium text-[11px]">
              {/* <Clock className="size-3 text-slate-400 shrink-0" /> */}
              <span>{reg.openedAt ? formatDate(reg.openedAt, "dateTime") : "N/A"}</span>
            </div>
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
              {isOpen ? (
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                  Active now ({duration || "ongoing"})
                </span>
              ) : (
                <span>
                  Closed: {reg.closedAt ? formatDate(reg.closedAt, "time") : "N/A"}
                  {duration && ` • ${duration}`}
                </span>
              )}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "openingBalance",
      header: ({ column }) => <SortableHeader column={column} title="Opening Cash" />,
      cell: ({ row }) => (
        <span className="font-mono text-xs font-semibold text-foreground">
          {formatCurrency(row.original.openingBalance)}
        </span>
      ),
    },
    {
      accessorKey: "totalSales",
      header: ({ column }) => <SortableHeader column={column} title="Total Sales" />,
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400">
            {formatCurrency(row.original.totalSales)}
          </span>
          <span className="text-[10px] text-muted-foreground font-medium">
            {row.original.saleCount || 0} orders
          </span>
        </div>
      ),
    },
    {
      id: "tenderBreakdown",
      header: "Cash/Bank",
      cell: ({ row }) => {
        const cash = Number(row.original.totalCashSales ?? 0);
        const bank = Number(row.original.totalBankSales ?? 0);

        return (
          <div className="flex flex-col gap-0.5 text-[11px] font-mono">
            <span className="text-emerald-700 dark:text-emerald-300 font-semibold flex items-center gap-1">
              <span className="text-[10px] text-muted-foreground font-sans">Cash:</span>
              {formatCurrency(cash)}
            </span>
            <span className="text-sky-700 dark:text-sky-300 font-semibold flex items-center gap-1">
              <span className="text-[10px] text-muted-foreground font-sans">Bank:</span>
              {formatCurrency(bank)}
            </span>
          </div>
        );
      },
    },
    {
      id: "adjustments",
      header: "Cash ",
      cell: ({ row }) => {
        const cashIn = Number(row.original.totalCashIn || 0);
        const cashOut = Number(row.original.totalCashOut || 0);
        const returns = Number(row.original.totalReturns || 0);
        const hasAny = cashIn > 0 || cashOut > 0 || returns > 0;

        if (!hasAny) {
          return <span className="text-xs text-muted-foreground font-mono">$0.00</span>;
        }

        return (
          <div className="flex flex-col gap-0.5 text-[10px] font-mono">
            {cashIn > 0 && (
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-0.5">
                <ArrowDownRight className="size-2.5" />
                +{formatCurrency(cashIn)}
              </span>
            )}
            {cashOut > 0 && (
              <span className="text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-0.5">
                <ArrowUpRight className="size-2.5" />
                -{formatCurrency(cashOut)}
              </span>
            )}
            {returns > 0 && (
              <span className="text-rose-600 dark:text-rose-400 font-semibold flex items-center gap-0.5">
                <RotateCcw className="size-2.5" />
                -{formatCurrency(returns)}
              </span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "expectedBalance",
      header: ({ column }) => <SortableHeader column={column} title="Expected " />,
      cell: ({ row }) => {
        const reg = row.original;
        const expected =
          reg.expectedBalance !== null && reg.expectedBalance !== undefined
            ? Number(reg.expectedBalance)
            : Number(reg.openingBalance || 0) +
            Number(reg.totalCashSales ?? reg.totalSales ?? 0) -
            Number(reg.totalReturns || 0) +
            Number(reg.totalCashIn || 0) -
            Number(reg.totalCashOut || 0);

        const isClosed = reg.status === "CLOSED";

        return (
          <div className="flex flex-col text-xs font-mono">
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              Exp: {formatCurrency(expected)}
            </span>
            <span className="text-[10px] text-muted-foreground">
              {isClosed ? `Act: ${formatCurrency(reg.closingBalance)}` : "In Progress"}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: "difference",
      header: ({ column }) => <SortableHeader column={column} title="Difference" />,
      cell: ({ row }) => {
        const reg = row.original;
        if (reg.status !== "CLOSED") {
          return (
            <span className="text-[11px] text-muted-foreground italic font-sans">
              In shift
            </span>
          );
        }

        const diff = Number(reg.difference || 0);
        const isBalanced = Math.abs(diff) < 0.005;
        const isOver = diff > 0;

        return (
          <span
            className={`font-mono text-xs font-semibold px-2 py-0.5 rounded-full inline-block ${isBalanced
              ? "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
              : isOver
                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                : "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-800"
              }`}
          >
            {isBalanced ? "Balanced" : isOver ? `+${formatCurrency(diff)} Over` : `${formatCurrency(diff)} Short`}
          </span>
        );
      },
    },
    {
      accessorKey: "status",
      header: ({ column }) => <SortableHeader column={column} title="Status" />,
      cell: ({ row }) => {
        const isOpen = row.original.status === "OPEN";
        return (
          <Badge
            className={`text-[11px] font-semibold gap-1 px-2.5 py-0.5 ${isOpen
              ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20"
              : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-200"
              }`}
            variant="outline"
          >
            {isOpen && <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />}
            {row.original.status}
          </Badge>
        );
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const reg = row.original;
        const isOpen = reg.status === "OPEN";

        return (
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onView?.(reg)}
              className="h-8 w-8 p-0 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white cursor-pointer"
              title="View Details"
            >
              <Eye className="size-4" />
            </Button>

            {isOpen && canClose && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onClose?.(reg)}
                className="h-8 px-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 gap-1 cursor-pointer"
                title="Close Shift"
              >
                <Lock className="size-3.5" />
                <span>Close</span>
              </Button>
            )}
          </div>
        );
      },
    },
  ];
