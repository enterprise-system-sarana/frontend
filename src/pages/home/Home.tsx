import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Banknote,
  Boxes,
  Calendar,
  CalendarCheck,
  CalendarDays,
  CalendarRange,
  ChartColumn,
  CheckCircle2,
  Clock,
  CreditCard,
  DollarSign,
  ExternalLink,
  Eye,
  FolderOpen,
  LayoutList,
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

export const HomePage = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { Can } = usePermission();
  const canRead = Can(PERMISSION.REPORT.READ);

  if (!canRead) {
    return <AccessDenied resource="reports" showBackButton />;
  }

  const [activeTab, setActiveTab] = useState<SalesReportMode>("daily");
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
  const periodComparisonData = useMemo(
    () => [
      { name: "Sales", amount: totalSales, fill: "#3b82f6", detail: `${totalTransactions} txns` },
      { name: "Cost", amount: totalCost, fill: "#f59e0b", detail: `${costRatio}% of sales` },
      { name: "Profit", amount: totalProfit, fill: "#10b981", detail: `${profitMargin}% margin` },
      { name: "Expense", amount: totalExpense, fill: "#f43f5e", detail: `${expenseRatio}% of sales` },
    ],
    [totalSales, totalCost, totalProfit, totalExpense, totalTransactions, costRatio, profitMargin, expenseRatio]
  );

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
    { label: t("dashboard.today", "Today"), route: ROUTERS.REPORT_DAILY_SALES, value: "daily" as const, icon: Calendar },
    { label: t("dashboard.this_week", "Weekly"), route: ROUTERS.REPORT_WEEKLY_SALES, value: "weekly" as const, icon: CalendarRange },
    { label: t("dashboard.this_month", "Monthly"), route: ROUTERS.REPORT_MONTHLY_SALES, value: "monthly" as const, icon: CalendarDays },
    { label: t("dashboard.three_months", "3 Months"), route: ROUTERS.REPORT_SALES, value: "3months" as const, icon: CalendarCheck },
    { label: t("dashboard.six_months", "6 Months"), route: ROUTERS.REPORT_SALES, value: "6months" as const, icon: CalendarCheck },
    { label: t("dashboard.all_time", "All Sales"), route: ROUTERS.REPORT_SALES, value: "all" as const, icon: LayoutList },
  ];

  const kpiCards = [
    {
      label: t("dashboard.total_sales", "Total Sales"),
      value: formatCurrency(totalSales),
      // badge: `${totalTransactions} ${t("pos.summary_items", "sales")}`,
      badgeColor: "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800",
      // detail: t("sale.title", "Gross revenue generated"),
      icon: DollarSign,
      iconBg: "bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400",
      accent: "border-l-blue-500",
      cardBorder: "hover:border-blue-500/40",
      indicatorColor: "bg-blue-500",
      // ratio: "100%",
    },
    {
      label: t("dashboard.total_cost", "Total Cost"),
      value: formatCurrency(totalCost),
      // badge: `${costRatio}% of sales`,
      badgeColor: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800",
      // detail: t("dashboard.cost_of_goods", "Cost of goods sold"),
      icon: Package,
      iconBg: "bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400",
      accent: "border-l-amber-500",
      cardBorder: "hover:border-amber-500/40",
      indicatorColor: "bg-amber-500",
      // ratio: `${costRatio}%`,
    },
    {
      label: t("dashboard.total_profit", "Total Profit"),
      value: formatCurrency(totalProfit),
      // badge: `${profitMargin}% margin`,
      badgeColor: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
      // detail: t("dashboard.gross_profit", "Gross profit (Sales - Cost)"),
      icon: TrendingUp,
      iconBg: "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400",
      accent: "border-l-emerald-500",
      cardBorder: "hover:border-emerald-500/40",
      indicatorColor: "bg-emerald-500",
      // trend: totalProfit >= 0 ? ("up" as const) : ("down" as const),
      // ratio: `${profitMargin}%`,
    },
    {
      label: t("dashboard.total_expense", "Total Expense"),
      value: formatCurrency(totalExpense),
      // badge: `${expenseRatio}% of sales`,
      badgeColor: "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800",
      // detail: t("dashboard.operating_expenses", "Operating & store expenses"),
      icon: Wallet,
      iconBg: "bg-rose-500/10 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400",
      accent: "border-l-rose-500",
      cardBorder: "hover:border-rose-500/40",
      indicatorColor: "bg-rose-500",
      // ratio: `${expenseRatio}%`,
    },
  ];

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
    <main className="space-y-6 reference-dashboard">
      {/* 4 KPI Cards: High-Contrast, Clean & Readable */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {kpiCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className={`relative rounded-xl border border-border/60 border-l-4 ${card.accent} ${card.cardBorder} bg-card p-4 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 group`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1.5 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`size-2 rounded-full ${card.indicatorColor}`} />
                    <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase truncate">
                      {card.label}
                    </p>
                  </div>

                  <div className="flex items-baseline gap-2 flex-wrap">
                    <h3 className="text-2xl font-extrabold tracking-tight text-foreground">
                      {saleReportLoading || expenseReportLoading ? "..." : card.value}
                    </h3>
                    {card.trend && (
                      <span
                        className={`inline-flex items-center text-[11px] font-bold ${card.trend === "up" ? "text-emerald-600" : "text-rose-600"
                          }`}
                      >
                        {card.trend === "up" ? (
                          <ArrowUpRight className="size-3.5" />
                        ) : (
                          <ArrowDownRight className="size-3.5" />
                        )}
                      </span>
                    )}
                  </div>
                </div>

                <div
                  className={`rounded-xl p-2.5 ${card.iconBg} transition-transform duration-200 group-hover:scale-110 shrink-0`}
                >
                  <Icon className="size-4" />
                </div>
              </div>

              {/* Bottom Details & Proportion Pill */}
              <div className="mt-3 pt-2.5 border-t border-border/40 flex items-center justify-between text-[11px]">
                <span className="text-muted-foreground truncate">{card.detail}</span>
                <span
                  className={`inline-flex items-center px-1.5 py-0.5 rounded-md font-semibold text-[10px] border ${card.badgeColor} shrink-0`}
                >
                  {card.badge}
                </span>
              </div>
            </div>
          );
        })}
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
        <div className="lg:col-span-7 rounded-xl border border-border/60 bg-card p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-2 border-b border-border/40">
            <div>
              <h3 className="text-base font-semibold text-foreground tracking-tight">
              Total Sale 
              </h3>
              {/* <p className="text-xs text-muted-foreground">
                {chartSubtitle}
              </p> */}
            </div>

            {/* Tab Navigation directly in chart header */}
            <div className="flex items-center gap-1 rounded-xl border border-border/60 bg-muted/40 p-1 w-fit shadow-xs">
              {tabs.map((tab) => {
                const TabIcon = tab.icon;
                const isActive = activeTab === tab.value;
                return (
                  <button
                    key={tab.value}
                    type="button"
                    onClick={() => setActiveTab(tab.value)}
                    className={`
                      inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition-all duration-200
                      ${isActive
                        ? "bg-background text-foreground shadow-sm border border-border/80"
                        : "text-muted-foreground hover:text-foreground hover:bg-background/40"
                      }
                    `}
                  >
                    <TabIcon className="size-3.5" />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="h-[280px] w-full pt-1">
            <ResponsiveContainer width="100%" height="100%">
              {activeTab === "daily" ? (
                <BarChart
                  data={periodComparisonData}
                  margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#888888"
                    opacity={0.15}
                  />
                  <XAxis
                    dataKey="name"
                    tickLine={false}
                    axisLine={{ stroke: "#888888", opacity: 0.2 }}
                    tick={{ fill: "#888888", fontSize: 11 }}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: "#888888", fontSize: 10 }}
                    tickFormatter={(val) =>
                      `$${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`
                    }
                  />
                  <Tooltip
                    formatter={(value: any, _: any, item: any) => [
                      `${formatCurrency(Number(value))} (${item?.payload?.detail || ""})`,
                      item?.payload?.name,
                    ]}
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      borderColor: "hsl(var(--border))",
                      borderRadius: "8px",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                      fontSize: "12px",
                    }}
                  />
                  <Bar dataKey="amount" radius={[4, 4, 0, 0]} maxBarSize={48}>
                    {periodComparisonData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              ) : (
                <BarChart
                  data={
                    activeTab === "weekly"
                      ? weeklyChartData
                      : activeTab === "monthly"
                        ? monthlyWeeksChartData
                        : monthlyChartData
                  }
                  margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
                  barGap={2}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#888888"
                    opacity={0.15}
                  />
                  <XAxis
                    dataKey={
                      activeTab === "weekly"
                        ? "label"
                        : activeTab === "monthly"
                          ? "label"
                          : "month"
                    }
                    tickLine={false}
                    axisLine={{ stroke: "#888888", opacity: 0.2 }}
                    tick={{ fill: "#888888", fontSize: 11 }}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: "#888888", fontSize: 10 }}
                    tickFormatter={(val) =>
                      `$${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`
                    }
                  />
                  <Tooltip
                    formatter={(value: any, name: any) => [
                      formatCurrency(Number(value)),
                      name,
                    ]}
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      borderColor: "hsl(var(--border))",
                      borderRadius: "8px",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                      fontSize: "12px",
                    }}
                  />
                  <Legend
                    wrapperStyle={{ paddingTop: "10px", fontSize: "11px" }}
                  />
                  <Bar
                    dataKey="Sales"
                    name={t("dashboard.total_sales", "Sales")}
                    fill="#3b82f6"
                    radius={[3, 3, 0, 0]}
                    maxBarSize={activeTab === "monthly" ? 22 : 18}
                  />
                  <Bar
                    dataKey="Cost"
                    name={t("dashboard.total_cost", "Cost")}
                    fill="#f59e0b"
                    radius={[3, 3, 0, 0]}
                    maxBarSize={activeTab === "monthly" ? 22 : 18}
                  />
                  <Bar
                    dataKey="Profit"
                    name={t("dashboard.total_profit", "Profit")}
                    fill="#10b981"
                    radius={[3, 3, 0, 0]}
                    maxBarSize={activeTab === "monthly" ? 22 : 18}
                  />
                  <Bar
                    dataKey="Expense"
                    name={t("dashboard.total_expense", "Expense")}
                    fill="#f43f5e"
                    radius={[3, 3, 0, 0]}
                    maxBarSize={activeTab === "monthly" ? 22 : 18}
                  />
                </BarChart>
              )}
            </ResponsiveContainer>
            {/* {activeTab === "daily" && totalSales === 0 && totalExpense === 0 && (
              <p className="text-center text-[11px] text-muted-foreground pt-1">
                {t("common.no_results", "No transactions recorded for today yet.")}
              </p>
            )} */}
          </div>
        </div>

        {/* Stock & Inventory Overview: Easy to Look & Search */}
        <div className="lg:col-span-5 rounded-xl border border-border/60 bg-card p-5 shadow-xs space-y-3.5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-border/40">
              <div>
                <h2 className="text-base font-semibold text-foreground tracking-tight">
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
                <span className="text-[10px] uppercase font-bold text-muted-foreground block">
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
                  ? "border-amber-500 bg-amber-500/10 shadow-xs ring-1 ring-amber-500/30"
                  : "border-border/50 bg-muted/20 hover:bg-muted/40"
                  }`}
              >
                <div className="flex items-center justify-center gap-1 text-[10px] uppercase font-bold text-amber-600 dark:text-amber-400">
                  <AlertTriangle className="size-3" />
                  <span>{t("pos.low_stock", "Low")}</span>
                </div>
                <span className="text-lg font-black text-amber-600 dark:text-amber-400">
                  {lowStockCount}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setStockFilter(stockFilter === "out" ? "all" : "out")}
                className={`rounded-lg border p-2 text-center transition-all ${stockFilter === "out"
                  ? "border-rose-500 bg-rose-500/10 shadow-xs ring-1 ring-rose-500/30"
                  : "border-border/50 bg-muted/20 hover:bg-muted/40"
                  }`}
              >
                <div className="flex items-center justify-center gap-1 text-[10px] uppercase font-bold text-rose-600 dark:text-rose-400">
                  <XCircle className="size-3" />
                  <span>{t("pos.out_of_stock", "Out")}</span>
                </div>
                <span className="text-lg font-black text-rose-600 dark:text-rose-400">
                  {outOfStockCount}
                </span>
              </button>
            </div>

            {/* Quick Search */}
            <div className="relative mb-2">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
              <input
                type="text"
                placeholder={t("pos.search_placeholder", "Search product stock...")}
                value={stockSearch}
                onChange={(e) => setStockSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1 text-xs rounded-lg border border-border/60 bg-background placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-primary/40 focus:border-primary"
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
                      className="flex items-center justify-between p-2 rounded-lg bg-muted/20 hover:bg-muted/40 transition-colors text-xs border border-border/30"
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
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${isOut
                            ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900"
                            : isLow
                              ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-900"
                              : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900"
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
          <div className="pt-2 border-t border-border/40 flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {t("common.total", "Total Units")}:{" "}
              <strong className="text-foreground">
                {totalStockQuantity.toLocaleString()}
              </strong>
            </span>
            <span className="flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
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
