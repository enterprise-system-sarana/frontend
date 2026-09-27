import { useQuery } from "@tanstack/react-query";
import { profitLossService } from "@/services/reports/profitLoss.service";
import type { ProfitLossReportFilter, ProfitLossReportResponse } from "@/types/reports/ProfitLoss";

export const useProfitLoss = {
  keys: {
    all: ["profitLoss"] as const,
    report: (filter: ProfitLossReportFilter) => [...useProfitLoss.keys.all, "report", filter] as const,
  },
  useGetReport: (filter: ProfitLossReportFilter) => {
    return useQuery({
      queryKey: useProfitLoss.keys.report(filter),
      queryFn: async () => {
        const response = await profitLossService.getReport(filter);
        return response as ProfitLossReportResponse;
      },
    });
  },
};
