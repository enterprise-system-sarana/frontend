import { useState, useMemo } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  TrendingUp,
  Package,
  DollarSign,
  PieChart as PieChartIcon,
  ShoppingBag,
} from "lucide-react";
import { useReport } from "@/hooks/reports/useReport";

export interface TopProductsPieChartProps {
  salesList: any[];
  productList?: any[];
}

// Vibrant curated colors matching the user's reference chart
const SLICE_COLORS = [
  "#EF4444", // Red
  "#22C55E", // Green
  "#6366F1", // Blue / Indigo
  "#EAB308", // Yellow
  "#EC4899", // Pink / Magenta
  "#06B6D4", // Cyan
  "#F59E0B", // Amber / Orange
  "#8B5CF6", // Purple
  "#14B8A6", // Teal
  "#64748B", // Slate
];

interface ProductStat {
  name: string;
  quantity: number;
  revenue: number;
  value: number;
  color: string;
}

// Custom two-line external label with pointer line matching the reference image
const renderCustomizedLabel = (props: any) => {
  const { cx, cy, midAngle, outerRadius, percent, name } = props;
  if (!percent || percent < 0.02) return null;

  const RADIAN = Math.PI / 180;
  const sin = Math.sin(-midAngle * RADIAN);
  const cos = Math.cos(-midAngle * RADIAN);

  // Line anchor points
  const sx = cx + (outerRadius + 2) * cos;
  const sy = cy + (outerRadius + 2) * sin;
  const mx = cx + (outerRadius + 14) * cos;
  const my = cy + (outerRadius + 14) * sin;
  const ex = mx + (cos >= 0 ? 1 : -1) * 12;
  const ey = my;
  const textAnchor = cos >= 0 ? "start" : "end";

  const safeName = name || "Product";
  const displayName = safeName.length > 12 ? `${safeName.substring(0, 10)}...` : safeName;
  const percentText = `${(percent * 100).toFixed(1)}%`;

  return (
    <g className="transition-all duration-300">
      {/* Pointer connector line */}
      <path
        d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`}
        stroke="#94a3b8"
        strokeWidth={1}
        fill="none"
        strokeOpacity={0.7}
      />
      <circle cx={ex} cy={ey} r={1.5} fill="#94a3b8" />
      {/* Label text: Line 1 = Name, Line 2 = Percentage */}
      <text
        x={ex + (cos >= 0 ? 1 : -1) * 4}
        y={ey}
        textAnchor={textAnchor}
        dominantBaseline="central"
      >
        <tspan
          x={ex + (cos >= 0 ? 1 : -1) * 4}
          dy="-0.3em"
          className="text-[11px] font-semibold fill-slate-800 dark:fill-slate-100"
        >
          {displayName}
        </tspan>
        <tspan
          x={ex + (cos >= 0 ? 1 : -1) * 4}
          dy="1.25em"
          className="text-[10px] font-mono font-medium fill-slate-500 dark:fill-slate-400"
        >
          {percentText}
        </tspan>
      </text>
    </g>
  );
};

// Custom interactive Tooltip
function CustomTooltip({ active, payload, metric }: any) {
  if (active && payload && payload.length) {
    const data = payload[0].payload as ProductStat & { percent: number };
    const percent = data.percent !== undefined ? (data.percent * 100).toFixed(1) : "0.0";

    return (
      <div className="rounded-xl border border-border/80 bg-popover/95 backdrop-blur-md px-3.5 py-2.5 shadow-xl text-xs space-y-1.5 min-w-[160px] z-50">
        <div className="flex items-center gap-2 border-b border-border/60 pb-1.5">
          <span
            className="size-2.5 rounded-full shrink-0"
            style={{ backgroundColor: payload[0].color || data.color }}
          />
          <p className="font-bold text-foreground text-xs truncate max-w-[140px]">
            {data.name}
          </p>
        </div>
        <div className="space-y-1 text-xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span>Units Sold:</span>
            <span className="font-bold font-mono text-foreground">
              {data.quantity.toLocaleString()} pcs
            </span>
          </div>
          <div className="flex items-center justify-between text-muted-foreground">
            <span>Sales Revenue:</span>
            <span className="font-bold font-mono text-emerald-600 dark:text-emerald-400">
              ${data.revenue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <div className="flex items-center justify-between text-muted-foreground pt-1 border-t border-border/40">
            <span>Share of {metric === "quantity" ? "Volume" : "Revenue"}:</span>
            <span className="font-extrabold font-mono text-primary">
              {percent}%
            </span>
          </div>
        </div>
      </div>
    );
  }
  return null;
}

export default function TopProductsPieChart({
  salesList,
  productList = [],
}: TopProductsPieChartProps) {
  const [metric, setMetric] = useState<"quantity" | "revenue">("quantity");
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Fetch sales items report to guarantee we get individual product items
  const { data: reportItemsData, isLoading: isReportLoading } = useReport.useSalesItemsReport(undefined, {
    page: 1,
    size: 1000,
  });

  // Extract and aggregate 100% REAL product items
  const { chartData, totalMetricValue, totalUnits, totalSalesRevenue } = useMemo(() => {
    const rawItems: { productName: string; qty: number; revenue: number }[] = [];

    // 1. Try extracting items from salesList if items are embedded
    let hasSalesListItems = false;
    for (const sale of salesList) {
      if (Array.isArray(sale.items) && sale.items.length > 0) {
        hasSalesListItems = true;
        for (const item of sale.items) {
          const name =
            item.productName ||
            productList.find((p) => p.id === item.productId)?.name ||
            `Product #${item.productId || "Item"}`;

          // Support both 'qty' and 'quantity' fields from backend
          const rawQty = item.qty !== undefined ? item.qty : (item.quantity !== undefined ? item.quantity : 1);
          const returned = Number(item.returnedQuantity || 0);
          const qty = Math.max(0, Number(rawQty) - returned);
          const price = Number(item.price || 0);
          const discount = Number(item.itemDiscount ?? item.discount ?? 0);
          const revenue = Number(item.subtotal ?? item.subTotal ?? (price * qty - discount)) || 0;

          if (qty > 0 || revenue > 0) {
            rawItems.push({ productName: name, qty, revenue });
          }
        }
      }
    }

    // 2. If salesList didn't have items, extract from reportItemsData
    if (!hasSalesListItems && reportItemsData) {
      const payload = (reportItemsData as any)?.payload ?? reportItemsData;
      const groups = Array.isArray(payload?.data)
        ? payload.data
        : Array.isArray(payload)
          ? payload
          : payload?.sales
            ? [payload]
            : [];

      for (const group of groups) {
        // Direct flat sale item
        if (group.productName && !group.sales && !group.items) {
          const name = group.productName ?? group.product?.name ?? `Product #${group.productId || group.id}`;
          const rawQty = group.qty !== undefined ? group.qty : (group.quantity !== undefined ? group.quantity : 1);
          const qty = Number(rawQty);
          const price = Number(group.price || 0);
          const discount = Number(group.itemDiscount ?? group.discount ?? 0);
          const revenue = Number(group.subTotal ?? group.subtotal ?? (price * qty - discount)) || 0;

          if (qty > 0 || revenue > 0) {
            rawItems.push({ productName: name, qty, revenue });
          }
          continue;
        }

        // Nested in group.sales or group.items
        const sales = Array.isArray(group.sales)
          ? group.sales
          : Array.isArray(group.items)
            ? [group]
            : [];

        for (const sale of sales) {
          const items = Array.isArray(sale.items) ? sale.items : [];
          for (const item of items) {
            const name = item.productName ?? item.product?.name ?? `Product #${item.productId || item.id}`;
            const rawQty = item.qty !== undefined ? item.qty : (item.quantity !== undefined ? item.quantity : 1);
            const qty = Number(rawQty);
            const price = Number(item.price || 0);
            const discount = Number(item.itemDiscount ?? item.discount ?? 0);
            const revenue = Number(item.subTotal ?? item.subtotal ?? (price * qty - discount)) || 0;

            if (qty > 0 || revenue > 0) {
              rawItems.push({ productName: name, qty, revenue });
            }
          }
        }
      }
    }

    // Aggregate by product name
    const productAggMap = new Map<string, { quantity: number; revenue: number }>();
    let sumUnits = 0;
    let sumRev = 0;

    for (const item of rawItems) {
      const current = productAggMap.get(item.productName) || { quantity: 0, revenue: 0 };
      productAggMap.set(item.productName, {
        quantity: current.quantity + item.qty,
        revenue: current.revenue + item.revenue,
      });
      sumUnits += item.qty;
      sumRev += item.revenue;
    }

    // Convert map to sorted list
    const sortedList: { name: string; quantity: number; revenue: number; value: number }[] = [];
    productAggMap.forEach((val, name) => {
      sortedList.push({
        name,
        quantity: val.quantity,
        revenue: val.revenue,
        value: metric === "quantity" ? val.quantity : val.revenue,
      });
    });

    sortedList.sort((a, b) => b.value - a.value);

    // Keep top 5 items and group remainder into Others
    const topCount = 5;
    const finalData: ProductStat[] = [];

    if (sortedList.length <= topCount) {
      sortedList.forEach((item, index) => {
        finalData.push({
          ...item,
          color: SLICE_COLORS[index % SLICE_COLORS.length],
        });
      });
    } else {
      const topItems = sortedList.slice(0, topCount);
      const remainingItems = sortedList.slice(topCount);

      topItems.forEach((item, index) => {
        finalData.push({
          ...item,
          color: SLICE_COLORS[index % SLICE_COLORS.length],
        });
      });

      const otherQty = remainingItems.reduce((acc, curr) => acc + curr.quantity, 0);
      const otherRev = remainingItems.reduce((acc, curr) => acc + curr.revenue, 0);
      finalData.push({
        name: "Other Products",
        quantity: otherQty,
        revenue: otherRev,
        value: metric === "quantity" ? otherQty : otherRev,
        color: "#64748B",
      });
    }

    const currentTotalMetric = metric === "quantity" ? sumUnits : sumRev;

    return {
      chartData: finalData,
      totalMetricValue: currentTotalMetric,
      totalUnits: sumUnits,
      totalSalesRevenue: sumRev,
    };
  }, [salesList, productList, reportItemsData, metric]);

  const isLoading = isReportLoading && chartData.length === 0;
  const isEmpty = !isLoading && (chartData.length === 0 || totalMetricValue <= 0);

  return (
    <div className="bg-card border border-border/60 rounded-2xl p-6 shadow-xs flex flex-col justify-between h-full">
      {/* Header with Title and Metric Toggle Switch */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <PieChartIcon className="size-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground tracking-tight">
                Top Products for Sale
              </h2>
              <p className="text-xs text-muted-foreground">
                Distribution by {metric === "quantity" ? "volume sold" : "sales revenue"}
              </p>
            </div>
          </div>
        </div>

        {/* Toggle between By Quantity vs By Revenue */}
        <div className="flex items-center bg-muted/80 p-1 rounded-xl border border-border/50 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setMetric("quantity")}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              metric === "quantity"
                ? "bg-card text-foreground font-semibold shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Package className="size-3" />
            <span>Quantity Sold</span>
          </button>
          <button
            type="button"
            onClick={() => setMetric("revenue")}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              metric === "revenue"
                ? "bg-card text-foreground font-semibold shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <DollarSign className="size-3" />
            <span>Revenue ($)</span>
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <div className="size-8 border-3 border-primary border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-xs font-medium">Loading top products data...</p>
        </div>
      ) : isEmpty ? (
        <div className="flex flex-col items-center justify-center text-center py-16 px-4">
          <div className="size-12 rounded-2xl bg-muted/60 flex items-center justify-center mb-2.5 text-muted-foreground">
            <ShoppingBag className="size-6 opacity-50" />
          </div>
          <h3 className="text-sm font-semibold text-foreground">No Product Sales Data</h3>
          <p className="text-xs text-muted-foreground max-w-xs mt-1">
            Complete customer sales orders with products to see the top selling products chart here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
          {/* Pie Chart with Callout Labels */}
          <div className="md:col-span-7 h-[280px] w-full relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart margin={{ top: 15, right: 25, bottom: 15, left: 25 }}>
                <Tooltip content={<CustomTooltip metric={metric} />} />
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  outerRadius={75}
                  innerRadius={0}
                  dataKey="value"
                  nameKey="name"
                  label={renderCustomizedLabel}
                  labelLine={false}
                  animationDuration={700}
                  animationEasing="ease-out"
                  onMouseEnter={(_, index) => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                >
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.color}
                      stroke="var(--color-card, #ffffff)"
                      strokeWidth={2}
                      className="cursor-pointer transition-opacity duration-200"
                      style={{
                        opacity:
                          hoveredIndex === null || hoveredIndex === index ? 1 : 0.45,
                        filter:
                          hoveredIndex === index
                            ? "drop-shadow(0 4px 8px rgba(0,0,0,0.25))"
                            : "none",
                      }}
                    />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Top Products Leaderboard & Ranking Breakdown */}
          <div className="md:col-span-5 flex flex-col justify-center space-y-2.5">
            <div className="flex items-center justify-between pb-1.5 border-b border-border/60">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <TrendingUp className="size-3 text-primary" />
                Ranked Distribution
              </span>
              <span className="text-xs text-muted-foreground font-medium font-mono">
                {metric === "quantity"
                  ? `${totalUnits.toLocaleString()} total`
                  : `$${totalSalesRevenue.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })} total`}
              </span>
            </div>

            <div className="space-y-2 max-h-[240px] overflow-y-auto pr-1">
              {chartData.map((item, index) => {
                const percent = totalMetricValue > 0 ? (item.value / totalMetricValue) * 100 : 0;
                const isHovered = hoveredIndex === index;

                return (
                  <div
                    key={item.name}
                    onMouseEnter={() => setHoveredIndex(index)}
                    onMouseLeave={() => setHoveredIndex(null)}
                    className={`p-2 rounded-xl border transition-all cursor-pointer ${
                      isHovered
                        ? "bg-muted/80 border-border shadow-xs scale-[1.01]"
                        : "bg-background/60 border-border/40 hover:bg-muted/40"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1.5 mb-1">
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className="size-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="text-xs font-semibold text-foreground truncate max-w-[120px]" title={item.name}>
                          {item.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-xs font-mono font-bold text-foreground">
                          {metric === "quantity"
                            ? `${item.quantity.toLocaleString()} pcs`
                            : `$${item.revenue.toLocaleString("en-US", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}`}
                        </span>
                        <span className="text-[10px] font-mono font-semibold px-1 py-0.2 rounded bg-muted text-foreground">
                          {percent.toFixed(1)}%
                        </span>
                      </div>
                    </div>

                    {/* Progress bar showing share */}
                    <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500 ease-out"
                        style={{
                          width: `${Math.min(100, Math.max(2, percent))}%`,
                          backgroundColor: item.color,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
