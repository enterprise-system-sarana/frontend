import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  TrendingDown,
  DollarSign,
  ArrowUpRight,
  Calendar,
  ShoppingCart,
  CreditCard,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ROUTERS } from "@/constants/Route";
import { useSale } from "@/hooks/sales/useSale";
import { usePurchase } from "@/hooks/purchases/usePurchase";
import { useExpense } from "@/hooks/expense/useExpense";
import { usePayment } from "@/hooks/sales/usePayment";
import { useProduct } from "@/hooks/product/useProduct";
import { useCategory } from "@/hooks/product/useCategory";
import InteractiveAreaChart from "./components/InteractiveAreaChart";
import TopProductsPieChart from "./components/TopProductsPieChart";

function isToday(dateStr?: string | null): boolean {
  if (!dateStr) return false;
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return false;
    const today = new Date();
    return (
      d.getFullYear() === today.getFullYear() &&
      d.getMonth() === today.getMonth() &&
      d.getDate() === today.getDate()
    );
  } catch {
    return false;
  }
}

export const HomePage = () => {
  const [isReady, setIsReady] = useState(false);
  const navigate = useNavigate();

  /* -------------------------------------------------------
     REAL DATABASE DATA FETCHING
  ------------------------------------------------------- */
  const { data: salesData, isLoading: isSalesLoading } = useSale.GetAll({ page: 1, size: 1000 });
  const { data: purchasesData, isLoading: isPurchasesLoading } = usePurchase.GetAll({ page: 1, size: 1000 });
  const { data: expensesData, isLoading: isExpensesLoading } = useExpense.useGetAllExpense({ page: 1, size: 1000 });
  const { data: paymentsData, isLoading: isPaymentsLoading } = usePayment.getAllPayments({ page: 1, size: 1000 });
  const { data: productsData } = useProduct.useGetAllProduct({ page: 1, size: 1000 });
  const { data: categoriesData } = useCategory.useGetAllCategory({ page: 1, size: 1000 });

  useEffect(() => {
    const timer = window.setTimeout(() => setIsReady(true), 80);
    return () => window.clearTimeout(timer);
  }, []);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Number(val) || 0);
  };


  /* -------------------------------------------------------
     EXTRACT REAL ENTITY ARRAYS
  ------------------------------------------------------- */
  const salesList: any[] = useMemo(() => {
    const raw = (salesData as any)?.payload?.data ?? (salesData as any)?.payload?.content ?? (salesData as any)?.data ?? (salesData as any)?.payload ?? salesData ?? [];
    return Array.isArray(raw) ? raw : [];
  }, [salesData]);

  const purchasesList: any[] = useMemo(() => {
    const raw = (purchasesData as any)?.payload?.data ?? (purchasesData as any)?.payload?.content ?? (purchasesData as any)?.data ?? (purchasesData as any)?.payload ?? purchasesData ?? [];
    return Array.isArray(raw) ? raw : [];
  }, [purchasesData]);

  const expensesList: any[] = useMemo(() => {
    const raw = (expensesData as any)?.payload?.data ?? (expensesData as any)?.payload?.content ?? (expensesData as any)?.data ?? (expensesData as any)?.payload ?? expensesData ?? [];
    return Array.isArray(raw) ? raw : [];
  }, [expensesData]);

  const paymentsList: any[] = useMemo(() => {
    const raw = (paymentsData as any)?.payload?.data ?? (paymentsData as any)?.payload?.content ?? (paymentsData as any)?.data ?? (paymentsData as any)?.payload ?? paymentsData ?? [];
    return Array.isArray(raw) ? raw : [];
  }, [paymentsData]);

  const productList: any[] = useMemo(() => {
    const raw = (productsData as any)?.payload?.data ?? (productsData as any)?.payload?.content ?? (productsData as any)?.data ?? (productsData as any)?.payload ?? productsData ?? [];
    return Array.isArray(raw) ? raw : [];
  }, [productsData]);

  const categoryList: any[] = useMemo(() => {
    const raw = (categoriesData as any)?.payload?.data ?? (categoriesData as any)?.payload?.content ?? (categoriesData as any)?.data ?? (categoriesData as any)?.payload ?? categoriesData ?? [];
    return Array.isArray(raw) ? raw : [];
  }, [categoriesData]);

  /* -------------------------------------------------------
     REAL KPIS CALCULATIONS
  ------------------------------------------------------- */

  // 1. Total Purchase Today & All-time
  const totalPurchaseToday = useMemo(() => {
    return purchasesList
      .filter((p: any) => isToday(p.purchaseDate || p.createdAt || p.date))
      .reduce((sum: number, p: any) => sum + (Number(p.grandTotal ?? p.totalAmount ?? p.total ?? 0) || 0), 0);
  }, [purchasesList]);

  const totalPurchaseAllTime = useMemo(() => {
    return purchasesList.reduce((sum: number, p: any) => sum + (Number(p.grandTotal ?? p.totalAmount ?? p.total ?? 0) || 0), 0);
  }, [purchasesList]);

  // 2. Total Sale Today & All-time
  const totalSaleToday = useMemo(() => {
    return salesList
      .filter((s: any) => isToday(s.saleDate || s.createdAt || s.date))
      .reduce((sum: number, s: any) => sum + (Number(s.grandTotal ?? s.totalAmount ?? s.total ?? 0) || 0), 0);
  }, [salesList]);

  const totalSaleAllTime = useMemo(() => {
    return salesList.reduce((sum: number, s: any) => sum + (Number(s.grandTotal ?? s.totalAmount ?? s.total ?? 0) || 0), 0);
  }, [salesList]);

  // 3. Total Expense Today & All-time
  const totalExpenseToday = useMemo(() => {
    return expensesList
      .filter((e: any) => isToday(e.expenseDate || e.date || e.createdAt))
      .reduce((sum: number, e: any) => sum + (Number(e.amount ?? e.totalAmount ?? 0) || 0), 0);
  }, [expensesList]);

  const totalExpenseAllTime = useMemo(() => {
    return expensesList.reduce((sum: number, e: any) => sum + (Number(e.amount ?? e.totalAmount ?? 0) || 0), 0);
  }, [expensesList]);

  // 4. Total Payment Today & All-time
  const totalPaymentToday = useMemo(() => {
    return paymentsList
      .filter((p: any) => isToday(p.paymentDate || p.date || p.createdAt))
      .reduce((sum: number, p: any) => sum + (Number(p.amount || 0) || 0), 0);
  }, [paymentsList]);

  const totalPaymentAllTime = useMemo(() => {
    return paymentsList.reduce((sum: number, p: any) => sum + (Number(p.amount || 0) || 0), 0);
  }, [paymentsList]);

  // 5. Top Product
  const topProduct = useMemo(() => {
    const productCountMap = new Map<string, number>();
    for (const sale of salesList) {
      if (Array.isArray(sale.items)) {
        for (const item of sale.items) {
          const name = item.productName || (productList.find((p) => p.id === item.productId)?.name);
          const qty = Number(item.quantity || 1);
          if (name) {
            productCountMap.set(name, (productCountMap.get(name) || 0) + qty);
          }
        }
      }
    }
    let topName = "";
    let maxQty = 0;
    productCountMap.forEach((qty, name) => {
      if (qty > maxQty) {
        maxQty = qty;
        topName = name;
      }
    });
    if (topName) return `${topName} (${maxQty} sold)`;
    return productList[0]?.name || "In Stock";
  }, [salesList, productList]);

  // 6. Top Category
  const topCategory = useMemo(() => {
    return categoryList[0]?.name || "General";
  }, [categoryList]);


  /* -------------------------------------------------------
     KPI CARDS CONFIGURATION (4 CARDS WITH DIRECT NAVIGATION)
  ------------------------------------------------------- */
  const kpiData = [
    {
      title: "Total Sale Today",
      value: formatCurrency(totalSaleToday),
      subValue: `All-time: ${formatCurrency(totalSaleAllTime)}`,
      route: ROUTERS.SALE,
      icon: DollarSign,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
      borderHover: "hover:border-emerald-400 dark:hover:border-emerald-500",
      tag: "Sales",
    },
    {
      title: "Total Purchase Today",
      value: formatCurrency(totalPurchaseToday),
      subValue: `All-time: ${formatCurrency(totalPurchaseAllTime)}`,
      route: ROUTERS.PURCHASE,
      icon: ShoppingCart,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
      borderHover: "hover:border-blue-400 dark:hover:border-blue-500",
      tag: "Purchases",
    },
    {
      title: "Total Expense Today",
      value: formatCurrency(totalExpenseToday),
      subValue: `All-time: ${formatCurrency(totalExpenseAllTime)}`,
      route: ROUTERS.EXPENSE,
      icon: TrendingDown,
      color: "text-rose-500",
      bg: "bg-rose-500/10",
      borderHover: "hover:border-rose-400 dark:hover:border-rose-500",
      tag: "Expenses",
    },
    {
      title: "Total Payment Today",
      value: formatCurrency(totalPaymentToday),
      subValue: `All-time: ${formatCurrency(totalPaymentAllTime)}`,
      route: ROUTERS.PAYMENT,
      icon: CreditCard,
      color: "text-purple-500",
      bg: "bg-purple-500/10",
      borderHover: "hover:border-purple-400 dark:hover:border-purple-500",
      tag: "Payments",
    },
  ];

  const isLoading = isSalesLoading || isPurchasesLoading || isExpensesLoading || isPaymentsLoading;

  return (
    <main
      className={`mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-8 transition-all duration-700 ease-out ${
        isReady ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      }`}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Dashboard Overview
          </h1>
          <p className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
            <Calendar className="size-4" />
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            onClick={() => navigate(ROUTERS.PURCHASE_CREATE)}
            className="rounded-xl shadow-xs border-border/60 text-xs font-semibold cursor-pointer gap-1.5"
          >
            <Plus className="size-3.5" />
            <span>New Purchase</span>
          </Button>
          <Button
            onClick={() => navigate(ROUTERS.SALE_CREATE)}
            className="rounded-xl shadow-xs bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-semibold cursor-pointer gap-1.5"
          >
            <Plus className="size-3.5" />
            <span>Create Sale</span>
          </Button>
        </div>
      </div>

      {isLoading && salesList.length === 0 && purchasesList.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="size-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground mt-4">Loading real database data...</p>
        </div>
      ) : (
        <>
          {/* 4 Primary KPI Cards in a 4-Column Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
            {kpiData.map((kpi, index) => {
              const Icon = kpi.icon;
              return (
                <div
                  key={kpi.title}
                  onClick={() => kpi.route && navigate(kpi.route)}
                  className={`bg-card border border-border/60 rounded-2xl p-6 shadow-xs hover:shadow-md transition-all cursor-pointer group active:scale-[0.99] relative overflow-hidden ${kpi.borderHover}`}
                  style={{ animationDelay: `${index * 80}ms` }}
                  title={`Click to view ${kpi.tag}`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div
                      className={`size-11 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105 ${kpi.bg}`}
                    >
                      <Icon className={`size-5.5 ${kpi.color}`} />
                    </div>
                    <div className="flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                      <span>{kpi.tag}</span>
                      <ArrowUpRight className="size-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                      {kpi.title}
                    </h3>
                    <p className="text-2xl font-black font-mono tracking-tight text-foreground truncate">
                      {kpi.value}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1.5 font-medium">
                      {kpi.subValue}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Charts Row: 2-Column Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-stretch">
            <InteractiveAreaChart salesList={salesList} purchasesList={purchasesList} />
            <TopProductsPieChart salesList={salesList} productList={productList} />
          </div>
        </>
      )}
    </main>
  );
};

export default HomePage;
