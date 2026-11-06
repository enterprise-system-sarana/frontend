import type { PageFilter } from "@/types/pagination";

export interface BankReportFilter extends PageFilter {
  startDate?: string;
  endDate?: string;
  bankId?: number;
  transactionType?: string;
  flowType?: string;
  search?: string;
}

export interface BankReportResponse {
  transactionId: number;
  bankId: number;
  bankName: string;
  accountName: string;
  accountNumber: string;
  bankCurrentBalance: number;
  amount: number;
  transactionType: "SALE" | "PURCHASE" | "EXPENSE" | string;
  transactionReference: string;
  transactionStatus: string;
  transactionDate: string;
  description: string;
  saleId?: number;
  saleNo?: string;
  saleReference?: string;
  purchaseId?: number;
  purchaseReferenceNo?: string;
  expenseId?: number;
  expenseReference?: string;
  flowType: "IN" | "OUT" | string;
  createdAt: string;
}

export interface BankReportSummaryResponse {
  totalInflow: number;
  totalOutflow: number;
  netFlow: number;
  totalTransactions: number;
  currentTotalBalance: number;
  transactions?: BankReportResponse[];
}

