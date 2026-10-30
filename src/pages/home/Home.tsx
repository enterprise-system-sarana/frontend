import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipContentProps,
} from "recharts";
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Banknote,
  Boxes,
  CalendarCheck,
  ChartColumn,
  CheckCircle2,
  Clock,
  CreditCard,
  DollarSign,
  ExternalLink,
  Eye,
  FolderOpen,
  Package,
  Plus,
  Receipt,
  Search,
  Settings,
  ShoppingCart,
  TrendingUp,
  UserRound,
  Users,
  Wallet,
  XCircle,
} from "lucide-react";
import TodaySaleModal from "@/pages/sales/sale/components/TodaySaleModal";
import { formatDate } from "@/utils/formatDate";
import { ROUTERS } from "@/constants/Route";
import { PERMISSION } from "@/constants/Permission";
import { usePermission } from "@/utils/UsePermission";
import { AccessDenied } from "@/components/ui/access-denied";
import { useReport } from "@/hooks/reports/useReport";
import { useSale } from "@/hooks/sales/useSale";
import { usePurchase } from "@/hooks/purchases/usePurchase";
import { useProduct } from "@/hooks/product/useProduct";
import { useStock } from "@/hooks/inventory/useStock";
import { useExpense } from "@/hooks/expense/useExpense";
import type { StockResponse } from "@/types/inventory/Stock";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/store/useAuth";
import { KpiCard } from "@/components/ui/kpi-card";

type SalesReportMode = "daily" | "weekly" | "monthly" | "3months" | "6months" | "all";
type DataRow = Record<string, any>;

const rows = (value: unknown): DataRow[] => {
  const response = value as DataRow | undefined;
  const data = response?.payload?.data ?? response?.payload?.content ?? response?.data ?? response?.payload ?? value;
  return Array.isArray(data) ? data : [];
};

const localDate = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

const getPeriod = (mode: SalesReportMode, value: string) => {
  if (mode === "daily") return { startDate: value, endDate: value };
  if (mode === "weekly") {
    const d = new Date(value);
    const day = d.getDay();
    const start = new Date(d);
    start.setDate(d.getDate() - day);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return { startDate: localDate(start), endDate: localDate(end) };
  }
  if (mode === "monthly") {
    const [year, month] = value.split("-").map(Number);
    if (!year || !month) return { startDate: "", endDate: "" };
    return {
      startDate: localDate(new Date(year, month - 1, 1)),
      endDate: localDate(new Date(year, month, 0)),
    };
  }
  if (mode === "3months") {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth() - 2, 1);
    return {
      startDate: localDate(start),
      endDate: localDate(now),
    };
  }
  if (mode === "6months") {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    return {
      startDate: localDate(start),
      endDate: localDate(now),
    };
  }
  return { startDate: "", endDate: "" };
};

const formatCurrency = (value: number | string | undefined) => {
  const numeric = Number(value ?? 0);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(numeric);
};

const formatAxisCurrency = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);

/** Series shown in the Total Sale chart — colour-blind checked theme colours for light and dark. */
const CHART_SERIES = [
  { key: "Sales", labelKey: "dashboard.total_sales", fallback: "Sales", color: "var(--chart-sales)" },
  { key: "Cost", labelKey: "dashboard.total_cost", fallback: "Cost", color: "var(--chart-cost)" },
  { key: "Profit", labelKey: "dashboard.total_profit", fallback: "Profit", color: "var(--chart-profit)" },
  { key: "Expense", labelKey: "dashboard.total_expense", fallback: "Expense", color: "var(--chart-expense)" },
] as const;

const chartTick = { fill: "var(--muted-foreground)", fontSize: 12 };

