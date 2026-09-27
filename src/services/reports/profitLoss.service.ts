import type { ProfitLossReportFilter, ProfitLossReportResponse } from "@/types/reports/ProfitLoss";

// Mock Data Generator for Frontend Development
const generateMockData = (): ProfitLossReportResponse => {
  return {
    months: ["Jan 2026", "Feb 2026", "Mar 2026", "Apr 2026", "May 2026", "Jun 2026"],
    income: {
      sales: [50000, 50000, 50000, 50000, 50000, 50000],
      service: [30000, 30000, 30000, 30000, 30000, 30000],
      purchaseReturn: [7000, 7000, 7000, 7000, 7000, 7000],
      grossProfit: [8000, 8000, 8000, 8000, 8000, 8000]
    },
    expenses: {
      sales: [50000, 50000, 50000, 50000, 50000, 50000],
      purchase: [30000, 30000, 30000, 30000, 30000, 30000],
      salesReturn: [7000, 7000, 7000, 7000, 7000, 7000],
      totalExpense: [8000, 8000, 8000, 8000, 8000, 8000]
    },
    netProfit: [8000, 8000, 8000, 8000, 8000, 8000]
  };
};

export const profitLossService = {
  getReport: async (filter: ProfitLossReportFilter): Promise<ProfitLossReportResponse> => {
    // Uncomment this when backend is ready:
    // return api.get("/reports/profit-loss", { params: filter }).then((res) => res.data);

    // Using mock data for now
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(generateMockData());
      }, 500);
    });
  }
};
