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
      .get("/reports/sales", {
        params: {
          ...filter,
          page: page?.page ?? filter?.page,
          size: page?.size ?? filter?.size,
        },
      })
      .then((res) => res.data),

  getExpenseReport: (filter?: ExpenseReportFilter) => {
    const rawPage = filter?.page ?? 1;
    const pageZero = rawPage > 0 ? rawPage - 1 : 0;
    return api
      .get("/reports/expenses", {
        params: {
          ...filter,
          page: pageZero,
          size: filter?.size ?? 10,
        },
      })
      .catch((err) => {
        if (err?.response?.status === 404) {
          return api.get("/expenses", {
            params: {
              ...filter,
              page: pageZero,
              size: filter?.size ?? 10,
            },
          });
        }
        throw err;
      })
      .then((res) => res.data);
  },

  getProductSerialReport: (
    filter?: ProductSerialReportFilter,
    page?: { page?: number; size?: number },
  ) => {
    const rawPage = page?.page ?? filter?.page ?? 1;
    const pageZero = rawPage > 0 ? rawPage - 1 : 0;
    return api
      .get("/reports/product-serials", {
        params: {
          ...filter,
          page: pageZero,
          size: page?.size ?? filter?.size ?? 10,
        },
      })
      .then((res) => res.data);
  },

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
