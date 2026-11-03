import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Printer,
  Receipt,
  ShieldCheck,
  Smartphone,
  Copy,
  Check,
} from "lucide-react";
import { useSale } from "@/hooks/sales/useSale";
import { useStore } from "@/hooks/inventory/useStore";
import { useCustomer } from "@/hooks/sales/useCustomer";
import { useProduct } from "@/hooks/product/useProduct";
import { useProductSerial } from "@/hooks/product/useProductSerial";
import { useCashRegister } from "@/hooks/sales/useCashRegister";
import { useCurrency } from "@/hooks/finance/useCurrency";
import { useAppSelector } from "@/store/store";
import { getUser } from "@/utils/Auth";
import { ROUTERS } from "@/constants/Route";
import { fileService } from "@/services/file/file.service";

/* -------------------------------------------------------------------------- */
/*                               Helper Functions                             */
/* -------------------------------------------------------------------------- */

function num(val: unknown): number {
  const n = Number(val);
  return isNaN(n) ? 0 : n;
}

function money(val: unknown): string {
  const n = num(val);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

function moneyKhr(valInUsd: unknown, rate: number, symbol: string = "៛"): string {
  const n = num(valInUsd);
  const r = num(rate) > 0 ? num(rate) : 4100;
  const khr = Math.round(n * r);
  return `${new Intl.NumberFormat("en-US").format(khr)} ${symbol}`;
}

function getItemQty(item: any): number {
  return num(item?.quantity ?? item?.qty ?? 1);
}

function getItemPrice(item: any): number {
  return num(item?.price ?? item?.unitPrice ?? item?.salePrice ?? 0);
}

function getItemDiscount(item: any): number {
  return num(item?.itemDiscount ?? item?.discount ?? 0);
}

function lineTotal(item: any): number {
  if (item?.subtotal !== undefined && item?.subtotal !== null) {
    return num(item.subtotal);
  }
  if (item?.total !== undefined && item?.total !== null) {
    return num(item.total);
  }
  const qty = getItemQty(item);
  const price = getItemPrice(item);
  const disc = getItemDiscount(item);
  return Math.max(qty * price - disc, 0);
}

function parseDate(dateStr?: string | null): Date | null {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? null : d;
}

function fmtDate(d?: Date | null): string {
  if (!d) return "-";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(d);
}

function fmtDateTime(dateStr?: string | null): string {
  const d = parseDate(dateStr);
  if (!d) return "-";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(d);
}

function resolveLogo(logoPath?: string | null): string {
  if (!logoPath) return "/logo.png";
  if (
    logoPath.startsWith("http://") ||
    logoPath.startsWith("https://") ||
    logoPath.startsWith("/") ||
    logoPath.startsWith("data:") ||
    logoPath.startsWith("blob:")
  ) {
    return logoPath;
  }
  try {
    return fileService.getPreviewUrl("store", logoPath);
  } catch {
    return "/logo.png";
  }
}

/* -------------------------------------------------------------------------- */
/*                            Main Component                                  */
/* -------------------------------------------------------------------------- */

export default function SaleInvoicePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const authUserFromRedux = useAppSelector((state) => state.auth.user);
  const authUser = authUserFromRedux || getUser();

  const [paper, setPaper] = useState<"a5" | "thermal">("a5");
  const [copied, setCopied] = useState(false);

  // Queries
  const saleIdNum = Number(id);
  const isSaleQueryEnabled = Boolean(saleIdNum && !isNaN(saleIdNum) && saleIdNum > 0);

  const {
    data: saleData,
    isLoading: isSaleLoading,
    isError: isSaleError,
  } = useSale.GetSaleById(saleIdNum, { enabled: isSaleQueryEnabled });

  const sale: any =
    saleData?.payload?.data ??
    saleData?.payload ??
    saleData?.data ??
    saleData;

  const storeIdNum = Number(sale?.storeId);

  const { data: storeDetailData } = useStore.useGetStoreById(
    storeIdNum,
    Boolean(storeIdNum && storeIdNum > 0)
  );

  const { data: storesListData } = useStore.useGetAllStore({
    page: 1,
    size: 100,
  });

  const { data: customersData } = useCustomer.useGetAllCustomer({
    page: 1,
    size: 500,
  });

  const { data: serialsData } = useProductSerial.useGetAllProductSerial(
    { page: 1, size: 1000 },
    { enabled: isSaleQueryEnabled }
  );

  const { data: productsData } = useProduct.useGetAllProduct(
    { page: 1, size: 1000 },
    { enabled: isSaleQueryEnabled }
  );

  const cashRegisterIdNum = Number(sale?.cashRegisterId);
  const { data: cashRegisterDetail } = useCashRegister.GetById(
    cashRegisterIdNum,
    { enabled: Boolean(cashRegisterIdNum && cashRegisterIdNum > 0) }
  );

  const { data: currencyData } = useCurrency.GetAllCurrency({ page: 1, size: 50 });
  const currencyList: any[] =
    (currencyData as any)?.payload?.data ??
    (currencyData as any)?.payload?.content ??
    (currencyData as any)?.payload?.items ??
    (currencyData as any)?.payload ??
    [];

  const exchangeRateInfo = useMemo(() => {
    let rate = 4100;
    let symbol = "៛";
    let code = "KHR";

    if (Array.isArray(currencyList) && currencyList.length > 0) {
      const target =
        currencyList.find(
          (c: any) =>
            (c.code?.toUpperCase() === "KHR" || c.name?.toLowerCase()?.includes("riel")) &&
            Number(c.rate) > 0
        ) ??
        currencyList.find(
          (c: any) => c.code?.toUpperCase() !== "USD" && Number(c.rate) > 0
        ) ??
        currencyList.find((c: any) => Number(c.rate) > 0);

      if (target && Number(target.rate) > 0) {
        rate = Number(target.rate);
        symbol = target.symbol || "៛";
        code = target.code || "KHR";
      }
    }

    const formattedRate = new Intl.NumberFormat("en-US").format(rate);
    const text = `1$ = ${formattedRate} ${symbol}`;

    return { rate, symbol, code, text };
  }, [currencyList]);

  const exchangeRateText = exchangeRateInfo.text;
  const exchangeRateValue = exchangeRateInfo.rate;
  const exchangeRateSymbol = exchangeRateInfo.symbol;

  // Resolved store
  const store = useMemo(() => {
    const fromDetail =
      storeDetailData?.payload?.data ??
      storeDetailData?.payload ??
      null;
    if (fromDetail) return fromDetail;

    const list: any[] =
      storesListData?.payload?.data ??
      storesListData?.payload ??
      [];
    if (sale?.storeId && Array.isArray(list)) {
      const found = list.find((s) => s.id === Number(sale.storeId));
      if (found) return found;
    }
    return list[0] ?? null;
  }, [storeDetailData, storesListData, sale?.storeId]);

  // Resolved customer
  const customer = useMemo(() => {
    const list: any[] =
      customersData?.payload?.data ??
      customersData?.payload ??
      [];
    if (sale?.customerId && Array.isArray(list)) {
      return list.find((c) => c.id === Number(sale.customerId)) ?? null;
    }
    return null;
  }, [customersData, sale?.customerId]);

  // Lookup maps for serials and product SKUs
  const serialLookup = useMemo(() => {
    const map = new Map<number, string>();
    const list =
      (serialsData as any)?.payload?.data ??
      (serialsData as any)?.payload?.content ??
      (serialsData as any)?.payload?.items ??
      (serialsData as any)?.payload ??
      [];

    if (Array.isArray(list)) {
      for (const s of list) {
        if (s?.id) {
          const val =
            s.serialNumber ??
            s.serial_number ??
            s.imei ??
            s.barcode ??
            `SN-${s.id}`;
          map.set(s.id, val);
        }
      }
    }
    return map;
  }, [serialsData]);

  const productLookup = useMemo(() => {
    const map = new Map<number, any>();
    const list =
      (productsData as any)?.payload?.data ??
      (productsData as any)?.payload?.content ??
      (productsData as any)?.payload?.items ??
      (productsData as any)?.payload ??
      [];

    if (Array.isArray(list)) {
      for (const p of list) {
        if (p?.id) {
          map.set(p.id, p);
        }
      }
    }
    return map;
  }, [productsData]);

  // Items
  const items: any[] =
    sale?.items ?? sale?.saleItems ?? sale?.details ?? [];

  // Totals calculations
  const totals = useMemo(() => {
    const computedSubtotal = items.reduce(
      (sum, item) => sum + lineTotal(item),
      0
    );

    const discount = num(sale?.discount ?? sale?.discountAmount ?? 0);
    const tax = num(sale?.tax ?? sale?.taxAmount ?? 0);
    const rawGrand = num(sale?.grandTotal ?? sale?.total ?? 0);
    const rawSub = num(
      sale?.totalAmount ??
      sale?.subtotal ??
      sale?.subTotal ??
      sale?.totalPrice ??
      0
    );

    const subtotal =
      rawSub > 0
        ? rawSub
        : computedSubtotal > 0
          ? computedSubtotal
          : Math.max(rawGrand + discount - tax, 0);

    const grand =
      rawGrand > 0
        ? rawGrand
        : Math.max(subtotal - discount + tax, 0);

    const paymentStatusUpper = String(sale?.paymentStatus || "").toUpperCase();
    const paid = num(
      sale?.paidAmount !== undefined && sale?.paidAmount !== null
        ? sale.paidAmount
        : paymentStatusUpper === "PAID"
          ? grand
          : 0
    );

    const change = Math.max(paid - grand, 0);
    const due = num(
      sale?.dueAmount !== undefined && sale?.dueAmount !== null
        ? sale.dueAmount
        : Math.max(grand - paid, 0)
    );

    const qty = items.reduce((sum, item) => sum + getItemQty(item), 0);

    return {
      subtotal,
      discount,
      tax,
      grand,
      paid,
      change,
      due,
      qty,
    };
  }, [items, sale]);

  // Dates & Warranty (14 Days standard phone retail warranty)
  const WARRANTY_DAYS = 14;
  const saleDateRaw = sale?.saleDate || sale?.date || sale?.createdAt;

  const warrantyDates = useMemo(() => {
    const base = parseDate(saleDateRaw) || new Date();
    const expiry = new Date(base.getTime());
    expiry.setDate(expiry.getDate() + WARRANTY_DAYS);

    return {
      start: fmtDate(base),
      until: fmtDate(expiry),
    };
  }, [saleDateRaw]);

  // Extracted fields
  const invoiceNumber =
    sale?.reference ??
    sale?.no ??
    sale?.invoiceNumber ??
    (sale?.id ? `INV-${String(sale.id).padStart(5, "0")}` : "INV-00000");

  const customerName =
    customer?.name ??
    sale?.customerName ??
    "Walk-in Customer";

  const customerPhone =
    customer?.phone ??
    customer?.contactNumber ??
    sale?.customerPhone ??
    "";

  const customerAddress =
    customer?.address ??
    sale?.customerAddress ??
    "";

  const cashier =
    sale?.cashierName ??
    sale?.createdByName ??
    authUser?.username ??
    "Staff Cashier";

  const registerName =
    sale?.cashRegisterNo ??
    (cashRegisterDetail as any)?.registerNumber ??
    (cashRegisterDetail as any)?.name ??
    (sale?.cashRegisterId ? `POS-${sale.cashRegisterId}` : "POS Register 01");

  const paymentMethod =
    sale?.paymentMethod ??
    sale?.paymentType ??
    (sale?.bankName ? `Bank (${sale.bankName})` : "Cash");

  const paymentStatus = (sale?.paymentStatus || "PAID").toUpperCase();

  const isStringPlaceholder = (val?: string | null) =>
    !val || val.trim().toLowerCase() === "string";

  const storeName =
    !isStringPlaceholder(store?.name)
      ? store.name
      : !isStringPlaceholder(sale?.storeName)
        ? sale.storeName
        : "360° Phone Shop";

  const storeAddress = [
    store?.state ?? store?.state,
    store?.city,
    store?.country,
  ]
    .filter((v) => !isStringPlaceholder(v))
    .join(", ");

  const storePhone = !isStringPlaceholder(store?.phone)
    ? store.phone
    : !isStringPlaceholder(store?.contactNumber)
      ? store.contactNumber
      : "";
  const storeEmail = store?.email ?? "";
  const logoUrl = resolveLogo(store?.logo);

  const handleCopyInvoice = () => {
    if (invoiceNumber) {
      navigator.clipboard.writeText(invoiceNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getSerialsForItem = (item: any): string[] => {
    // 1. Array of string serials
    if (Array.isArray(item?.serialNumbers) && item.serialNumbers.length > 0) {
      return item.serialNumbers.map((s: any) =>
        typeof s === "string" ? s : s?.serialNumber ?? s?.imei ?? String(s)
      );
    }
    // 2. Array of serial IDs
    const idArray =
      item?.serialNumberIds ??
      item?.productSerialIds ??
      item?.serials;

    if (Array.isArray(idArray) && idArray.length > 0) {
      return idArray
        .map((sId: any) => {
          if (typeof sId === "number") {
            return serialLookup.get(sId) ?? `SN-${sId}`;
          }
          if (typeof sId === "object" && sId !== null) {
            return sId.serialNumber ?? sId.imei ?? sId.serial_number ?? `SN-${sId.id}`;
          }
          return String(sId);
        })
        .filter(Boolean);
    }

    return [];
  };

  const getItemSku = (item: any): string => {
    if (item?.sku) return item.sku;
    if (item?.code) return item.code;
    if (item?.productCode) return item.productCode;
    if (item?.productId && productLookup.has(item.productId)) {
      const p = productLookup.get(item.productId);
      return p.code || p.sku || `SKU-${p.id}`;
    }
    return item?.productId ? `SKU-${item.productId}` : "ITEM";
  };

  /* -------------------------------------------------------------------------- */
  /*                             Loading / Error                                */
  /* -------------------------------------------------------------------------- */

  if (isSaleLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-3">
        <div className="size-10 border-4 border-[#7135E8] border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-medium text-slate-600">
          Loading retail invoice...
        </p>
      </div>
    );
  }

  if (isSaleError || !sale) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-slate-50 px-4">
        <div className="size-16 rounded-2xl bg-purple-50 flex items-center justify-center border border-purple-200">
          <Receipt className="size-8 text-[#7135E8]" />
        </div>
        <div className="text-center">
          <h2 className="text-lg font-bold text-slate-800">
            Invoice Not Found
          </h2>
          <p className="text-sm text-slate-500 max-w-sm mt-1">
            Unable to load invoice details. The record might have been deleted or does not exist.
          </p>
        </div>
        <button
          onClick={() => navigate(ROUTERS.SALE_CREATE)}
          className="px-5 py-2.5 rounded-xl bg-[#7135E8] text-white font-medium text-sm hover:bg-[#5E27CB] transition-colors shadow-sm"
        >
          Return to POS
        </button>
      </div>
    );
  }

  const thermal = paper === "thermal";

  /* -------------------------------------------------------------------------- */
  /*                                Render UI                                   */
  /* -------------------------------------------------------------------------- */

  return (
    <div
      className="min-h-screen bg-slate-100/80 flex flex-col items-center px-3 py-6 print:bg-white print:p-0"
      style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" }}
    >
      {/* ======================= Control Bar (Screen Only) ======================= */}
      <header className="w-full max-w-[620px] flex items-center justify-between mb-5 print:hidden">
        <button
          onClick={() => navigate(ROUTERS.SALE_CREATE)}
          className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-[#7135E8] transition-colors"
        >
          <ArrowLeft size={16} />
          Back to POS
        </button>

        {/* Paper Toggle */}
        <div className="flex items-center bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
          <button
            onClick={() => setPaper("a5")}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${paper === "a5"
              ? "bg-[#7135E8] text-white shadow-sm"
              : "text-slate-600 hover:text-slate-900"
              }`}
          >
            A5 Invoice
          </button>
          <button
            onClick={() => setPaper("thermal")}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${thermal
              ? "bg-[#7135E8] text-white shadow-sm"
              : "text-slate-600 hover:text-slate-900"
              }`}
          >
            80mm Thermal
          </button>
        </div>

        {/* Quick Print Button */}
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 px-4 py-2 bg-[#7135E8] hover:bg-[#5E27CB] text-white text-xs font-semibold rounded-xl shadow-sm transition-all"
        >
          <Printer size={15} />
          Print
        </button>
      </header>

      {/* ======================= Invoice Paper Container ======================= */}
      <article
        id="receipt"
        data-paper={paper}
        className={`invoice-paper bg-white text-slate-800 shadow-xl border border-slate-200/80 relative transition-all duration-200 ${thermal
          ? "w-[310px] text-[11px] p-4 rounded-lg leading-tight print:w-full print:p-0 print:border-none print:shadow-none print:rounded-none"
          : "w-full max-w-[620px] text-xs p-7 rounded-2xl print:rounded-none print:shadow-none print:border-none"
          }`}
      >
        {/* ====================================================================== */}
        {/*                          A5 INVOICE LAYOUT                             */}
        {/* ====================================================================== */}
        {!thermal && (
          <div className="space-y-5">
            {/* 1. Header (Clean Minimalist Style - No Card Boxes) */}
            <div className="text-center pb-2">
              <img
                src={logoUrl}
                alt={storeName}
                onError={(e) => {
                  e.currentTarget.src = "/logo.png";
                }}
                className="h-12 mx-auto mb-1.5 object-contain"
              />
              <h2 className="font-extrabold text-base text-slate-900 tracking-tight">
                {storeName}
              </h2>
              {/* {storeAddress && ( */}
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {storeAddress}
                </p>
              {/* )} */}
              {storePhone && (
                <p className="text-[10px] text-slate-500">
                  Tel: {storePhone}
                </p>
              )}

              {/* <div className="mt-2 pt-1">
                <p className="font-bold text-xs uppercase tracking-wider text-[#7135E8]">
                  RETAIL INVOICE
                </p>
              </div> */}
            </div>

            {/* Metadata Section - Simple & Clean (No Cards) */}
            <div className="border-y border-dashed border-slate-300 py-2.5 my-2 font-mono text-xs">
              <div className="grid grid-cols-2 gap-6">
                {/* Left: Customer Info */}
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-semibold">Customer:</span>
                    <span className="font-bold text-slate-900">{customerName}</span>
                  </div>
                  {customerPhone ? (
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-semibold">Phone:</span>
                      <span className="text-slate-800">{customerPhone}</span>
                    </div>
                  ) : (
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-semibold">Phone:</span>
                      <span className="text-slate-400 italic">No Phone</span>
                    </div>
                  )}
                  {customerAddress && (
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-500 font-semibold">Address:</span>
                      <span className="text-slate-700 truncate ml-2">{customerAddress}</span>
                    </div>
                  )}
                </div>

                {/* Right: Invoice Info & Exchange Rate */}
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-semibold">No:</span>
                    <span className="font-bold text-slate-900">{invoiceNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-semibold">Date:</span>
                    <span className="text-slate-800">{fmtDateTime(saleDateRaw)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-semibold">Register:</span>
                    <span className="text-slate-800">{registerName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-semibold">Cashier:</span>
                    <span className="text-slate-800">{cashier}</span>
                  </div>
                  <div className="flex justify-between text-[#7135E8] font-bold pt-0.5 border-t border-dotted border-slate-200">
                    <span>Rate:</span>
                    <span>{exchangeRateText}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 4. Product Table - Minimalist Style (Matches Reference Image) */}
            <div className="mt-3">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-700 text-[11px] text-slate-700 tracking-wider uppercase">
                    <th className="py-2 text-left font-medium">DESCRIPTION</th>
                    <th className="py-2 text-right font-medium w-24">UNIT PRICE</th>
                    <th className="py-2 text-center font-medium w-16">QTY</th>
                    <th className="py-2 text-right font-medium w-24">TOTAL</th>
                  </tr>
                </thead>
                <tbody className="text-xs">
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-6 text-center text-slate-400 italic">
                        No items found in this sale.
                      </td>
                    </tr>
                  ) : (
                    items.map((item, index) => {
                      const qty = getItemQty(item);
                      const price = getItemPrice(item);
                      const total = lineTotal(item);
                      const sku = getItemSku(item);
                      const serials = getSerialsForItem(item);

                      return (
                        <tr key={item.id ?? index} className="text-slate-800">
                          <td className="py-2.5 pr-3 text-left align-top">
                            <p className="font-normal text-slate-900">
                              {item.productName ?? `Product #${item.productId}`}
                            </p>
                            {(sku || serials.length > 0) && (
                              <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                                {/* {sku && <span>SKU: {sku}</span>} */}
                                {/* {sku && serials.length > 0 && <span className="mx-1">•</span>} */}
                                {serials.length > 0 && (
                                  <span>Serial Numbers: {serials.join(", ")}</span>
                                )}
                              </p>
                            )}
                          </td>
                          <td className="py-2.5 text-right text-slate-700 tabular-nums align-top">
                            {money(price)}
                          </td>
                          <td className="py-2.5 text-center text-slate-700 tabular-nums align-top">
                            {qty}
                          </td>
                          <td className="py-2.5 text-right text-slate-900 tabular-nums font-normal align-top">
                            {money(total)}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>

              {/* Bottom Table Border */}
              <div className="border-b border-slate-700 my-2" />

              {/* 5. Minimalist Totals Section - Evenly Aligned with KHR Currency */}
              <div className="ml-auto max-w-[270px] w-full pt-2 space-y-1.5 text-xs font-mono">
                {/* {totals.discount > 0 && ( */}
                  <div className="flex justify-between items-center text-slate-600">
                    <span>Discount</span>
                    <span className="tabular-nums font-medium text-emerald-600">
                      {money(totals.discount)}
                    </span>
                  </div>
                {/* // )} */}

                {/* <div className="flex justify-between items-center text-slate-600">
                  <span>Tax</span>
                  <span className="tabular-nums font-medium text-slate-800">
                    {totals.tax}%
                  </span>
                </div> */}

                <div className="flex justify-between items-center pt-1 border-t border-slate-300 font-bold text-slate-900">
                  <span className="uppercase tracking-wider">TOTAL (USD)</span>
                  <span className="tabular-nums text-sm font-bold">
                    {money(totals.grand)}
                  </span>
                </div>

                {/* Khmer Riel Total (USD * exchangeRate from Currency) */}
                <div className="flex justify-between items-center font-bold text-[#7135E8]">
                  <span className="uppercase tracking-wider">TOTAL (KHR)</span>
                  <span className="tabular-nums text-sm font-bold">
                    {moneyKhr(totals.grand, exchangeRateValue, exchangeRateSymbol)}
                  </span>
                </div>

                <div className="flex justify-between items-center text-slate-600 pt-1 text-[11px]">
                  <span>Paid </span>
                  <span className="tabular-nums font-medium text-slate-800">
                    {money(totals.paid)}
                  </span>
                </div>

                {totals.change > 0 && (
                  <div className="flex justify-between items-center text-emerald-600 font-semibold text-[11px]">
                    <span>Change</span>
                    <span className="tabular-nums">
                      {money(totals.change)}
                    </span>
                  </div>
                )}

                {/* {totals.due > 0 && ( */}
                  <div className="flex justify-between items-center text-rose-600 font-bold text-[11px]">
                    <span>Amount Due</span>
                    <span className="tabular-nums">
                      {money(totals.due)}
                    </span>
                  </div>
                {/* )} */}
              </div>
            </div>

            {/* Footer & Warranty Note */}
            <footer className="mt-8 pt-4 border-t border-dashed border-slate-300 text-center text-[10px] text-slate-500 space-y-1 break-inside-avoid">
              <p className="text-slate-600 font-medium">
                * 14-Day Hardware Warranty valid until {warrantyDates.until}. Retain invoice & intact serial sticker for claims.
              </p>
              <p className="font-semibold text-slate-800 text-xs mt-2">
                Thank you for choosing {storeName}!
              </p>
              {storePhone && (
                <p className="text-slate-400">
                  For customer support or queries, contact {storePhone}.
                </p>
              )}
            </footer>
          </div>
        )}

        {/* ====================================================================== */}
        {/*                      80MM THERMAL RECEIPT LAYOUT                       */}
        {/* ====================================================================== */}
        {thermal && (
          <div className="space-y-4 font-mono text-[11px] leading-tight">
            {/* 1. Header (Clean Minimalist Style - Matches A5) */}
            <div className="text-center pb-1">
              <img
                src={logoUrl}
                alt={storeName}
                onError={(e) => {
                  e.currentTarget.src = "/logo.png";
                }}
                className="h-10 mx-auto mb-1.5 object-contain"
              />
              <h2 className="font-extrabold text-sm text-slate-900 tracking-tight">
                {storeName}
              </h2>
              {storeAddress && (
                <p className="text-[10px] text-slate-500 mt-0.5 leading-snug">
                  {storeAddress}
                </p>
              )}
              {storePhone && (
                <p className="text-[10px] text-slate-500">
                  Tel: {storePhone}
                </p>
              )}
            </div>

            {/* 2. Metadata Section - Simple & Clean (Matches A5) */}
            <div className="border-y border-dashed border-slate-300 py-2 my-2 font-mono text-[10px] space-y-1.5">
              {/* Customer Info */}
              <div className="space-y-0.5 pb-1.5 border-b border-dotted border-slate-200">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-semibold">Customer:</span>
                  <span className="font-bold text-slate-900">{customerName}</span>
                </div>
                {customerPhone ? (
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-semibold">Phone:</span>
                    <span className="text-slate-800">{customerPhone}</span>
                  </div>
                ) : (
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-semibold">Phone:</span>
                    <span className="text-slate-400 italic">No Phone</span>
                  </div>
                )}
                {customerAddress && (
                  <div className="flex justify-between text-[9px]">
                    <span className="text-slate-500 font-semibold">Address:</span>
                    <span className="text-slate-700 truncate ml-2">{customerAddress}</span>
                  </div>
                )}
              </div>

              {/* Invoice & Rate */}
              <div className="space-y-0.5">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-semibold">No:</span>
                  <span className="font-bold text-slate-900">{invoiceNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-semibold">Date:</span>
                  <span className="text-slate-800">{fmtDateTime(saleDateRaw)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-semibold">Register:</span>
                  <span className="text-slate-800">{registerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-semibold">Cashier:</span>
                  <span className="text-slate-800">{cashier}</span>
                </div>
                <div className="flex justify-between text-[#7135E8] font-bold pt-0.5 border-t border-dotted border-slate-200">
                  <span>Rate:</span>
                  <span>{exchangeRateText}</span>
                </div>
              </div>
            </div>

            {/* 3. Product Table - Minimalist Style (Matches A5) */}
            <div className="mt-2">
              <table className="w-full text-[10px] font-mono">
                <thead>
                  <tr className="border-b border-slate-700 text-[9px] text-slate-700 tracking-wider uppercase">
                    <th className="py-1.5 text-left font-medium">DESCRIPTION</th>
                    <th className="py-1.5 text-right font-medium">PRICE</th>
                    <th className="py-1.5 text-center font-medium w-8">QTY</th>
                    <th className="py-1.5 text-right font-medium">TOTAL</th>
                  </tr>
                </thead>
                <tbody className="text-[10px]">
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-4 text-center text-slate-400 italic">
                        No items found in this sale.
                      </td>
                    </tr>
                  ) : (
                    items.map((item, idx) => {
                      const qty = getItemQty(item);
                      const price = getItemPrice(item);
                      const total = lineTotal(item);
                      const serials = getSerialsForItem(item);

                      return (
                        <tr key={item.id ?? idx} className="text-slate-800">
                          <td className="py-1.5 pr-1 text-left align-top">
                            <p className="font-normal text-slate-900 leading-tight">
                              {item.productName ?? `Product #${item.productId}`}
                            </p>
                            {serials.length > 0 && (
                              <p className="text-[8px] text-slate-500 font-mono mt-0.5 leading-snug">
                                Serial Numbers: {serials.join(", ")}
                              </p>
                            )}
                          </td>
                          <td className="py-1.5 text-right text-slate-700 tabular-nums align-top">
                            {money(price)}
                          </td>
                          <td className="py-1.5 text-center text-slate-700 tabular-nums align-top">
                            {qty}
                          </td>
                          <td className="py-1.5 text-right text-slate-900 tabular-nums font-normal align-top">
                            {money(total)}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>

              {/* Bottom Table Border */}
              <div className="border-b border-slate-700 my-1.5" />
            </div>

            {/* 4. Totals Section - Evenly Aligned with KHR Currency (Matches A5) */}
            <div className="space-y-1 text-[11px] font-mono pt-1">
              {totals.discount > 0 && (
                <div className="flex justify-between items-center text-slate-600">
                  <span>Discount</span>
                  <span className="tabular-nums font-medium text-emerald-600">
                    -{money(totals.discount)}
                  </span>
                </div>
              )}

              <div className="flex justify-between items-center text-slate-600">
                <span>Tax</span>
                <span className="tabular-nums font-medium text-slate-800">
                  {totals.tax}%
                </span>
              </div>

              <div className="flex justify-between items-center pt-1 border-t border-slate-300 font-bold text-slate-900">
                <span className="uppercase tracking-wider">TOTAL (USD)</span>
                <span className="tabular-nums text-xs font-bold">
                  {money(totals.grand)}
                </span>
              </div>

              {/* Khmer Riel Total */}
              <div className="flex justify-between items-center font-bold text-[#7135E8]">
                <span className="uppercase tracking-wider">TOTAL (KHR)</span>
                <span className="tabular-nums text-xs font-bold">
                  {moneyKhr(totals.grand, exchangeRateValue, exchangeRateSymbol)}
                </span>
              </div>

              <div className="flex justify-between items-center text-slate-600 pt-0.5 text-[10px]">
                <span>Paid ({paymentMethod})</span>
                <span className="tabular-nums font-medium text-slate-800">
                  {money(totals.paid)}
                </span>
              </div>

              {totals.change > 0 && (
                <div className="flex justify-between items-center text-emerald-600 font-semibold text-[10px]">
                  <span>Change</span>
                  <span className="tabular-nums">
                    {money(totals.change)}
                  </span>
                </div>
              )}

              {totals.due > 0 && (
                <div className="flex justify-between items-center text-rose-600 font-bold text-[10px]">
                  <span>Amount Due</span>
                  <span className="tabular-nums">
                    {money(totals.due)}
                  </span>
                </div>
              )}
            </div>

            {/* 5. Footer & Warranty Note (Matches A5) */}
            <footer className="mt-4 pt-3 border-t border-dashed border-slate-300 text-center text-[9px] text-slate-500 space-y-1 break-inside-avoid font-mono">
              <p className="text-slate-600 font-medium leading-relaxed">
                * 14-Day Hardware Warranty valid until {warrantyDates.until}. Retain invoice & intact serial sticker for claims.
              </p>
              <p className="font-semibold text-slate-800 text-[10px] mt-1.5">
                Thank you for choosing {storeName}!
              </p>
              {storePhone && (
                <p className="text-slate-400">
                  For customer support or queries, contact {storePhone}.
                </p>
              )}
            </footer>
          </div>
        )}
      </article>

      {/* ======================= Bottom Action Buttons (Screen Only) ======================= */}
      <footer className="w-full max-w-[620px] mt-5 grid grid-cols-2 gap-3 print:hidden">
        <button
          onClick={() => navigate(ROUTERS.SALE_CREATE)}
          className="py-3 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl text-sm font-semibold text-slate-700 transition-colors shadow-sm text-center"
        >
          New Sale
        </button>

        <button
          onClick={() => window.print()}
          className="py-3 bg-[#7135E8] hover:bg-[#5E27CB] text-white rounded-xl text-sm font-semibold transition-colors shadow-sm flex items-center justify-center gap-2"
        >
          <Printer size={16} />
          Print Invoice
        </button>
      </footer>

      {/* ======================= Print Media Styles ======================= */}
      <style>{`
        @media print {
          @page {
            size: ${thermal ? "80mm auto" : "A5 portrait"};
            margin: ${thermal ? "0" : "5mm"};
          }

          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
            width: 100% !important;
          }

          body {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          #receipt {
            width: ${thermal ? "78mm" : "100%"} !important;
            max-width: ${thermal ? "78mm" : "148mm"} !important;
            margin: 0 auto !important;
            padding: ${thermal ? "8px" : "16px"} !important;
            box-shadow: none !important;
            border: none !important;
            overflow: visible !important;
            page-break-inside: avoid;
            break-inside: avoid;
          }

          .invoice-paper {
            box-shadow: none !important;
            border: none !important;
          }

          button, header, footer.print\\:hidden {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
