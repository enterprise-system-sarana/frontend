import api from "@/services/lib/axios";
import type { ProfitLossReportFilter, ProfitLossReportResponse } from "@/types/reports/ProfitLoss";

export const profitLossService = {
  getReport: async (filter: ProfitLossReportFilter): Promise<ProfitLossReportResponse> => {
    const response = await api.get("/reports/profit-loss", { params: filter });
    const report = response.data?.payload?.data ?? response.data?.payload ?? response.data;

    if (!report || !Array.isArray(report.months) || !report.income || !report.expenses || !Array.isArray(report.netProfit)) {
      throw new Error("The profit and loss report has an unexpected response format.");
    }
    const series = [
      report.income.sales,
      report.income.service,
      report.income.purchaseReturn,
      report.income.grossProfit,
      report.expenses.sales,
      report.expenses.purchase,
      report.expenses.salesReturn,
      report.expenses.totalExpense,
      report.netProfit,
    ];
    if (series.some((values) => !Array.isArray(values) || values.length !== report.months.length)) {
      throw new Error("The profit and loss report has incomplete monthly values.");
    }

    return report as ProfitLossReportResponse;
  },
};
