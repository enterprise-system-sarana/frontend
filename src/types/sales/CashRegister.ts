import type { BaseResponse, PageFilter } from "../pagination";

export interface CashRegisterResponse extends BaseResponse {
  id: number;
  registerNo: string;
  storeId: number;
  storeName: string;
  userId: number;
  userName: string;
  userProfileImage?: string | null;
  openingBalance: number;
  closingBalance?: number | null;
  expectedBalance?: number | null;
  totalSales: number;
  totalCashSales?: number | null;
  totalBankSales?: number | null;
  totalReturns: number;
  totalCashIn: number;
  totalCashOut: number;
  difference?: number | null;
  saleCount: number;
  status: "OPEN" | "CLOSED" | string;
  openedAt: string;
  closedAt?: string | null;
  closingNote?: string | null;
}

export interface OpenCashRegisterRequest {
  storeId: number;
  openingBalance: number;
}

export interface CloseCashRegisterRequest {
  closingBalance: number;
  closingNote?: string;
}

export interface CashRegisterFilter extends PageFilter {
  search?: string;
  storeId?: number;
  userId?: number;
  status?: string;
  startDate?: string;
  endDate?: string;
}

export const CashRegisterStatus = {
  OPEN: "OPEN",
  CLOSED: "CLOSED",
} as const;

