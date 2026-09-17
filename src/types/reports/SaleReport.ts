import type { PageFilter } from "@/types/pagination";
import type { SaleResponse } from "@/types/sales/Sale";

export interface SaleReportFilter extends PageFilter {
  startDate?: string;
  endDate?: string;
  storeId?: number;
  customerId?: number;
  saleStatus?: string;
  paymentStatus?: string;
  productId?: number;
}

export interface ExpenseReportFilter extends PageFilter {
  startDate?: string;
  endDate?: string;
  storeId?: number;
  bankId?: number;
  expenseTypeId?: number;
  status?: string;
  reference?: string;
}

export interface ExpenseReportResponse {
  id?: number;
  reference?: string;
  amount?: number;
  note?: string;
  storeId?: number;
  storeName?: string;
  description?: string;
  status?: string;
  bankId?: number;
  bankName?: string;
  expenseTypeId?: number;
  expenseTypeName?: string;
  createdAt?: string;
}

export interface ProductSerialReportFilter {
  startDate?: string;
  endDate?: string;
  storeId?: number;
  productId?: number;
  status?: string;
  barcode?: string;
  page?: number;
  size?: number;
}

export interface ProductSerialReportResponse {
  id?: number;
  productId?: number;
  productName?: string;
  barcode?: string;
  price?: number;
  cost?: number;
  quantity?: number;
  alertQuantity?: number;
  storeId?: number;
  storeName?: string;
  purchaseId?: number;
  status?: string;
  createdAt?: string;
}

export interface SaleItemReportResponse {
  saleId?: number;
  saleReference?: string;
  saleDate?: string;
  storeId?: number;
  productId?: number;
  productName?: string;
  quantity?: number;
  price?: number;
  itemDiscount?: number;
  subTotal?: number;
  serialNumbers?: string[];
}

export interface SaleReportResponse {
  totalSalesAmount?: number;
  totalDiscount?: number;
  totalPaidAmount?: number;
  totalTransactions?: number;
  storeId?: number;
  storeName?: string;
  customerId?: number;
  customerName?: string;
  startDate?: string;
  endDate?: string;
  sales?: SaleResponse[];
}

export interface SalesReportPageResponse<T> {
  content?: T[];
  data?: T[];
  items?: T[];
  totalElements?: number;
  totalPages?: number;
  number?: number;
  size?: number;
  [key: string]: unknown;
}
