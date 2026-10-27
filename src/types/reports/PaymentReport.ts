import type { PageFilter } from '@/types/pagination';

export interface PaymentReportFilter extends PageFilter {
  startDate?: string;
  endDate?: string;
  storeId?: number;
  customerId?: number;
  supplierId?: number;
  saleId?: number;
  purchaseId?: number;
  bankId?: number;
  paymentStatus?: string;
  paymentMethod?: string;
}

export interface SalePaymentReportResponse {
  paymentId?: number;
  paymentNo?: string;
  paymentDate?: string;
  paymentStatus?: string;
  totalAmount?: number;
  receivedAmount?: number;
  returnAmount?: number;
  dueAmount?: number;
  note?: string;
  saleId?: number;
  saleNo?: string;
  saleReference?: string;
  storeId?: number;
  storeName?: string;
  customerId?: number;
  customerName?: string;
  userId?: number;
  cashierName?: string;
  paymentMethods?: string;
  bankNames?: string;
  totalLinesCount?: number;
}

export interface SalePaymentSummaryResponse {
  totalAmount?: number;
  totalReceivedAmount?: number;
  totalReturnAmount?: number;
  totalDueAmount?: number;
  totalTransactions?: number;
  storeId?: number;
  storeName?: string;
  customerId?: number;
  customerName?: string;
  startDate?: string;
  endDate?: string;
  payments?: SalePaymentReportResponse[];
}

export interface PurchasePaymentReportResponse {
  paymentId?: number;
  paymentNo?: string;
  paymentDate?: string;
  paymentStatus?: string;
  totalAmount?: number;
  receivedAmount?: number;
  returnAmount?: number;
  dueAmount?: number;
  note?: string;
  purchaseId?: number;
  purchaseReferenceNo?: string;
  storeId?: number;
  storeName?: string;
  supplierId?: number;
  supplierName?: string;
  userId?: number;
  createdByUser?: string;
  paymentMethods?: string;
  bankNames?: string;
  totalLinesCount?: number;
}

export interface PurchasePaymentSummaryResponse {
  totalAmount?: number;
  totalReceivedAmount?: number;
  totalReturnAmount?: number;
  totalDueAmount?: number;
  totalTransactions?: number;
  storeId?: number;
  storeName?: string;
  supplierId?: number;
  supplierName?: string;
  startDate?: string;
  endDate?: string;
  payments?: PurchasePaymentReportResponse[];
}
