// import { useState, useMemo } from "react";
// import { useParams, useNavigate } from "react-router-dom";
// import { useSale } from "@/hooks/sales/useSale";
// import { useCustomer } from "@/hooks/sales/useCustomer";
// import { useProductSerial } from "@/hooks/product/useProductSerial";
// import { ROUTERS } from "@/constants/Route";
// import { usePermission } from "@/utils/UsePermission";
// import { PERMISSION } from "@/constants/Permission";
// import { formatDate } from "@/utils/formatDate";
// import type { SaleResponse } from "@/types/sales/Sale";

// import { Button } from "@/components/ui/button";
// import ConfirmDelete from "@/components/ui/confirmDelete";
// import PosReceiptModal, { type PosReceiptData } from "./components/PosReceiptModal";
// import { Hash, ArrowLeft } from "lucide-react";
// import { toast } from "sonner";

// function formatCurrency(val: number) {
//   return new Intl.NumberFormat("en-US", {
//     style: "currency",
//     currency: "USD",
//   }).format(Number(val) || 0);
// }

// export default function SaleDetail() {
//   const { id } = useParams<{ id: string }>();
//   const navigate = useNavigate();
//   const { Can } = usePermission();

//   const canUpdate = Can(PERMISSION.SALE.UPDATE);
//   const canDelete = Can(PERMISSION.SALE.DELETE);

//   const saleId = Number(id);
//   const isValidId = Boolean(id && !isNaN(saleId) && saleId > 0);

//   const { data, isLoading, isError } = useSale.GetSaleById(saleId, {
//     enabled: isValidId,
//   });

//   const { data: customerData } = useCustomer.useGetAllCustomer({
//     page: 1,
//     size: 200,
//   });

//   const { data: serialsData } = useProductSerial.useGetAllProductSerial(
//     { page: 1, size: 1000 },
//     { enabled: isValidId }
//   );

//   const { mutate: completeSaleMutate, isPending: isCompleting } = useSale.Complete();
//   const { mutate: deleteSaleMutate } = useSale.Delete();

//   const [openConfirmDelete, setOpenConfirmDelete] = useState(false);
//   const [isReceiptOpen, setIsReceiptOpen] = useState(false);

//   const sale: SaleResponse | undefined =
//     data?.payload?.data || data?.payload || data?.data || data;

//   // Lookup matched customer info for address, email, phone
//   const customerList = customerData?.payload?.data || [];
//   const matchedCustomer = useMemo(() => {
//     if (!sale?.customerId) return null;
//     return customerList.find((c: any) => c.id === sale.customerId) || null;
//   }, [customerList, sale?.customerId]);

//   // Serial lookup map
//   const serialLookup = useMemo(() => {
//     const map = new Map<number, string>();
//     const list =
//       (serialsData as any)?.payload?.data ??
//       (serialsData as any)?.payload?.content ??
//       (serialsData as any)?.payload?.items ??
//       (serialsData as any)?.payload ??
//       [];

//     if (Array.isArray(list)) {
//       for (const s of list) {
//         if (s?.id) {
//           map.set(
//             s.id,
//             s.serialNumber ?? s.serial_number ?? s.barcode ?? `SN-${s.id}`
//           );
//         }
//       }
//     }
//     return map;
//   }, [serialsData]);

//   const handleComplete = () => {
//     if (!sale?.id) return;
//     completeSaleMutate(sale.id, {
//       onSuccess: () => toast.success("Sale completed successfully"),
//       onError: (err: any) =>
//         toast.error(err?.response?.data?.message || "Failed to complete sale"),
//     });
//   };

//   const handleDelete = () => {
//     if (!sale?.id) return;
//     deleteSaleMutate(sale.id, {
//       onSuccess: () => {
//         toast.success("Sale deleted successfully");
//         setOpenConfirmDelete(false);
//         navigate(ROUTERS.SALE);
//       },
//       onError: (err: any) => {
//         toast.error(err?.response?.data?.message || "Failed to delete sale");
//       },
//     });
//   };

//   if (!isValidId) {
//     return (
//       <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-6">
//         <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Invalid Sale ID</h2>
//         <p className="text-xs text-muted-foreground mt-1 mb-5">
//           The requested sale transaction could not be located.
//         </p>
//         <Button onClick={() => navigate(ROUTERS.SALE)} variant="outline" size="sm">
//           <ArrowLeft className="size-4 mr-2" />
//           Back to Sales
//         </Button>
//       </div>
//     );
//   }

