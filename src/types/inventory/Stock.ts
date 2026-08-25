import type { BaseResponse, PageFilter } from "../pagination";

export interface StockResponse extends BaseResponse {
    productId: number;
    productName: string;
    storeId: number;
    storeName: string;
    quantity: number;
    alertQuantity: number;
    reorderLevel: number;
}


export interface StockFilter extends PageFilter {
    productId?: number;
    storeId?: number;
}