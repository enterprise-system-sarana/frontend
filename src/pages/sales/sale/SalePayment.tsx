// import React, { useState, useMemo, useEffect, useCallback } from "react";
// import { useNavigate, useParams } from "react-router-dom";
// import {
//   ArrowLeft,
//   Banknote,
//   Calendar,
//   CheckCircle2,
//   History,
//   Loader2,
//   Printer,
//   Receipt,
//   // RotateCcw,
//   ShieldCheck,
//   ShoppingBag,
//   User,
//   WalletCards,
//   AlertCircle,
// } from "lucide-react";
// import { toast } from "sonner";

// import { Button } from "@/components/ui/button";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Badge } from "@/components/ui/badge";
// import { StatusBadge } from "@/components/ui/status-badge";
// import { ROUTERS } from "@/constants/Route";

// import { useSale } from "@/hooks/sales/useSale";
// import { usePayment } from "@/hooks/sales/usePayment";
// import { useBank } from "@/hooks/finance/useBank";
// import { useCashRegister } from "@/hooks/sales/useCashRegister";

// import {
//   PaymentMethod,
//   PaymentItemStatus,
//   // PaymentStatus,
//   type PaymentItemRequest,
//   type RecordPaymentRequest,
//   type PaymentResponse,
//   // PaymentItemSchema,
// } from "@/types/sales/Payment";
// import type { SaleResponse } from "@/types/sales/Sale";

// // import { PaymentMethodsForm } from "../payment/components/PaymentMethodsForm";
// // import { PaymentSummary } from "../payment/components/PaymentSummary";
// import type { PaymentRowItem } from "../payment/PaymentForm";
// import PrintBillModal, { type BillData } from "./components/PrintBillModal";

// export const SalePaymentPage: React.FC = () => {
//   const { id } = useParams<{ id: string }>();
//   const navigate = useNavigate();
//   const saleId = Number(id);

//   // Queries
//   const {
//     data: saleData,
//     isLoading: isSaleLoading,
//     isError: isSaleError,
//     refetch: refetchSale,
//   } = useSale.GetSaleById(saleId, { enabled: Boolean(saleId > 0) });

//   const {
//     data: summaryData,
//     isLoading: isSummaryLoading,
//     refetch: refetchSummary,
//   } = usePayment.getSalePaymentSummary(saleId, { enabled: Boolean(saleId > 0) });

//   const {
//     data: historyData,
//     isLoading: isHistoryLoading,
//     refetch: refetchHistory,
//   } = usePayment.getPaymentsBySaleId(saleId, { enabled: Boolean(saleId > 0) });

//   const { data: bankData } = useBank.useGetAllBank({ page: 1, size: 100 });
//   const { data: currentRegisterData } = useCashRegister.GetCurrent();

//   // Mutations
//   const recordPaymentsMutation = usePayment.recordPayments();
//   const voidPaymentMutation = usePayment.voidPayment();
//   const verifyPaymentMutation = usePayment.verifyPayment();
//   const closeSaleMutation = useSale.CloseSale();

//   // State
//   const [verifyingPaymentId, setVerifyingPaymentId] = useState<number | null>(null);
//   const [isPrintBillOpen, setIsPrintBillOpen] = useState(false);
//   const [rowErrors, setRowErrors] = useState<Record<number, Record<string, string>>>({});
//   const [isSubmitting, setIsSubmitting] = useState(false);

//   // Unpack responses
//   const sale: SaleResponse | undefined =
//     saleData?.payload?.data || saleData?.payload || saleData?.data;

//   const paymentSummary =
//     summaryData?.payload?.data || summaryData?.payload || summaryData?.data;

//   const paymentHistory: PaymentResponse[] =
//     (historyData?.payload?.data ||
//       historyData?.payload ||
//       historyData?.data ||
//       paymentSummary?.payments ||
//       []) as PaymentResponse[];

//   const banks = bankData?.payload?.data || [];

