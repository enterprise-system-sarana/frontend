import type { PageFilter } from "@/types/pagination";

export interface SaleReportFilter extends PageFilter {
  startDate?: string;
  endDate?: string;
  storeId?: number;
  storeName?: string;
  customerId?: number;
  customerName?: string;
  saleStatus?: string;
  paymentStatus?: string;
  productId?: number;
  productName?: string;
  categoryId?: number;
  brandId?: number;
  search?: string;
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

export interface ProductSerialReportFilter extends PageFilter {
  startDate?: string;
  endDate?: string;
  storeId?: number;
  productId?: number;
  status?: string;
  barcode?: string;
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
  itemId?: number;
  saleId?: number;
  saleReference?: string;
  saleNo?: string;
  saleDate?: string;
  saleStatus?: string;
  paymentStatus?: string;
  storeId?: number;
  storeName?: string;
  customerId?: number;
  customerName?: string;
  productId?: number;
  productName?: string;
  productCode?: string;
  modelId?: number;
  modelName?: string;
  brandId?: number;
  brandName?: string;
  categoryId?: number;
  categoryName?: string;
  quantity?: number;
  returnedQuantity?: number;
  price?: number;
  unitPrice?: number;
  unitCost?: number;
  itemDiscount?: number;
  subTotal?: number;
  totalCost?: number;
  totalProfit?: number;
  serialNumbers?: (string | number)[];
}

export interface SaleReportResponse {
  totalSalesAmount?: number;
  totalDiscount?: number;
  totalPaidAmount?: number;
  totalCost?: number;
  totalProfit?: number;
  totalExpense?: number;
  totalTransactions?: number;
  storeId?: number;
  storeName?: string;
  customerId?: number;
  customerName?: string;
  startDate?: string;
  endDate?: string;
  sales?: any[];
}
