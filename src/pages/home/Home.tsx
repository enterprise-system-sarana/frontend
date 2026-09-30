import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ArrowRight, Boxes, ChartColumn, FolderOpen, Package, Settings, ShoppingCart, Tags, Users, UserRound } from "lucide-react";
import { ROUTERS } from "@/constants/Route";
import { useSale } from "@/hooks/sales/useSale";
import { usePurchase } from "@/hooks/purchases/usePurchase";
import { useProduct } from "@/hooks/product/useProduct";
import { useStock } from "@/hooks/inventory/useStock";
import type { StockResponse } from "@/types/inventory/Stock";

type DataRow = Record<string, any>;
const rows = (value: unknown): DataRow[] => {
  const response = value as DataRow | undefined;
  const data = response?.payload?.data ?? response?.payload?.content ?? response?.data ?? response?.payload ?? value;
  return Array.isArray(data) ? data : [];
};
const thisMonth = (value: unknown, now: Date) => {
  if (!value) return false;
  const date = new Date(String(value));
  return !Number.isNaN(date.getTime()) && date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
};
const money = (value: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);

export const HomePage = () => {
  const navigate = useNavigate();
  const now = useMemo(() => new Date(), []);
  const { data: salesData, isLoading: salesLoading } = useSale.GetAll({ page: 1, size: 1000 });
  const { data: purchasesData, isLoading: purchasesLoading } = usePurchase.GetAll({ page: 1, size: 1000 });
  const { data: productsData, isLoading: productsLoading, isError: productsError } = useProduct.useGetAllProduct({ page: 1, size: 1000 });
  const { data: stocksData, isLoading: stocksLoading, isError: stocksError } = useStock.useGetAllStock({ page: 1, size: 1000 });
  const sales = useMemo(() => rows(salesData), [salesData]);
  const purchases = useMemo(() => rows(purchasesData), [purchasesData]);
  const products = useMemo(() => rows(productsData), [productsData]);
  const stocks = useMemo(() => rows(stocksData) as StockResponse[], [stocksData]);
  const monthlySales = sales.filter((item) => thisMonth(item.saleDate ?? item.createdAt ?? item.date, now));
  const monthlyPurchases = purchases.filter((item) => thisMonth(item.purchaseDate ?? item.createdAt ?? item.date, now));
  const totalSales = monthlySales.reduce((sum, item) => sum + (Number(item.grandTotal ?? item.totalAmount ?? item.total) || 0), 0);
  const totalPurchases = monthlyPurchases.reduce((sum, item) => sum + (Number(item.grandTotal ?? item.totalAmount ?? item.total) || 0), 0);
  const totalDiscount = monthlySales.reduce((sum, item) => sum + (Number(item.discount) || 0), 0);
  const stockByProduct = useMemo(() => {
    const items = new Map<number, { id: number; name: string; quantity: number; stores: Set<string>; lowStock: boolean }>();
    for (const product of products) {
      const id = Number(product.id);
      if (!Number.isFinite(id)) continue;
      items.set(id, { id, name: product.name || `Product #${id}`, quantity: 0, stores: new Set<string>(), lowStock: false });
    }
    for (const stock of stocks) {
      const id = Number(stock.productId);
      if (!Number.isFinite(id)) continue;
      const item = items.get(id) ?? { id, name: stock.productName || `Product #${id}`, quantity: 0, stores: new Set<string>(), lowStock: false };
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
  const summaries = [
    { label: "Sales", value: totalSales, icon: ShoppingCart, color: "blue", route: ROUTERS.SALE },
    { label: "Purchases", value: totalPurchases, icon: ShoppingCart, color: "orange", route: ROUTERS.PURCHASE },
    { label: "Discount", value: totalDiscount, icon: Tags, color: "pink", route: ROUTERS.SALE },
  ];
  const links = [
    { label: "Products", icon: Boxes, route: ROUTERS.PRODUCT },
    { label: "Sales", icon: ShoppingCart, route: ROUTERS.SALE },
    { label: "Categories", icon: FolderOpen, route: ROUTERS.CATEGORY },
    { label: "Customers", icon: Users, route: ROUTERS.CUSTOMER },
    { label: "Catalog Setup", icon: Settings, route: ROUTERS.CATEGORY },
    { label: "Reports", icon: ChartColumn, route: ROUTERS.REPORT_SALES },
    { label: "Users", icon: UserRound, route: ROUTERS.USER },
  ];
  const chartData = useMemo(() => {
    const firstMonth = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    const months = Array.from({ length: 6 }, (_, index) => {
      const date = new Date(firstMonth.getFullYear(), firstMonth.getMonth() + index, 1);
      return { month: `${date.toLocaleDateString("en-US", { month: "short" })}${index === 0 ? " & Prior" : ""}`, Sales: 0 };
    });
    for (const sale of sales) {
      const value = sale.saleDate ?? sale.createdAt ?? sale.date;
      if (!value) continue;
      const date = new Date(String(value));
      if (Number.isNaN(date.getTime())) continue;
      const monthOffset = (date.getFullYear() - firstMonth.getFullYear()) * 12 + date.getMonth() - firstMonth.getMonth();
      if (monthOffset > 5) continue;
      months[Math.max(0, monthOffset)].Sales += Number(sale.grandTotal ?? sale.totalAmount ?? sale.total) || 0;
    }
    return months;
  }, [sales, now]);

  return <main className="reference-dashboard">
    <div className="reference-heading"><h1>Dashboard</h1><div className="reference-breadcrumb"><span>◉</span> Home <span className="reference-divider">›</span> Dashboard</div></div>
    <section className="reference-summary-grid" aria-label="Monthly summary">
      {summaries.map(({ label, value, icon: Icon, color, route }) => <button key={label} type="button" className="reference-summary-card" onClick={() => navigate(route)}>
        <span className={`reference-summary-icon ${color}`}><Icon size={23} strokeWidth={2.6} /></span>
        <span className="reference-summary-copy"><span className="reference-summary-label">{label}</span><strong>{salesLoading || purchasesLoading ? "—" : money(value)}</strong></span>
      </button>)}
    </section>
    <section className="reference-panel reference-quick-links"><div className="reference-panel-head"><h2>Quick Links</h2><span>SHORTCUTS</span></div>
      <div className="reference-link-list">{links.map(({ label, icon: Icon, route }) => <button type="button" key={label} onClick={() => navigate(route)}><Icon size={16} />{label}</button>)}</div>
    </section>
    <div className="reference-charts">
      <section className="reference-panel reference-sales-chart"><div className="reference-panel-head"><h2>Sales Chart</h2></div><div className="reference-chart-body">
        <ResponsiveContainer width="100%" height="100%"><BarChart data={chartData} margin={{ top: 6, right: 6, left: 0, bottom: 1 }} barSize={23}>
          <CartesianGrid vertical={false} stroke="#d9dde3" /><XAxis dataKey="month" interval={0} tickLine={false} axisLine={{ stroke: "#d9dde3" }} tick={{ fill: "#586b7e", fontSize: 10 }} />
          <YAxis hide width={0} domain={[0, "auto"]} tickCount={6} /><Tooltip formatter={(value) => money(Number(value))} cursor={{ fill: "#eef5fa" }} />
          <Bar dataKey="Sales" fill="#17678e" radius={0} />
        </BarChart></ResponsiveContainer>
      </div></section>
      <section className="reference-panel reference-stock"><div className="reference-panel-head"><div><h2>Product stock quantities</h2><p>{inStockCount} in stock · {outOfStockCount} out of stock</p></div><button type="button" onClick={() => navigate(ROUTERS.STOCK)}>View all stock <ArrowRight size={14} /></button></div>
      {stocksLoading || productsLoading ? <div className="reference-stock-state">Loading product quantities...</div> : stocksError ? <div className="reference-stock-state">Stock quantities could not be loaded.</div> : productsError && stockByProduct.length === 0 ? <div className="reference-stock-state">Products could not be loaded.</div> : stockByProduct.length === 0 ? <div className="reference-stock-state">No products yet</div> : <div className="reference-stock-table">
        <div className="reference-stock-row reference-stock-header"><span>Product</span><span>Stores</span><span>Quantity</span><span>Status</span></div>
        {stockByProduct.map((product) => <div className="reference-stock-row" key={product.id}><span className="reference-product-name"><Package size={16} />{product.name}</span><span>{[...product.stores].join(", ") || "—"}</span><strong>{product.quantity.toLocaleString()}</strong><span className={`reference-stock-status ${product.quantity <= 0 ? "out" : product.lowStock ? "low" : "in"}`}>{product.quantity <= 0 ? "Out" : product.lowStock ? "Low" : "In stock"}</span></div>)}
      </div>}
      </section>
    </div>
    <footer className="reference-footer"><span>Copyright © {now.getFullYear()} 360System. All rights reserved.</span><span>Inventory Management</span></footer>
  </main>;
};

export default HomePage;
