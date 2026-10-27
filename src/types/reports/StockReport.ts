import type { PageFilter } from "@/types/pagination";

export interface StockItemReportResponse {
  stockId?: number;
  productId?: number;
  productCode?: string;
  productName?: string;
  imageUrl?: string;
  productStatus?: string;
  hasSerial?: boolean;
  modelId?: number;
  modelName?: string;
  brandId?: number;
  brandName?: string;
  categoryId?: number;
  categoryName?: string;
  storeId?: number;
  storeName?: string;
  storeCode?: string;
  variantValueId?: number;
  variantValueName?: string;
  currentQuantity?: number;
  alertQuantity?: number;
  reorderLevel?: number;
  costPrice?: number;
  salePrice?: number;
  totalCostValue?: number;
  totalSaleValue?: number;
  potentialProfit?: number;
  marginPercentage?: number;
  stockStatus?: "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK" | string;
  availableSerialsCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface StockMovementItemResponse {
  transactionId?: number;
  productId?: number;
  productCode?: string;
  productName?: string;
  imageUrl?: string;
  modelName?: string;
  brandName?: string;
  categoryName?: string;
  storeId?: number;
  storeName?: string;
  storeCode?: string;
  quantity?: number;
  transactionType?: "IN" | "OUT" | "ADJUSTMENT" | "SALE" | "PURCHASE" | "RETURN" | string;
  referenceId?: number;
  transactionDate?: string;
  notes?: string;
  createdAt?: string;
  createdBy?: string;
}

export interface StockReportSummaryProjection {
  totalProducts?: number;
  totalQuantity?: number;
  totalCostValue?: number;
  totalSaleValue?: number;
  potentialProfit?: number;
  averageMargin?: number;
  inStockCount?: number;
  lowStockCount?: number;
  outOfStockCount?: number;
}

export interface StockReportFilter extends PageFilter {
  storeId?: number;
  productId?: number;
  categoryId?: number;
  brandId?: number;
  modelId?: number;
  stockStatus?: string;
  hasSerial?: boolean;
  search?: string;
}

export interface StockMovementReportFilter extends PageFilter {
  storeId?: number;
  productId?: number;
  transactionType?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
}

export interface StockReportResponse {
  summary?: StockReportSummaryProjection;
  items?: StockItemReportResponse[];
}