function ChartTooltip({ active, payload, label }: TooltipContentProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="min-w-[200px] rounded-xl border border-border bg-card px-3.5 py-3 shadow-popover">
      <p className="mb-2 text-[13px] leading-5 font-semibold text-foreground">{label}</p>
      <div className="space-y-1.5">
        {payload.map((item) => {
          const row = item.payload as DataRow | undefined;
          return (
            <div key={String(item.dataKey)} className="flex items-center gap-2 text-[13px] leading-5">
              <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: row?.fill ?? item.color }} />
              <span className="text-muted-foreground">{row?.detail ?? item.name}</span>
              <span className="ml-auto pl-4 font-semibold tabular-nums text-foreground">
                {formatCurrency(Number(item.value))}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** One period's four totals as columns on a track, with the exact amount above each. */
function PeriodBars({ rows }: { rows: { name: string; amount: number; fill: string; detail: string }[] }) {
  const max = Math.max(0, ...rows.map((row) => row.amount));
  return (
    <div className="grid h-full grid-cols-4 gap-3 sm:gap-5">
      {rows.map((row) => {
        const height = max > 0 ? Math.max(0, (row.amount / max) * 100) : 0;
        return (
          <div key={row.name} className="flex min-w-0 flex-col items-center gap-2">
            <p className="max-w-full truncate text-[15px] leading-5 font-semibold tabular-nums text-foreground">
              {formatCurrency(row.amount)}
            </p>
            <div className="flex w-full max-w-[88px] flex-1 items-end overflow-hidden rounded-xl bg-muted">
              <div
                className="w-full rounded-xl transition-[height] duration-500 ease-out"
                style={{ height: `${height}%`, minHeight: row.amount > 0 ? 8 : 0, backgroundColor: row.fill }}
              />
            </div>
            <div className="w-full min-w-0 text-center">
              <p className="truncate text-sm leading-5 font-medium text-foreground" title={row.name}>
                {row.name}
              </p>
              {/* Fixed two-line height so every column's baseline stays level */}
              <p className="line-clamp-2 h-10 text-[13px] leading-5 text-muted-foreground" title={row.detail}>
                {row.detail}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export const HomePage = () => {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const hour = new Date().getHours();
  const greeting = hour < 12
    ? t("dashboard.good_morning", "Good morning")
    : hour < 18
      ? t("dashboard.good_afternoon", "Good afternoon")
      : t("dashboard.good_evening", "Good evening");
  const navigate = useNavigate();
  const { Can } = usePermission();
  const canRead = Can(PERMISSION.REPORT.READ);

  if (!canRead) {
    return <AccessDenied resource="reports" showBackButton />;
  }

  const [activeTab, setActiveTab] = useState<SalesReportMode>("daily");
  const [hoveredBar, setHoveredBar] = useState<number | null>(null);
  const [hiddenSeries, setHiddenSeries] = useState<string[]>([]);
  const [isTodaySaleOpen, setIsTodaySaleOpen] = useState(false);
  const [stockFilter, setStockFilter] = useState<"all" | "low" | "out">("all");
  const [stockSearch, setStockSearch] = useState("");
  const now = useMemo(() => new Date(), []);
  const todayDateStr = useMemo(() => localDate(new Date()), []);

  const isSameDate = (rawDate: any, targetDate: string) => {
    if (!rawDate) return false;
    const s = String(rawDate).trim();
    if (s.startsWith(targetDate)) return true;
    const d = new Date(s);
    return !Number.isNaN(d.getTime()) && localDate(d) === targetDate;
  };

  // Fetch report data based on active tab
  const reportFilter = useMemo(() => {
    if (activeTab === "all") return undefined;
    const today = new Date();
    const period = getPeriod(
      activeTab,
      activeTab === "monthly" ? localDate(today).slice(0, 7) : localDate(today)
    );
    return {
      startDate: period.startDate || undefined,
      endDate: period.endDate || undefined,
    };
  }, [activeTab]);

  const { data: saleReportData, isLoading: saleReportLoading } = useReport.useSalesReport(reportFilter);
  const { data: expenseReportData, isLoading: expenseReportLoading } = useReport.useExpenseReport(reportFilter);

  // Data fetching for inventory, products, sales, expenses for charts
  const { data: salesData } = useSale.GetAll({ page: 1, size: 1000 });
  const { data: productsData, isLoading: productsLoading } = useProduct.useGetAllProduct({ page: 1, size: 1000 });
  const { data: stocksData, isLoading: stocksLoading } = useStock.useGetAllStock({ page: 1, size: 1000 });
  const { data: expensesData } = useExpense.useGetAllExpense({ page: 1, size: 1000 });

  const summary = (saleReportData as any)?.payload ?? saleReportData ?? {};
  const sales = useMemo(() => rows(salesData), [salesData]);
  const products = useMemo(() => rows(productsData), [productsData]);
  const stocks = useMemo(() => rows(stocksData) as StockResponse[], [stocksData]);
  const expenses = useMemo(() => rows(expensesData), [expensesData]);

  const productCosts = useMemo(
    () => new Map(products.map((product) => [Number(product.id), Number(product.costPrice) || 0])),
    [products]
  );

  // Client-side fallback metrics for Today / Weekly / Monthly in case backend report returns 0 or null
  const clientPeriodMetrics = useMemo(() => {
    if (summary.totalSalesAmount != null && Number(summary.totalSalesAmount) > 0) {
      return null;
    }
    const todayStr = todayDateStr;

    let filteredSales = sales;
    let filteredExpenses = expenses;

    if (activeTab === "daily") {
      filteredSales = sales.filter((s) =>
        isSameDate(s.saleDate ?? s.createdAt ?? s.date, todayStr)
      );
      filteredExpenses = expenses.filter((e) =>
        isSameDate(e.createdAt ?? e.date ?? e.expenseDate, todayStr)
      );
    } else if (activeTab === "weekly") {
      const period = getPeriod("weekly", todayStr);
      filteredSales = sales.filter((s) => {
        const val = s.saleDate ?? s.createdAt ?? s.date;
        if (!val) return false;
        const d = localDate(new Date(String(val)));
        return d >= period.startDate && d <= period.endDate;
      });
      filteredExpenses = expenses.filter((e) => {
        const val = e.createdAt ?? e.date ?? e.expenseDate;
        if (!val) return false;
        const d = localDate(new Date(String(val)));
        return d >= period.startDate && d <= period.endDate;
      });
    } else if (activeTab === "monthly") {
      const period = getPeriod("monthly", todayStr.slice(0, 7));
      filteredSales = sales.filter((s) => {
        const val = s.saleDate ?? s.createdAt ?? s.date;
        if (!val) return false;
        const d = localDate(new Date(String(val)));
        return d >= period.startDate && d <= period.endDate;
      });
      filteredExpenses = expenses.filter((e) => {
        const val = e.createdAt ?? e.date ?? e.expenseDate;
        if (!val) return false;
        const d = localDate(new Date(String(val)));
        return d >= period.startDate && d <= period.endDate;
      });
    }

    const salesTotal = filteredSales.reduce(
      (sum, s) => sum + (Number(s.grandTotal ?? s.totalAmount ?? s.total) || 0),
      0
    );
    const costTotal = filteredSales.reduce((sum, s) => {
      if (!Array.isArray(s.items)) return sum;
      return (
        sum +
        s.items.reduce(
          (itemSum: number, item: any) =>
            itemSum +
            (Number(item.quantity) || 0) *
            (productCosts.get(Number(item.productId)) ?? (Number(item.costPrice) || 0)),
          0
        )
      );
    }, 0);
    const profitTotal = salesTotal - costTotal;
    const expenseTotal = filteredExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

    return {
      salesTotal,
      costTotal,
      profitTotal,
      expenseTotal,
      txCount: filteredSales.length,
    };
  }, [summary.totalSalesAmount, sales, expenses, activeTab, productCosts, todayDateStr]);

  const totalExpense = useMemo(() => {
    if (summary.totalExpense != null && Number(summary.totalExpense) > 0) return Number(summary.totalExpense);
    const payload = (expenseReportData as any)?.payload ?? expenseReportData;
    let list: any[] = [];
    if (Array.isArray(payload)) list = payload;
    else if (Array.isArray(payload?.data)) list = payload.data;
    else if (Array.isArray(payload?.content)) list = payload.content;
    else if (Array.isArray(payload?.expenses)) list = payload.expenses;
    else if (Array.isArray(payload?.items)) list = payload.items;
    const apiExpense = list.reduce((sum: number, item: any) => sum + (Number(item?.amount) || 0), 0);
    if (apiExpense > 0) return apiExpense;
    return clientPeriodMetrics?.expenseTotal ?? 0;
  }, [summary.totalExpense, expenseReportData, clientPeriodMetrics]);

  const hasSummarySales = summary.totalSalesAmount != null && Number(summary.totalSalesAmount) > 0;
  const totalSales = Number(
    hasSummarySales
      ? summary.totalSalesAmount
      : (clientPeriodMetrics?.salesTotal ?? summary.totalSalesAmount ?? 0)
  );
  const totalProfit = Number(
    summary.totalProfit != null && Number(summary.totalProfit) !== 0
      ? summary.totalProfit
      : (clientPeriodMetrics?.profitTotal ?? summary.totalProfit ?? 0)
  );
  const totalCost = Number(
    summary.totalCost != null && Number(summary.totalCost) > 0
      ? summary.totalCost
      : (clientPeriodMetrics?.costTotal != null
          ? clientPeriodMetrics.costTotal
          : Math.max(0, totalSales - totalProfit))
  );
  const totalTransactions = Number(
    summary.totalTransactions != null && Number(summary.totalTransactions) > 0
      ? summary.totalTransactions
      : (clientPeriodMetrics?.txCount ?? summary.totalTransactions ?? 0)
  );
  const profitMargin = totalSales > 0 ? ((totalProfit / totalSales) * 100).toFixed(1) : "0.0";
  const costRatio = totalSales > 0 ? ((totalCost / totalSales) * 100).toFixed(1) : "0.0";
  const expenseRatio = totalSales > 0 ? ((totalExpense / totalSales) * 100).toFixed(1) : "0.0";
  const netIncome = totalProfit - totalExpense;
  const netIncomeMargin = totalSales > 0 ? ((netIncome / totalSales) * 100).toFixed(1) : "0.0";

  // Today's Sales registry and metrics
  const todaySales = useMemo(() => {
    return (sales as SaleResponse[]).filter((s) =>
      isSameDate(s.saleDate ?? s.createdAt ?? s.date, todayDateStr)
    );
  }, [sales, todayDateStr]);

  const todaySalesList: SaleResponse[] = useMemo(() => {
    const reportSales = Array.isArray(summary.sales) && summary.sales.length > 0 ? (summary.sales as SaleResponse[]) : [];
    if (activeTab === "daily" && reportSales.length > 0) {
      return reportSales;
    }
    return todaySales;
  }, [summary.sales, activeTab, todaySales]);

  const todayMetrics = useMemo(() => {
    let revenue = 0;
    let cash = 0;
    let bank = 0;
    let due = 0;
    let totalItems = 0;

    todaySalesList.forEach((s) => {
      const gTotal = Number(s.grandTotal ?? s.totalAmount ?? (s as any).total ?? 0);
      const paid = Number(s.paidAmount ?? 0);
      const remaining = Number(s.dueAmount ?? Math.max(0, gTotal - paid));
      revenue += gTotal;
      due += remaining;

      if (s.bankId || s.bankName) {
        bank += paid;
      } else {
        cash += paid;
      }

      if (Array.isArray(s.items)) {
        totalItems += s.items.reduce((sum: number, it: any) => sum + (Number(it.quantity) || 0), 0);
      } else {
        totalItems += 1;
      }
    });

    return {
      revenue,
      cash,
      bank,
      due,
      count: todaySalesList.length,
      totalItems,
    };
  }, [todaySalesList]);

  // 4 KPIs in 1 Graph: Monthly trend over last 6 months
  const monthlyChartData = useMemo(() => {
    const firstMonth = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    const months = Array.from({ length: 6 }, (_, index) => {
      const date = new Date(firstMonth.getFullYear(), firstMonth.getMonth() + index, 1);
      return {
        month: date.toLocaleDateString("en-US", { month: "short" }),
        monthKey: `${date.getFullYear()}-${date.getMonth()}`,
        Sales: 0,
        Cost: 0,
        Profit: 0,
        Expense: 0,
      };
    });

    const monthMap = new Map(months.map((m) => [m.monthKey, m]));

    for (const sale of sales) {
      const val = sale.saleDate ?? sale.createdAt ?? sale.date;
      if (!val) continue;
      const d = new Date(String(val));
      if (Number.isNaN(d.getTime())) continue;
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      const target = monthMap.get(key);
      if (target) {
        const saleAmount = Number(sale.grandTotal ?? sale.totalAmount ?? sale.total) || 0;
        const saleCost = Array.isArray(sale.items)
          ? sale.items.reduce(
            (sum: number, item: any) =>
              sum +
              (Number(item.quantity) || 0) *
              (productCosts.get(Number(item.productId)) ?? (Number(item.costPrice) || 0)),
            0
          )
          : 0;
        target.Sales += saleAmount;
        target.Cost += saleCost;
        target.Profit += Math.max(0, saleAmount - saleCost);
      }
    }

    for (const exp of expenses) {
      const val = exp.createdAt ?? exp.date ?? exp.expenseDate;
      if (!val) continue;
      const d = new Date(String(val));
      if (Number.isNaN(d.getTime())) continue;
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      const target = monthMap.get(key);
      if (target) {
        target.Expense += Number(exp.amount) || 0;
      }
    }

    return months;
  }, [sales, expenses, productCosts, now]);

  // Weekly chart data: 7 days of the current week (Sun - Sat)
  const weeklyChartData = useMemo(() => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - dayOfWeek);
    startOfWeek.setHours(0, 0, 0, 0);

    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((dayName, idx) => {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + idx);
      return {
        label: `${dayName} (${d.getDate()})`,
        dateKey: localDate(d),
        Sales: 0,
        Cost: 0,
        Profit: 0,
        Expense: 0,
      };
    });

    const dayMap = new Map(days.map((d) => [d.dateKey, d]));

    for (const sale of sales) {
      const val = sale.saleDate ?? sale.createdAt ?? sale.date;
      if (!val) continue;
      const d = new Date(String(val));
      if (Number.isNaN(d.getTime())) continue;
      const target = dayMap.get(localDate(d));
      if (target) {
        const saleAmount = Number(sale.grandTotal ?? sale.totalAmount ?? sale.total) || 0;
        const saleCost = Array.isArray(sale.items)
          ? sale.items.reduce(
            (sum: number, item: any) =>
              sum +
              (Number(item.quantity) || 0) *
              (productCosts.get(Number(item.productId)) ?? (Number(item.costPrice) || 0)),
            0
          )
          : 0;
        target.Sales += saleAmount;
        target.Cost += saleCost;
        target.Profit += Math.max(0, saleAmount - saleCost);
      }
    }

    for (const exp of expenses) {
      const val = exp.createdAt ?? exp.date ?? exp.expenseDate;
      if (!val) continue;
      const d = new Date(String(val));
      if (Number.isNaN(d.getTime())) continue;
      const target = dayMap.get(localDate(d));
      if (target) {
        target.Expense += Number(exp.amount) || 0;
      }
    }

    return days;
  }, [sales, expenses, productCosts]);

  // Monthly chart data: weeks of current month
  const monthlyWeeksChartData = useMemo(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const weeks = [
      { label: "W1 (1-7)", start: 1, end: 7, Sales: 0, Cost: 0, Profit: 0, Expense: 0 },
      { label: "W2 (8-14)", start: 8, end: 14, Sales: 0, Cost: 0, Profit: 0, Expense: 0 },
      { label: "W3 (15-21)", start: 15, end: 21, Sales: 0, Cost: 0, Profit: 0, Expense: 0 },
      { label: `W4 (22-${daysInMonth})`, start: 22, end: daysInMonth, Sales: 0, Cost: 0, Profit: 0, Expense: 0 },
    ];

    for (const sale of sales) {
      const val = sale.saleDate ?? sale.createdAt ?? sale.date;
      if (!val) continue;
      const d = new Date(String(val));
      if (Number.isNaN(d.getTime())) continue;
      if (d.getFullYear() !== year || d.getMonth() !== month) continue;
      const day = d.getDate();
      const target = weeks.find((w) => day >= w.start && day <= w.end);
      if (target) {
        const saleAmount = Number(sale.grandTotal ?? sale.totalAmount ?? sale.total) || 0;
        const saleCost = Array.isArray(sale.items)
          ? sale.items.reduce(
            (sum: number, item: any) =>
              sum +
              (Number(item.quantity) || 0) *
              (productCosts.get(Number(item.productId)) ?? (Number(item.costPrice) || 0)),
            0
          )
          : 0;
        target.Sales += saleAmount;
        target.Cost += saleCost;
        target.Profit += Math.max(0, saleAmount - saleCost);
      }
    }

    for (const exp of expenses) {
      const val = exp.createdAt ?? exp.date ?? exp.expenseDate;
      if (!val) continue;
      const d = new Date(String(val));
      if (Number.isNaN(d.getTime())) continue;
      if (d.getFullYear() !== year || d.getMonth() !== month) continue;
      const day = d.getDate();
      const target = weeks.find((w) => day >= w.start && day <= w.end);
      if (target) {
        target.Expense += Number(exp.amount) || 0;
      }
    }

    return weeks;
  }, [sales, expenses, productCosts]);

  // Current period direct comparison data
  const periodComparisonData = useMemo(() => {
    const ofTotal = t("dashboard.of_sales", "of total sales");
    const amounts = { Sales: totalSales, Cost: totalCost, Profit: totalProfit, Expense: totalExpense };
    const details = {
      Sales: `${totalTransactions} ${t("dashboard.transactions", "transactions")}`,
      Cost: `${costRatio}% ${ofTotal}`,
      Profit: `${profitMargin}% ${t("dashboard.profit_margin", "profit margin")}`,
      Expense: `${expenseRatio}% ${ofTotal}`,
    };
    return CHART_SERIES.map((series) => ({
      name: t(series.labelKey, series.fallback),
      amount: amounts[series.key],
      fill: series.color,
      detail: details[series.key],
    }));
  }, [t, totalSales, totalCost, totalProfit, totalExpense, totalTransactions, costRatio, profitMargin, expenseRatio]);

  const trendChartData: DataRow[] =
    activeTab === "weekly" ? weeklyChartData : activeTab === "monthly" ? monthlyWeeksChartData : monthlyChartData;
  const hasTrendData = trendChartData.some((row) => CHART_SERIES.some((series) => Number(row[series.key]) > 0));
  const toggleSeries = (key: string) =>
    setHiddenSeries((current) => (current.includes(key) ? current.filter((item) => item !== key) : [...current, key]));
  const barOpacity = (index: number) => (hoveredBar === null || hoveredBar === index ? 1 : 0.35);
  const handleChartHover = ({ activeTooltipIndex }: { activeTooltipIndex?: number | string | null }) =>
    setHoveredBar(activeTooltipIndex === undefined || activeTooltipIndex === null ? null : Number(activeTooltipIndex));

  const chartSubtitle = useMemo(() => {
    if (activeTab === "daily") return `Today's performance metrics (${localDate(new Date())})`;
    if (activeTab === "weekly") return "7-day daily breakdown for current week";
    if (activeTab === "monthly") return "Weekly breakdown for current month";
    return "Comparing all 4 KPIs (Sales, Cost, Profit, Expense) across last 6 months";
  }, [activeTab]);

  // Inventory & Stock computation
  const stockByProduct = useMemo(() => {
    const items = new Map<
      number,
      {
        id: number;
        name: string;
        quantity: number;
        stores: Set<string>;
        lowStock: boolean;
      }
    >();
    for (const product of products) {
      const id = Number(product.id);
      if (!Number.isFinite(id)) continue;
      items.set(id, {
        id,
        name: product.name || `Product #${id}`,
        quantity: 0,
        stores: new Set<string>(),
        lowStock: false,
      });
    }
    for (const stock of stocks) {
      const id = Number(stock.productId);
      if (!Number.isFinite(id)) continue;
      const item = items.get(id) ?? {
        id,
        name: stock.productName || `Product #${id}`,
        quantity: 0,
        stores: new Set<string>(),
        lowStock: false,
      };
      const quantity = Number(stock.quantity) || 0;
      item.quantity += quantity;
      item.lowStock ||= quantity <= Number(stock.alertQuantity ?? stock.reorderLevel ?? 0);
      if (stock.storeName) item.stores.add(stock.storeName);
      items.set(id, item);
    }
    return [...items.values()].sort((a, b) => a.quantity - b.quantity || a.name.localeCompare(b.name));
  }, [products, stocks]);

  const inStockCount = stockByProduct.filter((product) => product.quantity > 0).length;
  const outOfStockCount = stockByProduct.length - inStockCount;
  const lowStockCount = stockByProduct.filter((product) => product.lowStock && product.quantity > 0).length;
  const totalStockQuantity = stockByProduct.reduce((sum, item) => sum + item.quantity, 0);

  // Filtered stock list based on filter tab and search query
  const filteredStock = useMemo(() => {
    return stockByProduct.filter((p) => {
      const matchesSearch = p.name.toLowerCase().includes(stockSearch.toLowerCase());
      if (!matchesSearch) return false;
      if (stockFilter === "low") return p.lowStock && p.quantity > 0;
      if (stockFilter === "out") return p.quantity <= 0;
      return true;
    });
  }, [stockByProduct, stockFilter, stockSearch]);

  const tabs = [
    { label: t("dashboard.today", "Today"), route: ROUTERS.REPORT_DAILY_SALES, value: "daily" as const },
    { label: t("dashboard.this_week", "Weekly"), route: ROUTERS.REPORT_WEEKLY_SALES, value: "weekly" as const },
    { label: t("dashboard.this_month", "Monthly"), route: ROUTERS.REPORT_MONTHLY_SALES, value: "monthly" as const },
    { label: t("dashboard.three_months", "3 Months"), route: ROUTERS.REPORT_SALES, value: "3months" as const },
    { label: t("dashboard.six_months", "6 Months"), route: ROUTERS.REPORT_SALES, value: "6months" as const },
    { label: t("dashboard.all_time", "All Sales"), route: ROUTERS.REPORT_SALES, value: "all" as const },
  ];

  const isKpiLoading = saleReportLoading || expenseReportLoading;
  const kpiValue = (value: number) => (isKpiLoading ? "..." : formatCurrency(value));
  const ofSales = t("dashboard.of_sales", "of total sales");

  const links = [
    { label: t("pos.today_sale", "Today's Sale"), icon: CalendarCheck, onClick: () => setIsTodaySaleOpen(true) },
    { label: t("nav.pos", "POS Terminal"), icon: ShoppingCart, onClick: () => window.open(ROUTERS.SALE_CREATE, "_blank") },
    { label: t("nav.products", "Products"), icon: Boxes, route: ROUTERS.PRODUCT },
    { label: t("nav.sales", "Sales"), icon: ShoppingCart, route: ROUTERS.SALE },
    { label: t("nav.category", "Categories"), icon: FolderOpen, route: ROUTERS.CATEGORY },
    { label: t("nav.customer", "Customers"), icon: Users, route: ROUTERS.CUSTOMER },
    { label: t("nav.settings", "Catalog Setup"), icon: Settings, route: ROUTERS.CATEGORY },
    { label: t("report.title", "Reports"), icon: ChartColumn, route: ROUTERS.REPORT_SALES },
    { label: t("nav.user", "Users"), icon: UserRound, route: ROUTERS.USER },
  ];

  return (
    <main className="space-y-4 reference-dashboard">
      {/* Page header — Figma "Good morning, Sophea" */}
      <div className="flex flex-col gap-1.5 pb-1">
        <h1 className="reference-dashboard-title">
          {greeting}, <span>{user?.firstName || user?.username || ""}</span>
        </h1>
        <p className="text-sm leading-[22px] text-muted-foreground">
          {t("dashboard.subtitle", "Sales, stock, purchases and expenses across your shop at a glance.")}
        </p>
      </div>
      {/* KPI row — Figma "KPI" cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          featured
          icon={DollarSign}
          title={t("dashboard.total_sales", "Total Sales")}
          value={kpiValue(totalSales)}
          caption={`${totalTransactions} ${t("dashboard.transactions", "transactions")}`}
          splits={[
            { label: t("dashboard.total_cost", "Cost"), value: totalCost, color: "#fbbf24" },
            { label: t("dashboard.total_profit", "Profit"), value: Math.max(0, totalProfit), color: "#4ade80" },
            { label: t("dashboard.total_expense", "Expense"), value: totalExpense, color: "#fb7185" },
          ]}
        />
        <KpiCard
          tone="amber"
          icon={Package}
          title={t("dashboard.total_cost", "Total Cost")}
          subtitle={t("dashboard.cost_of_goods", "Cost of goods sold")}
          value={kpiValue(totalCost)}
          caption={ofSales}
          percent={Number(costRatio)}
        />
        <KpiCard
          tone="green"
          icon={TrendingUp}
          title={t("dashboard.total_profit", "Total Profit")}
          subtitle={t("dashboard.gross_profit", "Gross profit (Sales - Cost)")}
          value={kpiValue(totalProfit)}
          caption={t("dashboard.profit_margin", "profit margin")}
          percent={Number(profitMargin)}
        />
        <KpiCard
          tone="red"
          icon={Wallet}
          title={t("dashboard.total_expense", "Total Expense")}
          subtitle={t("dashboard.operating_expenses", "Operating & store expenses")}
          value={kpiValue(totalExpense)}
          caption={ofSales}
          percent={Number(expenseRatio)}
        />
      </div>

      {/* Visual Revenue Breakdown & Net Income Summary (At a Glance) */}
      {/* Quick Links */}
      <section className="reference-panel reference-quick-links">
        <div className="reference-panel-head">
          <h2>{t("dashboard.quick_links", "Quick Links")}</h2>
          {/* <span>SHORTCUTS</span> */}
        </div>
        <div className="reference-link-list">
          {links.map(({ label, icon: Icon, route, onClick }: any) => (
            <button
              type="button"
              key={label}
              onClick={() => {
                if (onClick) onClick();
                else if (route) navigate(route);
              }}
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
        </div>
      </section>

      {/* Middle Section: 4 KPIs in 1 Graph & Stock Overview */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* 4 KPIs in 1 Graph (Sales, Cost, Profit, Expense) */}
        <div className="lg:col-span-6 rounded-2xl border border-border bg-card p-5 shadow-card space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h3 className="whitespace-nowrap text-base leading-6 font-semibold text-foreground">
                {t("dashboard.total_sales", "Total Sales")}
              </h3>
              {/* <p className="text-xs text-muted-foreground">
                {chartSubtitle}
              </p> */}
            </div>

            {/* Tab Navigation directly in chart header */}
            <div className="flex w-fit flex-wrap items-center gap-0.5 rounded-lg bg-muted p-1">
              {tabs.map((tab) => {
                const isActive = activeTab === tab.value;
                return (
                  <button
                    key={tab.value}
                    type="button"
                    aria-pressed={isActive}
                    onClick={() => setActiveTab(tab.value)}
                    className={`
                      inline-flex h-8 items-center rounded-md px-3 text-[14px] font-medium transition-colors duration-150 cursor-pointer
                      ${isActive
                        ? "bg-card text-primary shadow-2xs"
                        : "text-muted-foreground hover:text-foreground"
                      }
                    `}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          {activeTab === "daily" ? (
            <p className="text-[13px] leading-6 text-muted-foreground">
              {now.toLocaleDateString(language === "km" ? "km-KH" : "en-US", { dateStyle: "long" })}
            </p>
          ) : (
            /* Legend — click a series to hide or show it */
            <div className="-ml-2 flex flex-wrap items-center gap-x-1 gap-y-1">
              {CHART_SERIES.map((series) => {
                const isHidden = hiddenSeries.includes(series.key);
                return (
                  <button
                    key={series.key}
                    type="button"
                    aria-pressed={!isHidden}
                    onClick={() => toggleSeries(series.key)}
                    className={`flex h-6 cursor-pointer items-center gap-2 rounded-md px-2 text-[13px] leading-5 transition-colors hover:bg-muted ${isHidden ? "text-text-disabled" : "text-muted-foreground"}`}
                  >
                    <span
                      className="size-2.5 rounded-[3px] border"
                      style={{ backgroundColor: isHidden ? "transparent" : series.color, borderColor: isHidden ? "var(--border-strong)" : series.color }}
                    />
                    {t(series.labelKey, series.fallback)}
                  </button>
                );
              })}
            </div>
          )}

          <div className="relative h-[280px] w-full">
            {activeTab === "daily" ? (
              <PeriodBars rows={periodComparisonData} />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={trendChartData}
                  margin={{ top: 8, right: 4, left: 0, bottom: 0 }}
                  barGap={2}
                  barCategoryGap="24%"
                  onMouseMove={handleChartHover}
                  onMouseLeave={() => setHoveredBar(null)}
                >
                  <XAxis
                    dataKey={activeTab === "weekly" || activeTab === "monthly" ? "label" : "month"}
                    tickLine={false}
                    axisLine={false}
                    tickMargin={10}
                    tick={chartTick}
                  />
                  <YAxis
                    width={52}
                    tickLine={false}
                    axisLine={false}
                    tickMargin={6}
                    tickCount={5}
                    tick={chartTick}
                    tickFormatter={formatAxisCurrency}
                  />
                  <Tooltip content={ChartTooltip} cursor={false} />
                  {CHART_SERIES.filter((series) => !hiddenSeries.includes(series.key)).map((series) => (
                    <Bar
                      key={series.key}
                      dataKey={series.key}
                      name={t(series.labelKey, series.fallback)}
                      fill={series.color}
                      radius={6}
                      background={{ fill: "var(--muted)", radius: 6 }}
                      maxBarSize={18}
                      animationDuration={500}
                    >
                      {trendChartData.map((_, index) => (
                        <Cell key={index} fillOpacity={barOpacity(index)} />
                      ))}
                    </Bar>
                  ))}
                </BarChart>
              </ResponsiveContainer>
            )}
            {activeTab !== "daily" && !hasTrendData && (
              <p className="pointer-events-none absolute inset-0 flex items-center justify-center pb-8 text-sm text-muted-foreground">
                {t("dashboard.no_sales_period", "No sales in this period")}
              </p>
            )}
          </div>
        </div>

        {/* Stock & Inventory Overview: Easy to Look & Search */}
        <div className="lg:col-span-6 rounded-2xl border border-border bg-card p-5 shadow-card space-y-3.5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base leading-6 font-semibold text-foreground">
                  {t("dashboard.inventory_status", "Inventory & Stock")}
                </h2>
                <p className="text-xs text-muted-foreground">
                  {t("inventory.stock", "Current stock levels across all stores")}
                </p>
              </div>
              <button
                type="button"
                onClick={() => navigate(ROUTERS.STOCK)}
                className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
              >
                <span>{t("common.view", "Manage")}</span>
                <ArrowRight className="size-3" />
              </button>
            </div>

            {/* Quick Status Filter Tabs */}
            <div className="grid grid-cols-3 gap-2 my-3">
              <button
                type="button"
                onClick={() => setStockFilter(stockFilter === "all" ? "all" : "all")}
                className={`rounded-lg border p-2 text-center transition-all ${stockFilter === "all"
                  ? "border-primary/50 bg-primary/5 shadow-xs"
                  : "border-border/50 bg-muted/20 hover:bg-muted/40"
                  }`}
              >
                <span className="text-[12px] font-medium text-muted-foreground block">
                  {t("common.all", "Total Items")}
                </span>
                <span className="text-lg font-black text-foreground">
                  {stockByProduct.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setStockFilter(stockFilter === "low" ? "all" : "low")}
                className={`rounded-lg border p-2 text-center transition-all ${stockFilter === "low"
                  ? "border-warning/30 bg-warning/10 shadow-xs ring-1 ring-warning/30"
                  : "border-border/50 bg-muted/20 hover:bg-muted/40"
                  }`}
              >
                <div className="flex items-center justify-center gap-1 text-[12px] font-medium text-warning-text">
                  <AlertTriangle className="size-3" />
                  <span>{t("pos.low_stock", "Low")}</span>
                </div>
                <span className="text-lg font-black text-warning-text">
                  {lowStockCount}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setStockFilter(stockFilter === "out" ? "all" : "out")}
                className={`rounded-lg border p-2 text-center transition-all ${stockFilter === "out"
                  ? "border-destructive/30 bg-destructive/10 shadow-xs ring-1 ring-destructive/30"
                  : "border-border/50 bg-muted/20 hover:bg-muted/40"
                  }`}
              >
                <div className="flex items-center justify-center gap-1 text-[12px] font-medium text-destructive">
                  <XCircle className="size-3" />
                  <span>{t("pos.out_of_stock", "Out")}</span>
                </div>
                <span className="text-lg font-black text-destructive">
                  {outOfStockCount}
                </span>
              </button>
            </div>

            {/* Quick Search */}
            <div className="relative mb-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <input
                type="text"
                placeholder={t("pos.search_placeholder", "Search product stock...")}
                value={stockSearch}
                onChange={(e) => setStockSearch(e.target.value)}
                className="h-10 w-full pl-9 pr-3 text-sm rounded-lg border border-border bg-card shadow-2xs placeholder:text-text-disabled outline-none focus:ring-3 focus:ring-primary/15 focus:border-primary"
              />
            </div>

            {/* Product Stock List */}
            <div className="space-y-1.5 max-h-[170px] overflow-y-auto pr-1">
              {stocksLoading || productsLoading ? (
                <div className="py-8 text-center text-xs text-muted-foreground">
                  {t("common.loading", "Loading stock quantities...")}
                </div>
              ) : filteredStock.length === 0 ? (
                <div className="py-8 text-center text-xs text-muted-foreground">
                  {t("common.no_results", "No products found")}
                </div>
              ) : (
                filteredStock.slice(0, 6).map((product) => {
                  const isOut = product.quantity <= 0;
                  const isLow = product.lowStock && !isOut;
                  return (
                    <div
                      key={product.id}
                      className="flex items-center justify-between px-1 py-2.5 border-b border-border-subtle last:border-b-0 hover:bg-accent/60 transition-colors text-[14px]"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Package className="size-3.5 text-muted-foreground shrink-0" />
                        <span className="font-medium text-foreground truncate max-w-[130px]">
                          {product.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="font-bold text-foreground">
                          {product.quantity.toLocaleString()}
                        </span>
                        <span
                          className={`px-1.5 py-0.5 rounded text-[11px] font-bold ${isOut
                            ? "bg-destructive/10 text-destructive border border-destructive/20"
                            : isLow
                              ? "bg-warning/10 text-warning-text border border-warning/20"
                              : "bg-success/10 text-success border border-success/20"
                            }`}
                        >
                          {isOut ? t("pos.out_of_stock", "Out") : isLow ? t("pos.low_stock", "Low") : t("pos.in_stock", "In stock")}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Footer of Stock card */}
          <div className="pt-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {t("common.total", "Total Units")}:{" "}
              <strong className="text-foreground">
                {totalStockQuantity.toLocaleString()}
              </strong>
            </span>
            <span className="flex items-center gap-1 text-[12px] text-success font-semibold">
              <CheckCircle2 className="size-3" />
              {inStockCount} {t("pos.in_stock", "active in stock")}
            </span>
          </div>
        </div>
      </div>

      {/* Today's Sales Live Registry Section */}
      {/* Today's Sale Register / Shift Modal */}
      {/* <TodaySaleModal
        open={isTodaySaleOpen}
        onOpenChange={setIsTodaySaleOpen}
      /> */}
    </main >
  );
};

export default HomePage;
