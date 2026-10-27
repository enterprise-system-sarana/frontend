import type { PageFilter } from '@/types/pagination';

export interface PurchaseReportFilter extends PageFilter {
  startDate?: string;
  endDate?: string;
  storeId?: number;
  supplierId?: number;
  productId?: number;
  status?: string;
  paymentStatus?: string;
}

export interface PurchaseItemDetail {
  purchaseId?: number;
  referenceNo?: string;
  purchaseDate?: string;
  status?: string;
  paymentStatus?: string;
  total?: number;
  discount?: number;
  grandTotal?: number;
  paidAmount?: number;
  dueAmount?: number;
  storeId?: number;
  storeName?: string;
  supplierId?: number;
  supplierName?: string;
  bankId?: number;
  bankName?: string;
  totalItemsCount?: number;
  totalQuantity?: number;
}

export interface PurchaseReportResponse {
  totalAmount?: number;
  totalDiscount?: number;
  totalPaidAmount?: number;
  totalDueAmount?: number;
  totalQuantity?: number;
  totalTransactions?: number;
  storeId?: number;
  storeName?: string;
  supplierId?: number;
  supplierName?: string;
  startDate?: string;
  endDate?: string;
  purchases?: PurchaseItemDetail[];
}

export interface PurchaseItemReportResponse {
  itemId?: number;
  purchaseId?: number;
  referenceNo?: string;
  purchaseDate?: string;
  purchaseStatus?: string;
  paymentStatus?: string;
  storeId?: number;
  storeName?: string;
  supplierId?: number;
  supplierName?: string;
  productId?: number;
  productName?: string;
  productCode?: string;
  quantity?: number;
  unitCost?: number;
  unitPrice?: number;
  subtotal?: number;
}
