import { useQuery } from "@tanstack/react-query";
import { reportService } from "@/services/reports/report.service";
import type {
  ExpenseReportFilter,
  ProductSerialReportFilter,
  SaleReportFilter,
} from "@/types/reports/SaleReport";

export const useReport = {
  keys: {
    all: ["reports"] as const,
    sales: (filter?: SaleReportFilter) => [...useReport.keys.all, "sales", filter ?? {}] as const,
    salesItems: (filter?: SaleReportFilter, page?: { page?: number; size?: number }) =>
      [...useReport.keys.all, "sales-items", filter ?? {}, page ?? { page: 1, size: 10 }] as const,
    expenses: (filter?: ExpenseReportFilter) =>
      [...useReport.keys.all, "expenses", filter ?? {}] as const,
    productSerials: (filter?: ProductSerialReportFilter, page?: { page?: number; size?: number }) =>
      [...useReport.keys.all, "product-serials", filter ?? {}, page ?? { page: 1, size: 10 }] as const,
  },

  useSalesReport: (filter?: SaleReportFilter) =>
    useQuery({
      queryKey: useReport.keys.sales(filter),
      queryFn: () => reportService.getSalesReport(filter),
      retry: 1,
      enabled: !!filter,
    }),

  useSalesItemsReport: (filter?: SaleReportFilter, page?: { page?: number; size?: number }) =>
    useQuery({
      queryKey: useReport.keys.salesItems(filter, page),
      queryFn: () => reportService.getSalesItemsReport(filter, page),
      retry: 1,
    }),

  useExpenseReport: (filter?: ExpenseReportFilter) =>
    useQuery({
      queryKey: useReport.keys.expenses(filter),
      queryFn: () => reportService.getExpenseReport(filter),
      retry: 1,
    }),

  useProductSerialReport: (
    filter?: ProductSerialReportFilter,
    page?: { page?: number; size?: number },
  ) =>
    useQuery({
      queryKey: useReport.keys.productSerials(filter, page),
      queryFn: () => reportService.getProductSerialReport(filter, page),
      retry: 1,
      enabled: !!filter || !!page,
    }),
};