//   if (isLoading) {
//     return (
//       <div className="max-w-5xl mx-auto p-8 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-6 animate-pulse">
//         <div className="grid grid-cols-3 gap-6">
//           <div className="h-24 bg-slate-100 dark:bg-slate-800 rounded-lg" />
//           <div className="h-24 bg-slate-100 dark:bg-slate-800 rounded-lg" />
//           <div className="h-24 bg-slate-100 dark:bg-slate-800 rounded-lg" />
//         </div>
//         <div className="h-48 bg-slate-100 dark:bg-slate-800 rounded-lg mt-6" />
//       </div>
//     );
//   }

//   if (isError || !sale) {
//     return (
//       <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-6">
//         <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Sale Not Found</h2>
//         <p className="text-xs text-muted-foreground mt-1 mb-5">
//           The sale record may have been deleted or is temporarily unavailable.
//         </p>
//         <Button onClick={() => navigate(ROUTERS.SALE)} variant="outline" size="sm">
//           <ArrowLeft className="size-4 mr-2" />
//           Back to Sales
//         </Button>
//       </div>
//     );
//   }

//   const items = sale.items || [];
//   const statusUpper = (sale.status || "").toUpperCase();
//   const isPending =
//     statusUpper === "PENDING" ||
//     statusUpper === "ACT" ||
//     statusUpper === "ACTIVE";
//   const isPaid = (sale.paymentStatus || "").toUpperCase() === "PAID";

//   const receiptData: PosReceiptData = {
//     reference: sale.reference || `SL-${sale.id}`,
//     saleDate: sale.saleDate || (sale.createdAt ? formatDate(sale.createdAt) : ""),
//     storeName: sale.storeName || "Main Retail Store",
//     customerName: sale.customerName || "Walk-in Customer",
//     items: items.map((it) => ({
//       name: it.productName || `Product #${it.productId}`,
//       price: it.price,
//       quantity: it.quantity,
//       subtotal: it.subtotal,
//       serialNumberCodes: (it.serialNumberIds || []).map(
//         (sId) => serialLookup.get(sId) || `SN #${sId}`
//       ),
//     })),
//     subtotal: sale.totalAmount || sale.grandTotal + (sale.discount || 0),
//     discount: sale.discount || 0,
//     grandTotal: sale.grandTotal || 0,
//     paymentMethod: sale.paymentStatus || "CASH",
//   };

//   return (
//     <div className="max-w-5xl mx-auto pb-12">
//       {/* Top back button */}
//       <div className="mb-4">
//         <Button
//           variant="ghost"
//           size="sm"
//           onClick={() => navigate(ROUTERS.SALE)}
//           className="gap-1.5 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900"
//         >
//           <ArrowLeft className="size-4" />
//           Back to Sales
//         </Button>
//       </div>

//       {/* Main Clean Invoice Sheet */}
//       <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 sm:p-8 shadow-sm space-y-6 text-slate-800 dark:text-slate-100">
//         {/* 1. Header Information Section (3 columns) */}
//         <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pb-6 border-b border-slate-100 dark:border-slate-800">
//           {/* Customer Info */}
//           <div>
//             <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
//               Customer Info
//             </h4>
//             <p className="text-base font-bold text-slate-900 dark:text-white mt-1.5">
//               {sale.customerName || "Walk-in Customer"}
//             </p>
//             <div className="text-xs text-slate-500 dark:text-slate-400 space-y-0.5 mt-1 leading-relaxed">
//               <p>
//                 {matchedCustomer?.note || "3103 Trainer Avenue Peoria, IL 61602"}
//               </p>
//               <p>Email: {matchedCustomer?.email || "customer@example.com"}</p>
//               <p>Phone: {matchedCustomer?.phone || "+1 987 471 6589"}</p>
//             </div>
//           </div>

//           {/* Company Info */}
//           <div>
//             <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
//               Company Info
//             </h4>
//             <p className="text-base font-bold text-slate-900 dark:text-white mt-1.5">
//               {sale.storeName || "DGT"}
//             </p>
//             <div className="text-xs text-slate-500 dark:text-slate-400 space-y-0.5 mt-1 leading-relaxed">
//               <p>2077 Chicago Avenue Orosi, CA 93647</p>
//               <p>Email: admin@example.com</p>
//               <p>Phone: +1 893 174 0385</p>
//             </div>
//           </div>

