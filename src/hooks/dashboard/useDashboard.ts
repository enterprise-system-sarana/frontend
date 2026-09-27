import { useQuery } from "@tanstack/react-query";
import { dashboardService } from "@/services/dashboard/dashboard.service";
import type { DashboardSummaryResponse } from "@/types/dashboard/Dashboard";

export const useDashboard = {
  keys: {
    all: ["dashboard"] as const,
    summary: () => [...useDashboard.keys.all, "summary"] as const,
  },
  useGetSummary: () => {
    return useQuery({
      queryKey: useDashboard.keys.summary(),
      queryFn: async () => {
        const response = await dashboardService.getSummary();
        // Handle various response wrappers
        if ('payload' in response && response.payload && 'data' in response.payload) {
          return response.payload.data as DashboardSummaryResponse;
        }
        if ('data' in response) {
          return response.data as DashboardSummaryResponse;
        }
        return response as DashboardSummaryResponse;
      },
    });
  },
};
