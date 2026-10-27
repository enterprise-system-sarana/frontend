import { useQuery } from "@tanstack/react-query";
import { reportService } from "@/services/reports/report.service";
import type {
  ExpenseReportFilter,
  ProductSerialReportFilter,
  SaleReportFilter,
} from "@/types/reports/SaleReport";
import type {
  PurchaseReportFilter,
} from "@/types/reports/PurchaseReport";
import type {
  PaymentReportFilter,
} from "@/types/reports/PaymentReport";
import type {
  StockMovementReportFilter,
  StockReportFilter,
} from "@/types/reports/StockReport";

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

    purchases: (filter?: PurchaseReportFilter) =>
      [...useReport.keys.all, "purchases", filter ?? {}] as const,
    purchaseItems: (filter?: PurchaseReportFilter, page?: { page?: number; size?: number }) =>
      [...useReport.keys.all, "purchase-items", filter ?? {}, page ?? { page: 1, size: 10 }] as const,

    salePayments: (filter?: PaymentReportFilter) =>
      [...useReport.keys.all, "sale-payments", filter ?? {}] as const,
    salePaymentsPaged: (filter?: PaymentReportFilter, page?: { page?: number; size?: number }) =>
      [...useReport.keys.all, "sale-payments-paged", filter ?? {}, page ?? { page: 1, size: 10 }] as const,

    purchasePayments: (filter?: PaymentReportFilter) =>
      [...useReport.keys.all, "purchase-payments", filter ?? {}] as const,
    purchasePaymentsPaged: (filter?: PaymentReportFilter, page?: { page?: number; size?: number }) =>
      [...useReport.keys.all, "purchase-payments-paged", filter ?? {}, page ?? { page: 1, size: 10 }] as const,

    stocks: (filter?: StockReportFilter) =>
      [...useReport.keys.all, "stocks", filter ?? {}] as const,
    stockItems: (filter?: StockReportFilter, page?: { page?: number; size?: number }) =>
      [...useReport.keys.all, "stock-items", filter ?? {}, page ?? { page: 1, size: 10 }] as const,
    stockSummary: (filter?: StockReportFilter) =>
      [...useReport.keys.all, "stock-summary", filter ?? {}] as const,
    stockMovements: (filter?: StockMovementReportFilter, page?: { page?: number; size?: number }) =>
      [...useReport.keys.all, "stock-movements", filter ?? {}, page ?? { page: 1, size: 10 }] as const,
  },

  useSalesReport: (filter?: SaleReportFilter) =>
    useQuery({
      queryKey: useReport.keys.sales(filter),
      queryFn: () => reportService.getSalesReport(filter),
      retry: 1,
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

  // Purchase Reports
  usePurchaseReport: (filter?: PurchaseReportFilter) =>
    useQuery({
      queryKey: useReport.keys.purchases(filter),
      queryFn: () => reportService.getPurchaseReport(filter),
      retry: 1,
    }),

  usePurchaseItemsReport: (
    filter?: PurchaseReportFilter,
    page?: { page?: number; size?: number },
  ) =>
    useQuery({
      queryKey: useReport.keys.purchaseItems(filter, page),
      queryFn: () => reportService.getPurchaseItemsReport(filter, page),
      retry: 1,
    }),

  // Sale Payment Reports
  useSalePaymentReport: (filter?: PaymentReportFilter) =>
    useQuery({
      queryKey: useReport.keys.salePayments(filter),
      queryFn: () => reportService.getSalePaymentReport(filter),
      retry: 1,
    }),

  useSalePaymentReportPaged: (
    filter?: PaymentReportFilter,
    page?: { page?: number; size?: number },
  ) =>
    useQuery({
      queryKey: useReport.keys.salePaymentsPaged(filter, page),
      queryFn: () => reportService.getSalePaymentReportPaged(filter, page),
      retry: 1,
    }),

  // Purchase Payment Reports
  usePurchasePaymentReport: (filter?: PaymentReportFilter) =>
    useQuery({
      queryKey: useReport.keys.purchasePayments(filter),
      queryFn: () => reportService.getPurchasePaymentReport(filter),
      retry: 1,
    }),

  usePurchasePaymentReportPaged: (
    filter?: PaymentReportFilter,
    page?: { page?: number; size?: number },
  ) =>
    useQuery({
      queryKey: useReport.keys.purchasePaymentsPaged(filter, page),
      queryFn: () => reportService.getPurchasePaymentReportPaged(filter, page),
      retry: 1,
    }),

  // Stock Reports
  useStockReport: (filter?: StockReportFilter) =>
    useQuery({
      queryKey: useReport.keys.stocks(filter),
      queryFn: () => reportService.getStockReport(filter),
      retry: 1,
    }),

  useStockItemsReport: (
    filter?: StockReportFilter,
    page?: { page?: number; size?: number },
  ) =>
    useQuery({
      queryKey: useReport.keys.stockItems(filter, page),
      queryFn: () => reportService.getStockItemsReport(filter, page),
      retry: 1,
    }),

  useStockSummary: (filter?: StockReportFilter) =>
    useQuery({
      queryKey: useReport.keys.stockSummary(filter),
      queryFn: () => reportService.getStockSummary(filter),
      retry: 1,
    }),

  useStockMovements: (
    filter?: StockMovementReportFilter,
    page?: { page?: number; size?: number },
  ) =>
    useQuery({
      queryKey: useReport.keys.stockMovements(filter, page),
      queryFn: () => reportService.getStockMovements(filter, page),
      retry: 1,
    }),
};