//           {/* Invoice Info */}
//           <div>
//             <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
//               Invoice Info
//             </h4>
//             <div className="text-xs text-slate-500 dark:text-slate-400 space-y-1.5 mt-1.5">
//               <p>
//                 Reference:{" "}
//                 <span className="font-semibold text-[#f97316]">
//                   #{sale.reference || `SL0101`}
//                 </span>
//               </p>
//               <p>
//                 Date:{" "}
//                 <span className="text-slate-700 dark:text-slate-300">
//                   {sale.saleDate
//                     ? formatDate(sale.saleDate)
//                     : sale.createdAt
//                       ? formatDate(sale.createdAt)
//                       : "Dec 24, 2024"}
//                 </span>
//               </p>
//               <div className="flex items-center gap-1.5">
//                 <span>Status:</span>
//                 <span
//                   className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold text-white ${statusUpper === "COMPLETED"
//                       ? "bg-[#10b981]"
//                       : statusUpper === "PENDING"
//                         ? "bg-amber-500"
//                         : "bg-rose-500"
//                     }`}
//                 >
//                   {sale.status || "Completed"}
//                 </span>
//               </div>
//               <div className="flex items-center gap-1.5">
//                 <span>Payment Status:</span>
//                 <span
//                   className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${isPaid
//                       ? "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800"
//                       : "bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800"
//                     }`}
//                 >
//                   <span
//                     className={`size-1.5 rounded-full inline-block ${isPaid ? "bg-emerald-500" : "bg-amber-500"
//                       }`}
//                   />
//                   {sale.paymentStatus || "Paid"}
//                 </span>
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* 2. Order Summary Title */}
//         <div>
//           <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-3">
//             Order Summary
//           </h3>

//           {/* Products Table */}
//           <div className="overflow-x-auto">
//             <table className="w-full text-left text-xs">
//               <thead className="bg-[#eef2f6] dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs">
//                 <tr>
//                   {/* <th className="py-2.5 px-3">Product</th> */}
//                   <th className="py-2.5 px-3 text-right">Price($)</th>
//                   <th className="py-2.5 px-3 text-center">Qty</th>
//                   <th className="py-2.5 px-3 text-right">Discount($)</th>
//                   <th className="py-2.5 px-3 text-right">Total Cost($)</th>
//                 </tr>
//               </thead>
//               <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
//                 {items.length === 0 ? (
//                   <tr>
//                     <td
//                       colSpan={5}
//                       className="py-6 text-center text-slate-400 italic"
//                     >
//                       No products in this order.
//                     </td>
//                   </tr>
//                 ) : (
//                   items.map((item, idx) => (
//                     <tr
//                       key={idx}
//                       className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
//                     >
//                       <td className="py-3 px-3">
//                         <div className="font-medium text-slate-800 dark:text-slate-100">
//                           {item.productName || `Product #${item.productId}`}
//                         </div>
//                         {item.serialNumberIds &&
//                           item.serialNumberIds.length > 0 && (
//                             <div className="flex items-center gap-1 mt-0.5 flex-wrap">
//                               {item.serialNumberIds.map((sId) => (
//                                 <span
//                                   key={sId}
//                                   className="inline-flex items-center gap-0.5 text-[10px] font-mono text-slate-500 bg-slate-100 dark:bg-slate-800 px-1 py-0.2 rounded border border-slate-200 dark:border-slate-700"
//                                 >
//                                   <Hash className="size-2.5" />
//                                   {serialLookup.get(sId) || `SN-${sId}`}
//                                 </span>
//                               ))}
//                             </div>
//                           )}
//                       </td>
//                       <td className="py-3 px-3 text-right text-slate-600 dark:text-slate-300">
//                         {Number(item.price || 0).toFixed(2)}
//                       </td>
//                       <td className="py-3 px-3 text-center font-medium text-slate-700 dark:text-slate-200">
//                         {item.quantity}
//                       </td>
//                       <td className="py-3 px-3 text-right text-slate-600 dark:text-slate-300">
//                         {Number(item.itemDiscount || 0).toFixed(2)}
//                       </td>
//                       <td className="py-3 px-3 text-right font-medium text-slate-900 dark:text-white">
//                         {Number(item.subtotal || 0).toFixed(2)}
//                       </td>
//                     </tr>
//                   ))
//                 )}
//               </tbody>
//             </table>
//           </div>
//         </div>