//   // Authoritative financial totals
//   const grandTotal = Number(paymentSummary?.grandTotal ?? sale?.grandTotal ?? 0);
//   const previouslyPaid = Number(
//     paymentSummary?.previouslyPaidAmount ??
//     sale?.paidAmount ??
//     paymentHistory
//       .filter(
//         (p) =>
//           (p.status || "").toUpperCase() === "COMPLETED" ||
//           (p.status || "").toUpperCase() === "PAID"
//       )
//       .reduce((sum, p) => sum + (Number(p.amount) || 0), 0)
//   );

//   const outstandingBalance = Math.max(0, grandTotal - previouslyPaid);
//   const currentPaymentStatus =
//     paymentSummary?.paymentStatus || sale?.paymentStatus || "UNPAID";
//   const currentSaleStatus =
//     paymentSummary?.saleStatus || sale?.status || "PENDING";

//   // Form rows state
//   const [rows, setRows] = useState<PaymentRowItem[]>([
//     {
//       id: "initial-row",
//       paymentMethod: PaymentMethod.Cash,
//       amount: outstandingBalance > 0 ? Number(outstandingBalance.toFixed(2)) : "",
//       bankAccountId: null,
//       transactionNo: "",
//       note: "",
//       status: PaymentItemStatus.Completed,
//     },
//   ]);

//   // Sync initial outstanding balance into form row when data first loads
//   useEffect(() => {
//     if (outstandingBalance > 0 && rows.length === 1 && rows[0].amount === "") {
//       setRows([
//         {
//           ...rows[0],
//           amount: Number(outstandingBalance.toFixed(2)),
//         },
//       ]);
//     }
//   }, [outstandingBalance]);

//   // Calculations for current form rows
//   const currentPaymentTotal = rows.reduce(
//     (sum, r) => sum + (Number(r.amount) || 0),
//     0
//   );

//   const pendingSlipTotal = rows
//     .filter((r) => r.status === PaymentItemStatus.Pending)
//     .reduce((sum, r) => sum + (Number(r.amount) || 0), 0);

//   const isOverpayment = currentPaymentTotal > outstandingBalance + 0.0001;
//   const isRemainingZero = outstandingBalance <= 0.0001;

//   // Validate form rows
//   const validateRows = useCallback((): boolean => {
//     const newErrors: Record<number, Record<string, string>> = {};
//     let isValid = true;

//     if (rows.length === 0) {
//       toast.error("Please add at least one payment method");
//       return false;
//     }

//     if (currentPaymentTotal <= 0) {
//       toast.error("Total payment amount must be greater than zero");
//       return false;
//     }

//     if (isOverpayment) {
//       toast.error(
//         `Total payment ($${currentPaymentTotal.toFixed(
//           2
//         )}) cannot exceed remaining balance ($${outstandingBalance.toFixed(2)})`
//       );
//       return false;
//     }

//     rows.forEach((row, idx) => {
//       const fieldErrors: Record<string, string> = {};
//       const numAmount = Number(row.amount);

//       if (isNaN(numAmount) || numAmount <= 0) {
//         fieldErrors.amount = "Amount must be greater than 0";
//         isValid = false;
//       }

//       const isBank =
//         row.paymentMethod === PaymentMethod.Aba ||
//         row.paymentMethod === PaymentMethod.BankTransfer;

//       if (isBank) {
//         if (!row.bankAccountId) {
//           fieldErrors.bankAccountId = "Please select receiving bank account";
//           isValid = false;
//         }
//         if (!row.transactionNo || row.transactionNo.trim().length === 0) {
//           fieldErrors.transactionNo =
//             "Transaction reference number is required for bank payments";
//           isValid = false;
//         }
//       }

//       if (Object.keys(fieldErrors).length > 0) {
//         newErrors[idx] = fieldErrors;
//       }
//     });

//     setRowErrors(newErrors);
//     return isValid;
//   }, [rows, currentPaymentTotal, isOverpayment, outstandingBalance]);

