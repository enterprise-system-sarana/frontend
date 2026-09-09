import api from "@/services/lib/axios";
import type {
  ExpenseReportFilter,
  ExpenseReportResponse,
  ProductSerialReportFilter,
  ProductSerialReportResponse,
  SaleItemReportResponse,
  SaleReportFilter,
  SaleReportResponse,
} from "@/types/reports/SaleReport";

export const reportService = {
  getSalesReport: (filter?: SaleReportFilter) =>
    api.get("/reports/sales", { params: filter }).then((res) => res.data),

  getSalesItemsReport: (
    filter?: SaleReportFilter,
    page?: { page?: number; size?: number },
  ) =>
    api
      .get("/reports/sales-items", {
        params: {
          ...filter,
          page: page?.page ?? filter?.page ?? 1,
          size: page?.size ?? filter?.size ?? 10,
        },
      })
      .then((res) => res.data),

  getExpenseReport: (filter?: ExpenseReportFilter) =>
    api
      .get("/reports/expenses", {
        params: {
          ...filter,
          page: filter?.page ?? 1,
          size: filter?.size ?? 10,
        },
      })
      .then((res) => res.data),

  getProductSerialReport: (
    filter?: ProductSerialReportFilter,
    page?: { page?: number; size?: number },
  ) =>
    api
      .get("/reports/product-serials", {
        params: {
          ...filter,
          page: page?.page ?? filter?.page ?? 1,
          size: page?.size ?? filter?.size ?? 10,
        },
      })
      .then((res) => res.data),

  getSaleReportSummary: (filter?: SaleReportFilter) =>
    api
      .get("/reports/sales", { params: filter })
      .then((res) => res.data?.payload ?? res.data),
};

export const salesReportService = {
  getReport: (filter?: SaleReportFilter) =>
    reportService.getSalesReport(filter) as Promise<{
      payload?: SaleReportResponse;
    }>,

  getItems: (filter?: SaleReportFilter, page?: { page?: number; size?: number }) =>
    reportService.getSalesItemsReport(filter, page) as Promise<{
      payload?: SaleItemReportResponse[];
    }>,

  getExpense: (filter?: ExpenseReportFilter) =>
    reportService.getExpenseReport(filter) as Promise<{
      payload?: ExpenseReportResponse[];
    }>,

  getProductSerial: (
    filter?: ProductSerialReportFilter,
    page?: { page?: number; size?: number },
  ) =>
    reportService.getProductSerialReport(filter, page) as Promise<{
      payload?: ProductSerialReportResponse[];
    }>,
};
