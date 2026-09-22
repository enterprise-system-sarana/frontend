import type { BaseResponse, PageFilter } from "../pagination";
import { validateString } from "../validator";
import { z } from "zod";

export interface PaymentResponse extends BaseResponse {
    id : number ;
    paymentNo : string ; 
    paymentMethod : string ; 
    bankId : number ; 
    bankName :string ; 
    saleId : number ; 
    saleNo : string ; 
    purchaseId: number ; 
    userId : number ;
    userName : string;
    amount : number ; 
    transactionNo : string ; 
    paymentDate : Date | string;
    status : string ; 
}

export interface PaymentRequest {
    paymentNo: string;
    paymentMethod: string;
    bankId?: number | null;
    saleId?: number | null;
    purchaseId?: number | null;
    userId?: number;
    amount: number;
    transactionNo?: string | null;
    paymentDate?: string;
    status?: string;
}

export const PaymentSchema ={
    // paymentNo : validateString("Payment No"),
    paymentMethod :z.string(),
    bankId : z.number().optional(),
    saleId : z.number().optional(),
    purchaseId : z.number().optional(),
    userId : z.number().optional(),
    amount : z.number().positive("Amount must be greater than zero"),
    transactionNo : z.string().optional(),
    // paymentDate : z.string().optional(),
    status : z.string().optional(),
}

export interface PaymentFilter extends PageFilter {
    saleId?: number;
    paymentNo?:number ;
    userId?: number;
    bankId?: number;
}