//   // Handle Submit Payment Batch
//   const handleRecordPayments = async () => {
//     if (!validateRows()) return;
//     if (isSubmitting) return;

//     try {
//       setIsSubmitting(true);

//       const paymentItems: PaymentItemRequest[] = rows.map((r) => ({
//         paymentMethod: r.paymentMethod,
//         amount: Number(Number(r.amount).toFixed(2)),
//         bankAccountId: r.bankAccountId || null,
//         transactionNo: r.transactionNo?.trim() || null,
//         note: r.note?.trim() || null,
//         status: r.status,
//       }));

//       const nextRemaining = Math.max(0, outstandingBalance - currentPaymentTotal);

//       const payload: RecordPaymentRequest = {
//         saleId,
//         idempotencyKey: `IDEM-SALE-${saleId}-${Date.now()}`,
//         totalAmount: outstandingBalance,
//         receivedAmount: currentPaymentTotal,
//         returnAmount: isOverpayment ? currentPaymentTotal - outstandingBalance : 0,
//         dueAmount: nextRemaining,
//         paymentDate: new Date().toISOString(),
//         status: nextRemaining <= 0 ? "PAID" : "PARTIAL",
//         paymentLines: paymentItems,
//         payments: paymentItems,
//       };

//       const res: any = await recordPaymentsMutation.mutateAsync(payload);

//       toast.success(
//         res?.message || "Payments recorded and ledger updated successfully!"
//       );

//       // Refresh authoritative data
//       await Promise.all([refetchSale(), refetchSummary(), refetchHistory()]);

//       // Reset payment rows to remaining balance or empty
//       setRows([
//         {
//           id: `row-${Date.now()}`,
//           paymentMethod: PaymentMethod.Cash,
//           amount: nextRemaining > 0 ? Number(nextRemaining.toFixed(2)) : "",
//           bankAccountId: null,
//           transactionNo: "",
//           note: "",
//           status: PaymentItemStatus.Completed,
//         },
//       ]);
//       setRowErrors({});
//     } catch (err: any) {
//       const msg =
//         err?.response?.data?.message ||
//         err?.message ||
//         "Failed to submit payment";
//       toast.error(msg);
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   // Handle Close Sale
//   const handleCloseSale = async () => {
//     if (isSubmitting) return;
//     try {
//       setIsSubmitting(true);
//       await closeSaleMutation.mutateAsync(saleId);
//       toast.success("Sale completed and inventory finalized successfully!");
//       await Promise.all([refetchSale(), refetchSummary()]);
//     } catch (err: any) {
//       const msg =
//         err?.response?.data?.message || err?.message || "Failed to close sale";
//       toast.error(msg);
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   // Handle Verify Payment Slip
//   // const handleVerifyPayment = async (paymentId: number) => {
//   //   try {
//   //     setVerifyingPaymentId(paymentId);
//   //     await verifyPaymentMutation.mutateAsync(paymentId);
//   //     toast.success("Bank payment slip verified and posted to sale balance!");
//   //     await Promise.all([refetchSale(), refetchSummary(), refetchHistory()]);
//   //   } catch (err: any) {
//   //     const msg =
//   //       err?.response?.data?.message ||
//   //       err?.message ||
//   //       "Verification failed";
//   //     toast.error(msg);
//   //   } finally {
//   //     setVerifyingPaymentId(null);
//   //   }
//   // };

//   // Handle Void Payment

//   // Bill Data for Receipt modal
//   const billData: BillData | null = useMemo(() => {
//     if (!sale) return null;
//     return {
//       reference: sale.reference || `SL-${sale.id}`,
//       date: (sale as any).saleDate || (sale as any).date || new Date().toISOString(),
//       customerName: sale.customerName || "Walk-in Customer",
//       items: (sale.items || []).map((it: any) => ({
//         productName: it.productName || `Item #${it.productId}`,
//         price: it.price,
//         quantity: it.quantity,
//         subtotal: it.subtotal,
//       })),
//       subtotal: (sale as any).totalAmount || sale.grandTotal,
//       discount: sale.discount || 0,
//       grandTotal: sale.grandTotal,
//     };
//   }, [sale, previouslyPaid, outstandingBalance, currentPaymentStatus]);

