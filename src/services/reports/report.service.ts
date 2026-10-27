import api from '@/services/lib/axios';
import type {
  ExpenseReportFilter,
  ExpenseReportResponse,
  ProductSerialReportFilter,
  ProductSerialReportResponse,
  SaleItemReportResponse,
  SaleReportFilter,
  SaleReportResponse,
} from '@/types/reports/SaleReport';
import type {
  PurchaseItemReportResponse,
  PurchaseReportFilter,
  PurchaseReportResponse,
} from '@/types/reports/PurchaseReport';
import type {
  PaymentReportFilter,
  PurchasePaymentReportResponse,
  PurchasePaymentSummaryResponse,
  SalePaymentReportResponse,
  SalePaymentSummaryResponse,
} from '@/types/reports/PaymentReport';
import type {
  StockItemReportResponse,
  StockMovementItemResponse,
  StockMovementReportFilter,
  StockReportFilter,
  StockReportResponse,
  StockReportSummaryProjection,
} from '@/types/reports/StockReport';

export const reportService = {
  getSalesReport: (filter?: SaleReportFilter) =>
    api.get('/reports/sales', { params: filter }).then((res) => res.data),

  getSalesItemsReport: (
    filter?: SaleReportFilter,
    page?: { page?: number; size?: number },
  ) => {
    const rawPage = page?.page ?? filter?.page ?? 1;
    const pageZero = rawPage > 0 ? rawPage - 1 : 0;
    return api
      .get('/reports/sales/sales-items', {
        params: {
          ...filter,
          status: filter?.saleStatus || (filter as any)?.status,
          saleStatus: filter?.saleStatus || (filter as any)?.status,
          page: pageZero,
          size: page?.size ?? filter?.size ?? 10,
        },
      })
      .catch((err) => {
        if (err?.response?.status === 404) {
          return api.get('/reports/sales', { params: filter });
        }
        throw err;
      })
      .then((res) => res.data);
  },

  getExpenseReport: (filter?: ExpenseReportFilter) => {
    const rawPage = filter?.page ?? 1;
    const pageZero = rawPage > 0 ? rawPage - 1 : 0;
    return api
      .get('/reports/expenses', {
        params: {
          ...filter,
          page: pageZero,
          size: filter?.size ?? 10,
        },
      })
      .catch((err) => {
        if (err?.response?.status === 404) {
          return api.get('/expenses', {
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
      .get('/reports/product-serials', {
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
      .get('/reports/sales', { params: filter })
      .then((res) => res.data?.payload ?? res.data),

  // Purchase Reports
  getPurchaseReport: (filter?: PurchaseReportFilter) =>
    api.get('/reports/purchases', { params: filter }).then((res) => res.data),

  getPurchaseItemsReport: (
    filter?: PurchaseReportFilter,
    page?: { page?: number; size?: number },
  ) => {
    const rawPage = page?.page ?? filter?.page ?? 1;
    const pageZero = rawPage > 0 ? rawPage - 1 : 0;
    return api
      .get('/reports/purchase-items', {
        params: {
          ...filter,
          page: pageZero,
          size: page?.size ?? filter?.size ?? 10,
        },
      })
      .then((res) => res.data);
  },

  // Payment Reports - Sales
  getSalePaymentReport: (filter?: PaymentReportFilter) =>
    api.get('/reports/payments/sales', { params: filter }).then((res) => res.data),

  getSalePaymentReportPaged: (
    filter?: PaymentReportFilter,
    page?: { page?: number; size?: number },
  ) => {
    const rawPage = page?.page ?? filter?.page ?? 1;
    const pageZero = rawPage > 0 ? rawPage - 1 : 0;
    return api
      .get('/reports/payments/sales-paged', {
        params: {
          ...filter,
          page: pageZero,
          size: page?.size ?? filter?.size ?? 10,
        },
      })
      .then((res) => res.data);
  },

  // Payment Reports - Purchases
  getPurchasePaymentReport: (filter?: PaymentReportFilter) =>
    api.get('/reports/payments/purchases', { params: filter }).then((res) => res.data),

  getPurchasePaymentReportPaged: (
    filter?: PaymentReportFilter,
    page?: { page?: number; size?: number },
  ) => {
    const rawPage = page?.page ?? filter?.page ?? 1;
    const pageZero = rawPage > 0 ? rawPage - 1 : 0;
    return api
      .get('/reports/payments/purchases-paged', {
        params: {
          ...filter,
          page: pageZero,
          size: page?.size ?? filter?.size ?? 10,
        },
      })
      .then((res) => res.data);
  },

  // Stock Reports
  getStockReport: (filter?: StockReportFilter) =>
    api.get('/reports/stocks', { params: filter }).then((res) => res.data),

  getStockItemsReport: (
    filter?: StockReportFilter,
    page?: { page?: number; size?: number },
  ) => {
    const rawPage = page?.page ?? filter?.page ?? 1;
    const pageZero = rawPage > 0 ? rawPage - 1 : 0;
    return api
      .get('/reports/stock-items', {
        params: {
          ...filter,
          page: pageZero,
          size: page?.size ?? filter?.size ?? 10,
        },
      })
      .then((res) => res.data);
  },

  getStockSummary: (filter?: StockReportFilter) =>
    api
      .get('/reports/stocks/summary', { params: filter })
      .then((res) => res.data?.payload ?? res.data),

  getStockMovements: (
    filter?: StockMovementReportFilter,
    page?: { page?: number; size?: number },
  ) => {
    const rawPage = page?.page ?? filter?.page ?? 1;
    const pageZero = rawPage > 0 ? rawPage - 1 : 0;
    return api
      .get('/reports/stock-movements', {
        params: {
          ...filter,
          page: pageZero,
          size: page?.size ?? filter?.size ?? 10,
        },
      })
      .then((res) => res.data);
  },
};

export const salesReportService = {
  getReport: (filter?: SaleReportFilter) =>
    reportService.getSalesReport(filter) as Promise<{
      payload?: SaleReportResponse;
    }>,

  getStockReport: (filter?: StockReportFilter) =>
    reportService.getStockReport(filter) as Promise<{
      payload?: StockReportResponse;
    }>,

  getStockItemsReport: (
    filter?: StockReportFilter,
    page?: { page?: number; size?: number },
  ) =>
    reportService.getStockItemsReport(filter, page) as Promise<{
      payload?: { content?: StockItemReportResponse[]; totalElements?: number; totalPages?: number } | StockItemReportResponse[];
    }>,

  getStockSummary: (filter?: StockReportFilter) =>
    reportService.getStockSummary(filter) as Promise<{
      payload?: StockReportSummaryProjection;
    }>,

  getStockMovements: (
    filter?: StockMovementReportFilter,
    page?: { page?: number; size?: number },
  ) =>
    reportService.getStockMovements(filter, page) as Promise<{
      payload?: { content?: StockMovementItemResponse[]; totalElements?: number; totalPages?: number } | StockMovementItemResponse[];
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

  getPurchaseReport: (filter?: PurchaseReportFilter) =>
    reportService.getPurchaseReport(filter) as Promise<{
      payload?: PurchaseReportResponse;
    }>,

  getPurchaseItemsReport: (
    filter?: PurchaseReportFilter,
    page?: { page?: number; size?: number },
  ) =>
    reportService.getPurchaseItemsReport(filter, page) as Promise<{
      payload?: { content?: PurchaseItemReportResponse[]; totalElements?: number; totalPages?: number };
    }>,

  getSalePaymentReport: (filter?: PaymentReportFilter) =>
    reportService.getSalePaymentReport(filter) as Promise<{
      payload?: SalePaymentSummaryResponse;
    }>,

  getPurchasePaymentReport: (filter?: PaymentReportFilter) =>
    reportService.getPurchasePaymentReport(filter) as Promise<{
      payload?: PurchasePaymentSummaryResponse;
    }>,
};
