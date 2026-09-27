import { useState, useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList,
} from "recharts";
import {
  ChevronDown,
  TrendingUp,
  TrendingDown,
  Calendar,
  Layers,
} from "lucide-react";

export interface InteractiveAreaChartProps {
  salesList: any[];
  purchasesList: any[];
}

type TimeRangeOption = "month_compare" | "6m" | "1y" | "2y" | "30d";

// Multi-color palette matching the user's reference column chart
const COLUMN_COLORS = [
  "#3B82F6", // Blue
  "#EF4444", // Red / Coral
  "#84CC16", // Lime Green
  "#14B8A6", // Teal
  "#8B5CF6", // Purple
  "#06B6D4", // Cyan
  "#F97316", // Orange
  "#65A30D", // Olive
  "#1D4ED8", // Deep Blue
  "#FB923C", // Peach
  "#60A5FA", // Sky Blue
  "#DC2626", // Crimson
];

function parseDate(dateStr?: string | null): Date | null {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? null : d;
}

function formatCurrency(val: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(val || 0);
}

function formatCompact(val: number): string {
  if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(1)}M`;
  if (val >= 1_000) return `$${(val / 1_000).toFixed(0)}k`;
  return `$${val}`;
}

// Custom Tooltip
function CustomTooltip({ active, payload, label, isCompare }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-xl border border-border/80 bg-popover/95 backdrop-blur-md px-3.5 py-2.5 shadow-xl text-xs space-y-1.5 min-w-[150px] z-50">
        <p className="font-bold text-foreground text-xs flex items-center justify-between pb-1 border-b border-border/50">
          <span>{label}</span>
          {isCompare && <span className="text-[10px] text-muted-foreground font-normal">Comparison</span>}
        </p>
        <div className="space-y-1 pt-0.5">
          {payload.map((entry: any, i: number) => (
            <div key={i} className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-1.5">
                <span
                  className="size-2 rounded-xs shrink-0"
                  style={{ backgroundColor: entry.color || entry.fill }}
                />
                <span className="text-muted-foreground capitalize text-xs">
                  {entry.name}
                </span>
              </div>
              <span className="font-bold font-mono text-foreground text-xs">
                {formatCurrency(Number(entry.value || 0))}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
}

export default function InteractiveAreaChart({
  salesList,
  purchasesList,
}: InteractiveAreaChartProps) {
  const [timeRange, setTimeRange] = useState<TimeRangeOption>("month_compare");
  const [compareSubView, setCompareSubView] = useState<"week" | "day">("week");
  const [showPurchases, setShowPurchases] = useState(false);

  const now = useMemo(() => new Date(), []);

  const currentMonthName = useMemo(() => {
    return now.toLocaleDateString("en-US", { month: "short" });
  }, [now]);

  const lastMonthDate = useMemo(() => {
    return new Date(now.getFullYear(), now.getMonth() - 1, 1);
  }, [now]);

  const lastMonthName = useMemo(() => {
    return lastMonthDate.toLocaleDateString("en-US", { month: "short" });
  }, [lastMonthDate]);

  // Aggregate data according to chosen period
  const { chartData, compareStats, highestIndex, lowestIndex } = useMemo(() => {
    const isCompare = timeRange === "month_compare";

    if (isCompare) {
      const thisYear = now.getFullYear();
      const thisMonth = now.getMonth();
      const prevYear = lastMonthDate.getFullYear();
      const prevMonth = lastMonthDate.getMonth();

      const daysInThisMonth = new Date(thisYear, thisMonth + 1, 0).getDate();
      const daysInLastMonth = new Date(prevYear, prevMonth + 1, 0).getDate();
      const maxDays = Math.max(daysInThisMonth, daysInLastMonth);

      const thisMonthSalesMap = new Map<number, number>();
      const lastMonthSalesMap = new Map<number, number>();

      let sumThisMonth = 0;
      let sumLastMonth = 0;

      for (const sale of salesList) {
        const d = parseDate(sale.saleDate || sale.createdAt || sale.date);
        if (!d) continue;
        const amount = Number(sale.grandTotal ?? sale.totalAmount ?? 0) || 0;
        const day = d.getDate();

        if (d.getFullYear() === thisYear && d.getMonth() === thisMonth) {
          thisMonthSalesMap.set(day, (thisMonthSalesMap.get(day) || 0) + amount);
          sumThisMonth += amount;
        } else if (d.getFullYear() === prevYear && d.getMonth() === prevMonth) {
          lastMonthSalesMap.set(day, (lastMonthSalesMap.get(day) || 0) + amount);
          sumLastMonth += amount;
        }
      }

      const diff = sumThisMonth - sumLastMonth;
      const pctChange = sumLastMonth > 0 ? (diff / sumLastMonth) * 100 : sumThisMonth > 0 ? 100 : 0;

      // Sub-view 1: By Week (Easy 4-5 grouped bars)
      if (compareSubView === "week") {
        const weeks = [
          { label: "W1 (1-7)", start: 1, end: 7 },
          { label: "W2 (8-14)", start: 8, end: 14 },
          { label: "W3 (15-21)", start: 15, end: 21 },
          { label: "W4 (22-28)", start: 22, end: 28 },
          { label: `W5 (29-${maxDays})`, start: 29, end: maxDays },
        ];

        const weekData = weeks.map((w) => {
          let thisM = 0;
          let lastM = 0;
          for (let d = w.start; d <= w.end; d++) {
            thisM += thisMonthSalesMap.get(d) || 0;
            lastM += lastMonthSalesMap.get(d) || 0;
          }
          return {
            formattedDate: w.label,
            thisMonth: thisM,
            lastMonth: lastM,
            sales: thisM,
          };
        });

        // Find highest week in this month
        let hIdx = -1;
        let lIdx = -1;
        let maxV = -1;
        let minV = Infinity;

        weekData.forEach((item, idx) => {
          if (item.thisMonth > maxV) {
            maxV = item.thisMonth;
            hIdx = idx;
          }
          if (item.thisMonth < minV) {
            minV = item.thisMonth;
            lIdx = idx;
          }
        });

        return {
          chartData: weekData,
          compareStats: { sumThisMonth, sumLastMonth, diff, pctChange },
          highestIndex: maxV > 0 ? hIdx : -1,
          lowestIndex: minV < maxV && minV > 0 ? lIdx : -1,
        };
      }

      // Sub-view 2: By Day (1 to maxDays)
      const dayData: any[] = [];
      let hIdx = -1;
      let lIdx = -1;
      let maxV = -1;
      let minV = Infinity;

      for (let day = 1; day <= maxDays; day++) {
        const thisM = thisMonthSalesMap.get(day) || 0;
        const lastM = lastMonthSalesMap.get(day) || 0;

        if (thisM > maxV) {
          maxV = thisM;
          hIdx = day - 1;
        }
        if (thisM > 0 && thisM < minV) {
          minV = thisM;
          lIdx = day - 1;
        }

        dayData.push({
          formattedDate: `D${day}`,
          thisMonth: thisM,
          lastMonth: lastM,
          sales: thisM,
        });
      }

      return {
        chartData: dayData,
        compareStats: { sumThisMonth, sumLastMonth, diff, pctChange },
        highestIndex: maxV > 0 ? hIdx : -1,
        lowestIndex: minV < maxV && minV > 0 ? lIdx : -1,
      };
    }

    // Monthly aggregation for 6m, 1y, 2y
    if (timeRange === "6m" || timeRange === "1y" || timeRange === "2y") {
      const monthsCount = timeRange === "6m" ? 6 : timeRange === "1y" ? 12 : 24;
      const monthsData: {
        key: string;
        formattedDate: string;
        sales: number;
        purchases: number;
        color: string;
      }[] = [];

      const monthMap = new Map<string, { sales: number; purchases: number }>();

      for (let i = monthsCount - 1; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        const label =
          monthsCount <= 6
            ? d.toLocaleDateString("en-US", { month: "short" })
            : d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });

        monthsData.push({
          key,
          formattedDate: label,
          sales: 0,
          purchases: 0,
          color: COLUMN_COLORS[(monthsCount - 1 - i) % COLUMN_COLORS.length],
        });
        monthMap.set(key, { sales: 0, purchases: 0 });
      }

      for (const sale of salesList) {
        const d = parseDate(sale.saleDate || sale.createdAt || sale.date);
        if (!d) continue;
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        if (monthMap.has(key)) {
          const entry = monthMap.get(key)!;
          entry.sales += Number(sale.grandTotal ?? sale.totalAmount ?? 0) || 0;
        }
      }

      for (const purchase of purchasesList) {
        const d = parseDate(purchase.purchaseDate || purchase.createdAt || purchase.date);
        if (!d) continue;
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        if (monthMap.has(key)) {
          const entry = monthMap.get(key)!;
          entry.purchases += Number(purchase.grandTotal ?? purchase.totalAmount ?? 0) || 0;
        }
      }

      let maxV = -1;
      let minV = Infinity;
      let hIdx = -1;
      let lIdx = -1;

      const finalMonths = monthsData.map((item, idx) => {
        const counts = monthMap.get(item.key);
        const s = counts ? counts.sales : 0;
        const p = counts ? counts.purchases : 0;

        if (s > maxV) {
          maxV = s;
          hIdx = idx;
        }
        if (s > 0 && s < minV) {
          minV = s;
          lIdx = idx;
        }

        return {
          ...item,
          sales: s,
          purchases: p,
        };
      });

      return {
        chartData: finalMonths,
        compareStats: null,
        highestIndex: maxV > 0 ? hIdx : -1,
        lowestIndex: minV < maxV && minV > 0 ? lIdx : -1,
      };
    }

    // 30 days
    const dailyData: any[] = [];
    const dateMap = new Map<string, { sales: number; purchases: number }>();

    for (let i = 29; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const key = d.toISOString().split("T")[0];
      dailyData.push({
        date: key,
        formattedDate: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        sales: 0,
        purchases: 0,
        color: COLUMN_COLORS[i % COLUMN_COLORS.length],
      });
      dateMap.set(key, { sales: 0, purchases: 0 });
    }

    for (const sale of salesList) {
      const d = parseDate(sale.saleDate || sale.createdAt || sale.date);
      if (!d) continue;
      const key = d.toISOString().split("T")[0];
      if (dateMap.has(key)) {
        dateMap.get(key)!.sales += Number(sale.grandTotal ?? sale.totalAmount ?? 0) || 0;
      }
    }

    let maxV = -1;
    let minV = Infinity;
    let hIdx = -1;
    let lIdx = -1;

    const data = dailyData.map((entry, idx) => {
      const counts = dateMap.get(entry.date);
      const s = counts ? counts.sales : 0;
      if (s > maxV) {
        maxV = s;
        hIdx = idx;
      }
      if (s > 0 && s < minV) {
        minV = s;
        lIdx = idx;
      }
      return {
        ...entry,
        sales: s,
        purchases: counts ? counts.purchases : 0,
      };
    });

    return {
      chartData: data,
      compareStats: null,
      highestIndex: maxV > 0 ? hIdx : -1,
      lowestIndex: minV < maxV && minV > 0 ? lIdx : -1,
    };
  }, [timeRange, compareSubView, now, lastMonthDate, salesList, purchasesList]);

  const isCompare = timeRange === "month_compare";

  // Custom index label renderer matching the user's reference image
  const renderCustomBarLabel = (props: any) => {
    const { x, y, width, index, value } = props;
    if (!value || value <= 0) return null;

    const isHighest = index === highestIndex;
    const isLowest = index === lowestIndex;

    if (isHighest) {
      return (
        <text
          x={x + width / 2}
          y={y - 8}
          textAnchor="middle"
          className="text-[10px] font-bold fill-primary select-none"
        >
          ★ Highest
        </text>
      );
    }

    if (isLowest) {
      return (
        <text
          x={x + width / 2}
          y={y - 8}
          textAnchor="middle"
          className="text-[10px] font-medium fill-muted-foreground select-none"
        >
          Low
        </text>
      );
    }

    return null;
  };

  return (
    <div className="bg-card border border-border/60 rounded-2xl p-6 shadow-xs flex flex-col justify-between h-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-base font-bold text-foreground tracking-tight">
              {isCompare
                ? `Sales: ${currentMonthName} vs ${lastMonthName}`
                : timeRange === "6m"
                  ? "Sales: Last 6 Months"
                  : timeRange === "1y"
                    ? "Sales: Last 1 Year"
                    : timeRange === "2y"
                      ? "Sales: Last 2 Years"
                      : "Sales: Last 30 Days"}
            </h2>

            {isCompare && compareStats && (
              <span
                className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                  compareStats.pctChange >= 0
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                    : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20"
                }`}
              >
                {compareStats.pctChange >= 0 ? (
                  <TrendingUp className="size-3" />
                ) : (
                  <TrendingDown className="size-3" />
                )}
                {compareStats.pctChange >= 0 ? "+" : ""}
                {compareStats.pctChange.toFixed(1)}% vs {lastMonthName}
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {isCompare
              ? `Column comparison between ${currentMonthName} and ${lastMonthName}`
              : "Column trend overview with highest index markers"}
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          {/* Sub-view toggle when in compare mode */}
          {isCompare ? (
            <div className="flex items-center bg-muted/80 p-0.5 rounded-xl border border-border/50 text-xs">
              <button
                type="button"
                onClick={() => setCompareSubView("week")}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                  compareSubView === "week"
                    ? "bg-card text-foreground font-semibold shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Weekly
              </button>
              <button
                type="button"
                onClick={() => setCompareSubView("day")}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                  compareSubView === "day"
                    ? "bg-card text-foreground font-semibold shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Daily
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowPurchases(!showPurchases)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-medium border transition-colors cursor-pointer ${
                showPurchases
                  ? "bg-sky-500/10 border-sky-500/30 text-sky-600 dark:text-sky-400"
                  : "border-border/60 text-muted-foreground hover:text-foreground"
              }`}
            >
              <Layers className="size-3" />
              <span>{showPurchases ? "Purchases ON" : "+ Purchases"}</span>
            </button>
          )}

          {/* Time Range Selector */}
          <div className="relative inline-flex items-center">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as TimeRangeOption)}
              className="h-8.5 pl-3 pr-8 rounded-xl border border-border/80 bg-background text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary shadow-2xs appearance-none cursor-pointer hover:bg-muted/30 transition-colors"
            >
              <option value="month_compare">Compare: This vs Last Month</option>
              <option value="6m">Last 6 Months</option>
              <option value="1y">Last 1 Year (12M)</option>
              <option value="2y">Last 2 Years (24M)</option>
              <option value="30d">Last 30 Days</option>
            </select>
            <ChevronDown className="size-3.5 text-muted-foreground absolute right-2.5 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Column / Bar Chart Canvas */}
      <div className="h-[280px] w-full pt-3">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{
              top: 20,
              right: 15,
              left: -15,
              bottom: 0,
            }}
          >
            <CartesianGrid vertical={false} stroke="#e2e8f0" strokeDasharray="3 3" opacity={0.5} />

            <XAxis
              dataKey="formattedDate"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={timeRange === "2y" || (isCompare && compareSubView === "day") ? 18 : 6}
              tick={{ fill: "#94a3b8", fontSize: 11 }}
            />

            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={6}
              tickFormatter={formatCompact}
              tick={{ fill: "#94a3b8", fontSize: 10 }}
            />

            <Tooltip content={<CustomTooltip isCompare={isCompare} />} />

            {isCompare ? (
              <>
                {/* Last Month Bar */}
                <Bar
                  dataKey="lastMonth"
                  name={`Last Month (${lastMonthName})`}
                  fill="#F59E0B"
                  radius={[5, 5, 0, 0]}
                  maxBarSize={32}
                />
                {/* This Month Bar */}
                <Bar
                  dataKey="thisMonth"
                  name={`This Month (${currentMonthName})`}
                  fill="#2563EB"
                  radius={[5, 5, 0, 0]}
                  maxBarSize={32}
                >
                  <LabelList content={renderCustomBarLabel} />
                </Bar>
              </>
            ) : showPurchases ? (
              <>
                {/* Purchases Bar */}
                <Bar
                  dataKey="purchases"
                  name="Purchases"
                  fill="#38BDF8"
                  radius={[5, 5, 0, 0]}
                  maxBarSize={28}
                />
                {/* Sales Bar */}
                <Bar
                  dataKey="sales"
                  name="Sales"
                  fill="#2563EB"
                  radius={[5, 5, 0, 0]}
                  maxBarSize={28}
                >
                  <LabelList content={renderCustomBarLabel} />
                </Bar>
              </>
            ) : (
              /* Single Sales Column with Multi-colors matching reference */
              <Bar
                dataKey="sales"
                name="Sales"
                radius={[6, 6, 0, 0]}
                maxBarSize={36}
              >
                <LabelList content={renderCustomBarLabel} />
                {chartData.map((entry: any, index: number) => (
                  <Cell
                    key={`bar-cell-${index}`}
                    fill={entry.color || COLUMN_COLORS[index % COLUMN_COLORS.length]}
                    className="hover:opacity-85 transition-opacity cursor-pointer"
                  />
                ))}
              </Bar>
            )}
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Bottom Legend and Summary */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-border/40 mt-2 text-xs">
        {isCompare ? (
          <>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300">
                <span className="size-2.5 rounded-xs bg-[#2563EB]" />
                <span>{currentMonthName} (This Month)</span>
              </div>
              <div className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300">
                <span className="size-2.5 rounded-xs bg-[#F59E0B]" />
                <span>{lastMonthName} (Last Month)</span>
              </div>
            </div>
            {compareStats && (
              <div className="text-muted-foreground font-mono">
                <span className="font-semibold text-foreground">{formatCurrency(compareStats.sumThisMonth)}</span>
                {" vs "}
                <span>{formatCurrency(compareStats.sumLastMonth)}</span>
              </div>
            )}
          </>
        ) : (
          <>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300">
                <span className="size-2.5 rounded-xs bg-primary" />
                <span>Sales Revenue</span>
              </div>
              {showPurchases && (
                <div className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300">
                  <span className="size-2.5 rounded-xs bg-[#38BDF8]" />
                  <span>Purchases</span>
                </div>
              )}
            </div>
            <div className="text-[11px] text-muted-foreground">
              <span>Bars styled with peak index indicators</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