//   if (isSaleLoading || isSummaryLoading) {
//     return (
//       <div className="flex min-h-[500px] flex-col items-center justify-center py-20 text-muted-foreground">
//         <Loader2 className="size-8 animate-spin text-primary mb-3" />
//         <p className="text-sm font-semibold text-text-secondary">
//           Loading sale and payment information...
//         </p>
//       </div>
//     );
//   }

//   if (isSaleError || !sale) {
//     return (
//       <div className="mx-auto max-w-xl py-20 text-center">
//         <div className="mx-auto size-12 rounded-2xl bg-destructive/10 p-3 text-destructive mb-3 flex items-center justify-center">
//           <AlertCircle className="size-6" />
//         </div>
//         <h2 className="text-lg font-bold text-foreground">
//           Sale Not Found or Ineligible
//         </h2>
//         <p className="mt-1 text-xs text-muted-foreground">
//           Could not retrieve sale #{saleId}. It may have been deleted or an invalid ID was requested.
//         </p>
//         <Button
//           onClick={() => navigate(ROUTERS.SALE)}
//           variant="outline"
//           className="mt-4 rounded-xl text-xs h-9 cursor-pointer"
//         >
//           <ArrowLeft className="size-3.5 mr-1.5" />
//           <span>Back to Sales List</span>
//         </Button>
//       </div>
//     );
//   }

//   const isSaleCompleted = currentSaleStatus.toUpperCase() === "COMPLETED";

//   return (
//     <div className="space-y-6 pb-12">
//       {/* 1. Page Header with Compact Breadcrumb & Quick Actions */}
//       <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-card p-4 shadow-2xs">
//         <div className="flex items-center gap-3">
//           <Button
//             type="button"
//             variant="outline"
//             size="icon"
//             onClick={() => navigate(ROUTERS.SALE)}
//             className="size-9 rounded-xl border-border hover:bg-muted cursor-pointer"
//             title="Back to Sales"
//           >
//             <ArrowLeft className="size-4 text-text-secondary" />
//           </Button>

//           <div>
//             <div className="flex items-center gap-2">
//               <h1 className="text-lg font-bold text-foreground flex items-center gap-2">
//                 <WalletCards className="size-5 text-primary" />
//                 <span>Close Sale & Payment Management</span>
//               </h1>
//               <Badge
//                 variant="outline"
//                 className="tabular-nums text-[12px] px-2 py-0.5 bg-primary-light text-primary border-primary/20"
//               >
//                 #{sale.reference || sale.no || `SALE-${sale.id}`}
//               </Badge>
//             </div>
//             <p className="text-xs text-muted-foreground mt-0.5">
//               Review sale balance, record multiple split payment methods, and close out the sale.
//             </p>
//           </div>
//         </div>

//         <div className="flex items-center gap-2">
//           {billData && (
//             <Button
//               type="button"
//               variant="outline"
//               size="sm"
//               onClick={() => setIsPrintBillOpen(true)}
//               className="h-9 rounded-xl border-border text-xs font-semibold hover:bg-muted/50 cursor-pointer gap-1.5"
//             >
//               <Printer className="size-3.5 text-muted-foreground" />
//               <span>Print Bill</span>
//             </Button>
//           )}

//           <Button
//             type="button"
//             variant="outline"
//             size="sm"
//             onClick={() =>
//               navigate(ROUTERS.SALE_INVOICE.replace(":id", String(saleId)))
//             }
//             className="h-9 rounded-xl border-border text-xs font-semibold hover:bg-muted/50 cursor-pointer gap-1.5"
//           >
//             <Receipt className="size-3.5 text-primary" />
//             <span>Full Invoice</span>
//           </Button>
//         </div>
//       </div>

