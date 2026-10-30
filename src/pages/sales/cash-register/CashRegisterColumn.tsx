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
              <span className="tabular-nums font-bold text-xs text-foreground">
                {reg.registerNo}
              </span>
              {isOpen && (
                <span className="flex h-2 w-2 relative" title="Active Shift">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-success" />
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
                className="size-7 rounded-full object-cover border border-border"
              />
            ) : (
              <div className="size-7 rounded-full bg-linear-to-tr from-primary/10 to-primary/10 text-white flex items-center justify-center font-bold text-[12px] shadow-2xs">
                {initial}
              </div>
            )}
            <div className="flex flex-col">
              <span className="font-medium text-xs text-foreground leading-tight">
                {reg.userName || "N/A"}
              </span>
              <span className="text-[11px] text-muted-foreground flex items-center gap-1">
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
            <div className="flex items-center gap-1 text-foreground font-medium text-[12px]">
              {/* <Clock className="size-3 text-muted-foreground shrink-0" /> */}
              <span>{reg.openedAt ? formatDate(reg.openedAt, "dateTime") : "N/A"}</span>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
              {isOpen ? (
                <span className="text-success font-semibold flex items-center gap-1">
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
        <span className="tabular-nums text-xs font-semibold text-foreground">
          {formatCurrency(row.original.openingBalance)}
        </span>
      ),
    },
    {
      accessorKey: "totalSales",
      header: ({ column }) => <SortableHeader column={column} title="Total Sales" />,
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="tabular-nums text-xs font-bold text-success">
            {formatCurrency(row.original.totalSales)}
          </span>
          <span className="text-[11px] text-muted-foreground font-medium">
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
          <div className="flex flex-col gap-0.5 text-[12px] tabular-nums">
            <span className="text-success font-semibold flex items-center gap-1">
              <span className="text-[11px] text-muted-foreground font-sans">Cash:</span>
              {formatCurrency(cash)}
            </span>
            <span className="text-primary font-semibold flex items-center gap-1">
              <span className="text-[11px] text-muted-foreground font-sans">Bank:</span>
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
          return <span className="text-xs text-muted-foreground tabular-nums">$0.00</span>;
        }

        return (
          <div className="flex flex-col gap-0.5 text-[11px] tabular-nums">
            {cashIn > 0 && (
              <span className="text-success font-semibold flex items-center gap-0.5">
                <ArrowDownRight className="size-2.5" />
                +{formatCurrency(cashIn)}
              </span>
            )}
            {cashOut > 0 && (
              <span className="text-warning-text font-semibold flex items-center gap-0.5">
                <ArrowUpRight className="size-2.5" />
                -{formatCurrency(cashOut)}
              </span>
            )}
            {returns > 0 && (
              <span className="text-destructive font-semibold flex items-center gap-0.5">
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
          <div className="flex flex-col text-xs tabular-nums">
            <span className="font-semibold text-foreground">
              Exp: {formatCurrency(expected)}
            </span>
            <span className="text-[11px] text-muted-foreground">
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
            <span className="text-[12px] text-muted-foreground italic font-sans">
              In shift
            </span>
          );
        }

        const diff = Number(reg.difference || 0);
        const isBalanced = Math.abs(diff) < 0.005;
        const isOver = diff > 0;

        return (
          <span
            className={`tabular-nums text-xs font-semibold px-2 py-0.5 rounded-full inline-block ${isBalanced
              ? "bg-primary-light text-primary border border-primary/20"
              : isOver
                ? "bg-success/10 text-success border border-success/20"
                : "bg-destructive/10 text-destructive border border-destructive/20"
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
            className={`text-[12px] font-semibold gap-1 px-2.5 py-0.5 ${isOpen
              ? "bg-success/15 text-success border border-success/30 hover:bg-success/20"
              : "bg-muted text-text-secondary border border-border hover:bg-muted"
              }`}
            variant="outline"
          >
            {isOpen && <span className="size-1.5 rounded-full bg-success animate-pulse" />}
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
              className="h-8 w-8 p-0 text-text-secondary hover:text-foreground cursor-pointer"
              title="View Details"
            >
              <Eye className="size-4" />
            </Button>

            {isOpen && canClose && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onClose?.(reg)}
                className="h-8 px-2 text-xs font-semibold text-destructive hover:bg-destructive/10 gap-1 cursor-pointer"
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
