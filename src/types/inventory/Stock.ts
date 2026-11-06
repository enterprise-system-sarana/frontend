import type { BaseResponse, PageFilter } from "../pagination";

export interface StockResponse extends BaseResponse {
    productId: number;
    productName: string;
    modelId?: number;
    modelName?: string;
    brandId?: number;
    brandName?: string;
    categoryId?: number;
    categoryName?: string;
    storeId: number;
    storeName: string;
    quantity: number;
    alertQuantity: number;
    reorderLevel: number;
    status?: string;
}

export interface StockFilter extends PageFilter {
    productId?: number;
    modelId?: number;
    brandId?: number;
    categoryId?: number;
    storeId?: number;
    status?: string;
    search?: string;
}