//         {/* 3. Totals Summary Table (Bottom Right) */}
//         <div className="flex justify-end pt-2">
//           <div className="w-full sm:w-80 border border-slate-200 dark:border-slate-800 text-xs divide-y divide-slate-200 dark:divide-slate-800">
//             <div className="grid grid-cols-2 p-2.5">
//               <span className="text-slate-600 dark:text-slate-400">
//                 Discount
//               </span>
//               <span className="text-right font-medium text-slate-800 dark:text-slate-200">
//                 {formatCurrency(sale.discount || 0)}
//               </span>
//             </div>
//             <div className="grid grid-cols-2 p-2.5">
//               <span className="text-slate-600 dark:text-slate-400">
//                 Grand Total
//               </span>
//               <span className="text-right font-bold text-slate-900 dark:text-white">
//                 {formatCurrency(sale.grandTotal || 0)}
//               </span>
//             </div>
//             <div className="grid grid-cols-2 p-2.5">
//               <span className="text-slate-600 dark:text-slate-400">
//                 Paid
//               </span>
//               <span className="text-right font-medium text-slate-800 dark:text-slate-200">
//                 {formatCurrency(sale.paidAmount || 0)}
//               </span>
//             </div>
//             <div className="grid grid-cols-2 p-2.5">
//               <span className="text-slate-600 dark:text-slate-400">
//                 Due
//               </span>
//               <span className="text-right font-medium text-slate-800 dark:text-slate-200">
//                 {formatCurrency(sale.dueAmount || 0)}
//               </span>
//             </div>
//           </div>
//         </div>

//         {/* 4. Action Buttons (Cancel / Print / Submit) */}
//         <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-100 dark:border-slate-800">
//           <Button
//             type="button"
//             variant="ghost"
//             onClick={() => navigate(ROUTERS.SALE)}
//             className="bg-[#1e293b] hover:bg-slate-800 text-white px-6 py-2 rounded-lg font-medium text-xs sm:text-sm h-9 cursor-pointer"
//           >
//             Cancel
//           </Button>

//           <Button
//             type="button"
//             onClick={() => setIsReceiptOpen(true)}
//             className="bg-[#f59e0b] hover:bg-amber-600 text-white px-6 py-2 rounded-lg font-medium text-xs sm:text-sm h-9 cursor-pointer"
//           >
//             Print
//           </Button>

//           {canDelete && (
//             <Button
//               type="button"
//               variant="outline"
//               onClick={() => setOpenConfirmDelete(true)}
//               className="border-rose-200 text-rose-600 hover:bg-rose-50 dark:border-rose-800 dark:hover:bg-rose-950/40 px-4 py-2 rounded-lg font-medium text-xs sm:text-sm h-9 cursor-pointer"
//             >
//               Delete
//             </Button>
//           )}

//           {canUpdate && isPending && (
//             <Button
//               type="button"
//               variant="outline"
//               onClick={() => navigate(ROUTERS.SALE_EDIT.replace(":id", String(sale.id)))}
//               className="border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 px-5 py-2 rounded-lg font-medium text-xs sm:text-sm h-9 cursor-pointer"
//             >
//               Edit
//             </Button>
//           )}

//           {canUpdate && isPending && (
//             <Button
//               type="button"
//               onClick={handleComplete}
//               disabled={isCompleting}
//               className="bg-[#10b981] hover:bg-emerald-600 text-white px-6 py-2 rounded-lg font-medium text-xs sm:text-sm h-9 cursor-pointer"
//             >
//               Submit
//             </Button>
//           )}
//         </div>
//       </div>

//       {/* POS Receipt Modal */}
//       <PosReceiptModal
//         isOpen={isReceiptOpen}
//         onClose={() => setIsReceiptOpen(false)}
//         data={receiptData}
//       />

//       {/* Confirm Delete Dialog */}
//       <ConfirmDelete
//         isOpen={openConfirmDelete}
//         setIsOpen={setOpenConfirmDelete}
//         entityName={`Sale ${sale.reference || `#${sale.id}`}`}
//         confirmDelete={handleDelete}
//       />
//     </div>
//   );
// }
