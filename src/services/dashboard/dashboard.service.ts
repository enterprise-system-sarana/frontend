import api from "../lib/axios";
import type { DashboardSummaryResponse } from "@/types/dashboard/Dashboard";

export const dashboardService = {
  getSummary: (): Promise<{ payload: { data: DashboardSummaryResponse } } | { data: DashboardSummaryResponse } | DashboardSummaryResponse> => 
    api.get("/dashboard/summary").then((res) => res.data),
};
