export interface KpiData {
  value: number;
  changePercentage: number;
  isPositive: boolean;
}

export interface DashboardSummaryResponse {
  kpis: {
    totalRevenue: KpiData;
    netProfit: KpiData;
    totalSales: KpiData;
    activeCustomers: KpiData;
    totalPurchaseToday: KpiData;
    totalSaleToday: KpiData;
    totalExpenseToday: KpiData;
    totalPaymentToday: KpiData;
    topProduct: string;
    topCategory: string;
  };
  revenueChart: {
    labels: string[];
    data: number[];
  };
  recentTransactions: Array<{
    id: number;
    name: string;
    date: string;
    amount: number;
    status: string;
  }>;
}