//       {/* 2. Sale Info Header Summary Card */}
//       <Card className="rounded-2xl border-border bg-card shadow-2xs">
//         <CardContent className="p-4 sm:p-5">
//           <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6 text-xs">
//             {/* Order Ref */}
//             <div>
//               <p className="text-[12px] text-muted-foreground uppercase font-semibold">
//                 Sale Reference
//               </p>
//               <p className="mt-1 tabular-nums font-bold text-foreground">
//                 {sale.reference || sale.no || `SALE-${sale.id}`}
//               </p>
//             </div>

//             {/* Date */}
//             <div>
//               <p className="text-[12px] text-muted-foreground uppercase font-semibold flex items-center gap-1">
//                 <Calendar className="size-3" />
//                 <span>Sale Date</span>
//               </p>
//               <p className="mt-1 font-medium text-foreground">
//                 {sale.saleDate || sale.date || (sale.createdAt ? String(sale.createdAt).split("T")[0] : "-")}
//               </p>
//             </div>

//             {/* Customer */}
//             <div>
//               <p className="text-[12px] text-muted-foreground uppercase font-semibold flex items-center gap-1">
//                 <User className="size-3" />
//                 <span>Customer</span>
//               </p>
//               <p className="mt-1 font-semibold text-foreground">
//                 {sale.customerName || "Walk-in Customer"}
//               </p>
//             </div>

//             {/* Store & Items */}
//             <div>
//               <p className="text-[12px] text-muted-foreground uppercase font-semibold flex items-center gap-1">
//                 <ShoppingBag className="size-3" />
//                 <span>Store & Items</span>
//               </p>
//               <p className="mt-1 font-medium text-foreground">
//                 {sale.storeName || "Store"} ({(sale.items || []).length} items)
//               </p>
//             </div>

//             {/* Sale Status */}
//             <div>
//               <p className="text-[12px] text-muted-foreground uppercase font-semibold">
//                 Sale Status
//               </p>
//               <div className="mt-1">
//                 <StatusBadge status={currentSaleStatus} />
//               </div>
//             </div>

//             {/* Payment Status */}
//             <div>
//               <p className="text-[12px] text-muted-foreground uppercase font-semibold">
//                 Payment Status
//               </p>
//               <div className="mt-1">
//                 <Badge
//                   variant="outline"
//                   className={`text-[11px] px-2 py-0.5 uppercase ${currentPaymentStatus === "PAID"
//                     ? "bg-success/10 text-success border-success/20"
//                     : currentPaymentStatus === "PARTIAL"
//                       ? "bg-warning/10 text-warning-text border-warning/20"
//                       : "bg-muted text-foreground border-border-strong"
//                     }`}
//                 >
//                   {currentPaymentStatus}
//                 </Badge>
//               </div>
//             </div>
//           </div>
//         </CardContent>
//       </Card>

//       {/* 3. Authoritative Live Payment Summary */}
//       {/* <PaymentSummary
//         grandTotal={grandTotal}
//         previouslyPaid={previouslyPaid}
//         currentPaymentTotal={currentPaymentTotal}
//         pendingPaymentTotal={pendingSlipTotal}
//       /> */}

//       {/* 4. Split Payment Entry Card */}
//       <Card className="rounded-2xl border-border bg-card shadow-2xs">
//         <CardHeader className="border-b border-border px-5 py-3.5">
//           <div className="flex flex-wrap items-center justify-between gap-2">
//             <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
//               <Banknote className="size-4 text-success" />
//               <span>Record Payment (ការទូទាត់ប្រាក់ - បង់ច្រើនវិធីសាស្ត្រ)</span>
//             </CardTitle>

//             <span className="text-[12px] font-medium text-muted-foreground">
//               Outstanding:{" "}
//               <span className="tabular-nums font-bold text-primary">
//                 ${outstandingBalance.toFixed(2)}
//               </span>
//             </span>
//           </div>
//         </CardHeader>

