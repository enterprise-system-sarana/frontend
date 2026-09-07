import type { BaseResponse, PageFilter } from "../pagination";

export interface ProductSerialResponse extends BaseResponse {
  id: number;
  productId: number;
  productName?: string;
  storeId?: number;
  storeName?: string;
  barcode: string;
  price: number;
  cost?: number;
  quantity: number;
  status: "AVAILABLE" | "SOLD" | "DAMAGED" | "RETURNED" | string;
}

export interface ProductSerialFilter extends PageFilter {
  barcode?: string;
  productId?: number;
  storeId?: number;
  status?: string;
}