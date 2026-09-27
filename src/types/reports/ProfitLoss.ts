export interface ProfitLossReportResponse {
  months: string[];
  income: {
    sales: number[];
    service: number[];
    purchaseReturn: number[];
    grossProfit: number[];
  };
  expenses: {
    sales: number[];
    purchase: number[];
    salesReturn: number[];
    totalExpense: number[];
  };
  netProfit: number[];
}

export interface ProfitLossReportFilter {
  startDate: string;
  endDate: string;
}