//         <CardContent className="p-5 space-y-5">
//           {/* Form Rows */}
//           {/* <PaymentMethodsForm
//             rows={rows}
//             banks={banks}
//             outstandingBalance={outstandingBalance}
//             rowErrors={rowErrors}
//             onChangeRows={setRows}
//             disabled={isSubmitting || isRemainingZero}
//           /> */}

//           {isRemainingZero && (
//             <div className="flex items-center gap-2 rounded-xl border border-success/20 bg-success/10 p-3 text-xs text-success">
//               <CheckCircle2 className="size-4 text-success" />
//               <span>
//                 This sale is already fully paid! No additional payment is required.
//               </span>
//             </div>
//           )}

//           {/* Action Submission Footer */}
//           <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
//             <Button
//               type="button"
//               variant="outline"
//               onClick={() => navigate(ROUTERS.SALE)}
//               disabled={isSubmitting}
//               className="h-10 rounded-xl text-xs font-semibold px-4 cursor-pointer"
//             >
//               Cancel / Back to Sales
//             </Button>

//             <div className="flex flex-wrap items-center gap-2">
//               {!isSaleCompleted && (
//                 <Button
//                   type="button"
//                   variant="outline"
//                   onClick={handleCloseSale}
//                   disabled={isSubmitting}
//                   className="h-10 rounded-xl border-border-strong text-xs font-semibold hover:bg-muted cursor-pointer gap-1.5"
//                 >
//                   <ShieldCheck className="size-4 text-text-secondary" />
//                   <span>Finalize & Close Sale</span>
//                 </Button>
//               )}

//               <Button
//                 type="button"
//                 onClick={handleRecordPayments}
//                 disabled={
//                   isSubmitting ||
//                   isOverpayment ||
//                   currentPaymentTotal <= 0 ||
//                   isRemainingZero
//                 }
//                 className="h-10 rounded-xl bg-primary px-5 text-xs font-bold text-white hover:bg-primary-hover cursor-pointer transition-all shadow-xs disabled:opacity-50"
//               >
//                 {isSubmitting ? (
//                   <>
//                     <Loader2 className="mr-1.5 size-4 animate-spin" />
//                     <span>Processing Payment...</span>
//                   </>
//                 ) : (
//                   <>
//                     <CheckCircle2 className="mr-1.5 size-4" />
//                     <span>
//                       Record Payment (${currentPaymentTotal.toFixed(2)})
//                     </span>
//                   </>
//                 )}
//               </Button>
//             </div>
//           </div>
//         </CardContent>
//       </Card>

//       {/* 5. Authoritative Payment History Table Card */}
//       <Card className="rounded-2xl border-border bg-card shadow-2xs">
//         <CardHeader className="border-b border-border px-5 py-3.5">
//           <div className="flex items-center justify-between">
//             <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
//               <History className="size-4 text-primary" />
//               <span>Payment History & Audit Trail</span>
//             </CardTitle>
//             <span className="text-[12px] text-muted-foreground font-medium">
//               {paymentHistory.length} transaction(s) recorded
//             </span>
//           </div>
//         </CardHeader>

//         {/* <CardContent className="p-5">
//           <PaymentHistoryTable
//             payments={paymentHistory}
//             isLoading={isHistoryLoading}
//             canVoid={true}
//             canVerify={true}
//             onVerifyPayment={handleVerifyPayment}
//             onVoidPayment={handleVoidPayment}
//             isVerifyingId={verifyingPaymentId}
//             isVoiding={voidPaymentMutation.isPending}
//           />
//         </CardContent> */}
//       </Card>

//       {/* 6. Print Bill Modal */}
//       <PrintBillModal
//         open={isPrintBillOpen}
//         onOpenChange={setIsPrintBillOpen}
//         billData={billData}
//       />
//     </div>
//   );
// };
// export default SalePaymentPage;
