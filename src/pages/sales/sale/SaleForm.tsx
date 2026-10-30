import { useEffect, useState, useMemo, useRef } from "react";
import { useForm, useStore as useFormStore } from "@tanstack/react-form";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import {
  Plus,
  Minus,
  ScanLine,
  Search,
  Trash2,
  Hash,
  ShoppingCart,
  PackageSearch,
  SearchX,
  RotateCcw,
  CalendarDays,
  Clock,
  Check,
  AlertTriangle,
  User,
  UserPlus,
  Store as StoreIcon,
  Maximize2,
  CalendarCheck,
  X,
  XCircle,
  PauseCircle,
  Banknote,
  Pencil,
  KeyRound,
  Smartphone,
  LogOut,
  ChevronDown,
  LayoutDashboard,
  BadgeCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { statusToneClass } from "@/components/ui/status-badge";
import { Avatar } from "@/components/ui/avatar";
import { InitialsAvatar } from "@/components/ui/initials-avatar";
import { SearchSelect, type SearchSelectOption } from "@/components/ui/search-select";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDispatch } from "react-redux";
import { logout } from "@/store/authSlice";
import { AuthService } from "@/services/auth/auth.service";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { LanguageToggle } from "@/components/layout/LanguageToggle";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { useLanguage } from "@/i18n/LanguageContext";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import {
  SaleSchema,
  SalePaymentStatus,
  SaleStatus,
  type SaleFormValues,
} from "@/types/sales/Sale";

import { useSale } from "@/hooks/sales/useSale";
import { usePayment } from "@/hooks/sales/usePayment";
import { useCustomer } from "@/hooks/sales/useCustomer";
import { useStore } from "@/hooks/inventory/useStore";
import { useBank } from "@/hooks/finance/useBank";
import { useProduct } from "@/hooks/product/useProduct";
import { useProductSerial } from "@/hooks/product/useProductSerial";
import { useCategory } from "@/hooks/product/useCategory";
import { useAuth } from "@/store/useAuth";

import FormCustomer from "@/pages/sales/customers/CustomerForm";
import PaymentForm from "@/pages/sales/payment/PaymentForm";
import PrintBillModal, { type BillData, type BillItem } from "./components/PrintBillModal";
import HeldSalesModal, { type HeldSale, type HeldSaleItem } from "./components/HeldSalesModal";
import { useCashRegister } from "@/hooks/sales/useCashRegister";
import OpenRegisterModal from "./components/OpenRegisterModal";
import CloseRegisterModal from "./components/CloseRegisterModal";
import RegisterDetailsModal from "./components/RegisterDetailsModal";
import TodaySaleModal from "./components/TodaySaleModal";
import ImageCell from "@/components/file/ImageCell";
import { ROUTERS } from "@/constants/Route";
import { toast } from "sonner";

import type { StoreResponse } from "@/types/inventory/Store";
import type { CustomerResponse } from "@/types/sales/Customer";
import type { ProductResponse } from "@/types/product/Product";
import type { PaymentRequest } from "@/types/sales/Payment";



/* =========================================================
   HELPERS
========================================================= */

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(Number(value) || 0);
}

/** Live date and time for the top bar. Ticks on the minute in its own component so the POS form doesn't re-render. */
function PosClock() {
  const { language } = useLanguage();
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;
    const timeout = setTimeout(() => {
      setNow(new Date());
      interval = setInterval(() => setNow(new Date()), 60_000);
    }, 60_000 - (Date.now() % 60_000));
    return () => {
      clearTimeout(timeout);
      if (interval) clearInterval(interval);
    };
  }, []);

  const isKm = language === "km";
  return (
    <span className="reference-date">
      <CalendarDays className="h-4 w-4" />
      <span>
        {now.toLocaleDateString(isKm ? "km-KH" : "en-GB", { weekday: "short", day: "2-digit", month: "short", year: "numeric" })}
      </span>
      <Clock className="h-4 w-4" />
      <span className="tabular-nums">
        {now.toLocaleTimeString(isKm ? "km-KH" : "en-US", { hour: "2-digit", minute: "2-digit" })}
      </span>
    </span>
  );
}

function generateRef() {
  const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, "");
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `POS-${dateStr}-${rand}`;
}

export function isProductSerialized(product: any): boolean {
  if (!product) return false;
  // If explicitly declared false
  if (
    product.hasSerial === false ||
    product.hasSerial === "false" ||
    product.hasSerial === 0 ||
    product.hasSerialNumber === false ||
    product.hasSerialNumber === "false" ||
    product.hasSerialNumber === 0 ||
    product.isSerialized === false ||
    product.isSerialized === "false" ||
    product.isSerialized === 0 ||
    product.serialized === false ||
    product.serialized === "false" ||
    product.serialized === 0
  ) {
    return false;
  }
  // If explicitly declared true
  if (
    product.hasSerial === true ||
    product.hasSerial === "true" ||
    product.hasSerial === 1 ||
    product.hasSerialNumber === true ||
    product.hasSerialNumber === "true" ||
    product.hasSerialNumber === 1 ||
    product.isSerialized === true ||
    product.isSerialized === "true" ||
    product.isSerialized === 1 ||
    product.serialized === true ||
    product.serialized === "true" ||
    product.serialized === 1
  ) {
    return true;
  }
  // If product has serials array with elements
  if (Array.isArray(product.serials) && product.serials.length > 0) {
    return true;
  }
  if (
    product.availableSerials !== undefined &&
    product.availableSerials !== null &&
    Number(product.availableSerials) > 0
  ) {
    return true;
  }
  return false;
}

function getProductStock(product: any): number {
  if (Array.isArray(product?.serials) && product.serials.length > 0) {
    const available = product.serials.filter(
      (s: any) => s.status === "AVAILABLE" || s.status === "available" || !s.status
    ).length;
    return available;
  }
  if (product?.availableSerials !== undefined && product?.availableSerials !== null) {
    return Number(product.availableSerials) || 0;
  }
  if (product?.quantity !== undefined && product?.quantity !== null) {
    return Number(product.quantity) || 0;
  }
  if (product?.qty !== undefined && product?.qty !== null) {
    return Number(product.qty) || 0;
  }
  if (product?.stock !== undefined && product?.stock !== null) {
    return Number(product.stock) || 0;
  }
  return 0;
}

/* =========================================================
   MAIN POS SALE FORM
========================================================= */

export default function SaleForm() {
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const dispatch = useDispatch();
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const isKm = language === "km";

  const handleLogout = async () => {
    const confirmMsg = isKm
      ? "តើអ្នកប្រាកដជាចង់ចាកចេញពីប្រព័ន្ធមែនទេ?"
      : "Are you sure you want to log out?";
    if (!window.confirm(confirmMsg)) return;

    try {
      await AuthService.logout();
    } catch (e) {
      console.error("Logout error:", e);
    }
    dispatch(logout());
    localStorage.removeItem("isLoggedIn");
    navigate(ROUTERS.LOGIN);
  };

  /* -------------------------------------------------------
     DATA FETCHING
  ------------------------------------------------------- */

  const { data: customers } = useCustomer.useGetAllCustomer({
    page: 0,
    size: 1000,
  });

  const { data: stores } = useStore.useGetAllStore({
    page: 0,
    size: 1000,
  });

  const { data: products } = useProduct.useGetAllProduct({
    page: 0,
    size: 1000,
  });

  const { data: dataCategory } = useCategory.useGetAllCategory({
    page: 0,
    size: 1000,
  });

  const listCategory = dataCategory?.payload?.data ?? [];
  const productList: ProductResponse[] = (products as any)?.payload?.data ?? [];
  const customerList: CustomerResponse[] = customers?.payload?.data ?? [];
  const storeList: StoreResponse[] = stores?.payload?.data ?? [];

  const { data: banks } = useBank.useGetAllBank({ page: 1, size: 1000 });
  const bankList: any[] = banks?.payload?.data ?? banks?.data ?? banks?.payload ?? [];

  const { data: existingSale } = useSale.GetSaleById(Number(id), {
    enabled: isEditing,
  });

  const saleDetail =
    existingSale?.payload?.data ??
    existingSale?.payload ??
    existingSale?.data ??
    existingSale;

  /* -------------------------------------------------------
     MUTATIONS
  ------------------------------------------------------- */

  const createSale = useSale.Create();
  const updateSale = useSale.Update();
  const completeSale = useSale.Complete();
  const createPayment = usePayment.createPayment();
  const [registeredSaleId, setRegisteredSaleId] = useState<number | null>(null);

  /* -------------------------------------------------------
     LOCAL UI STATE
  ------------------------------------------------------- */

  const [productSearch, setProductSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  type StockFilterType = "ALL" | "IN_STOCK" | "OUT_OF_STOCK" | "LOW_STOCK";
  const [stockFilter, setStockFilter] = useState<StockFilterType>("ALL");
  const [isCustomerDialogOpen, setIsCustomerDialogOpen] = useState(false);
  const [activeSerialRowIndex, setActiveSerialRowIndex] = useState<number | null>(null);



  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const paymentSubmittedRef = useRef(false);

  const [isPrintBillOpen, setIsPrintBillOpen] = useState(false);
  const [isHeldSalesOpen, setIsHeldSalesOpen] = useState(false);

  /* Discount Type: $ (FIXED) or % (PERCENT) */
  const [discountType, setDiscountType] = useState<"FIXED" | "PERCENT">("FIXED");
  const [discountInputValue, setDiscountInputValue] = useState<number>(0);

  const handleDiscountChange = (
    val: number,
    type: "FIXED" | "PERCENT",
    currentSubtotal: number
  ) => {
    setDiscountInputValue(val);
    if (type === "PERCENT") {
      const pct = Math.min(100, Math.max(0, val));
      const calculatedDollar = Number(((currentSubtotal * pct) / 100).toFixed(2));
      form.setFieldValue("discount", calculatedDollar);
    } else {
      const fixed = Math.max(0, val);
      form.setFieldValue("discount", fixed);
    }
  };

  const handleToggleDiscountType = (
    newType: "FIXED" | "PERCENT",
    currentSubtotal: number,
    currentDiscount: number
  ) => {
    setDiscountType(newType);
    if (newType === "PERCENT") {
      const pct =
        currentSubtotal > 0
          ? Math.min(100, Math.round((currentDiscount / currentSubtotal) * 100))
          : 0;
      setDiscountInputValue(pct);
      form.setFieldValue("discount", Number(((currentSubtotal * pct) / 100).toFixed(2)));
    } else {
      setDiscountInputValue(currentDiscount);
      form.setFieldValue("discount", currentDiscount);
    }
  };

  /* POS Tools State */
  const { data: currentRegister, isLoading: isLoadingRegister } = useCashRegister.GetCurrent();
  const [isOpenRegisterOpen, setIsOpenRegisterOpen] = useState(false);
  const [isRegisterDetailsOpen, setIsRegisterDetailsOpen] = useState(false);
  const [isTodaySaleOpen, setIsTodaySaleOpen] = useState(false);
  const [isDiscountPopoverOpen, setIsDiscountPopoverOpen] = useState(false);
  const [orderTax, setOrderTax] = useState(0);
  const [isOrderTaxOpen, setIsOrderTaxOpen] = useState(false);
  const [taxInputValue, setTaxInputValue] = useState(0);
  const [isCloseRegisterOpen, setIsCloseRegisterOpen] = useState(false);
  const [cartBarcodeScan, setCartBarcodeScan] = useState("");

  // Automatically prompt Open Register when entering POS if no shift is currently open
  const hasAutoPromptedRegister = useRef(false);
  useEffect(() => {
    if (!isLoadingRegister && currentRegister === null && !hasAutoPromptedRegister.current) {
      hasAutoPromptedRegister.current = true;
      setIsOpenRegisterOpen(true);
    }
  }, [isLoadingRegister, currentRegister]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const [heldSales, setHeldSales] = useState<HeldSale[]>(() => {
    try {
      const stored = localStorage.getItem("pos_held_sales");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const saveHeldSales = (list: HeldSale[]) => {
    setHeldSales(list);
    try {
      localStorage.setItem("pos_held_sales", JSON.stringify(list));
    } catch {
      // ignore
    }
  };




  /* -------------------------------------------------------
     FORM INITIALIZATION
  ------------------------------------------------------- */

  const submitSale = async (paymentOverride?: PaymentRequest | any): Promise<number> => {
    const currentValues = form.state.values;

    if (!currentValues.items || currentValues.items.length === 0) {
      toast.error("Please add at least one product to the cart before checkout");
      return 0;
    }

    const items = currentValues.items.map((item: any) => {
      const price = Number(item.price) || 0;
      const quantity = Number(item.quantity) || 1;
      const itemDiscount = Number(item.itemDiscount) || 0;

      return {
        productId: Number(item.productId),
        quantity,
        price,
        itemDiscount,
        subtotal: price * quantity - itemDiscount,
        serialNumberIds: (item.serialNumberIds ?? []).filter(
          (sId: any) => Number(sId) > 0
        ),
      };
    });

    const subtotalCalc = items.reduce((sum: number, it: any) => sum + it.subtotal, 0);
    const discountVal = Number(currentValues.discount) || 0;
    const grandTotalCalc = Math.max(subtotalCalc - discountVal, 0);

    const paymentOption: "PAID" | "DUE" =
      currentValues.paymentOption === "DUE" ? "DUE" : "PAID";

    const finalPaidAmount =
      paymentOverride?.amount !== undefined
        ? Number(paymentOverride.amount)
        : paymentOption === "PAID"
          ? (Number(currentValues.paidAmount) > 0 ? Number(currentValues.paidAmount) : grandTotalCalc)
          : (Number(currentValues.paidAmount) || 0);

    const isPaidInFull = finalPaidAmount >= grandTotalCalc;
    const isPartial = finalPaidAmount > 0 && finalPaidAmount < grandTotalCalc;
    const calculatedPaymentStatus = isPaidInFull
      ? SalePaymentStatus.Paid
      : isPartial
        ? SalePaymentStatus.Partial
        : SalePaymentStatus.Pending;

    const calculatedPaymentOption = isPaidInFull ? "PAID" : "DUE";
    const recordedPaidAmount = Math.min(finalPaidAmount, grandTotalCalc);
    const recordedDueAmount = Math.max(grandTotalCalc - finalPaidAmount, 0);

    const customerIdNum = Number(currentValues.customerId);
    const walkInCustomer = customerList.find((c: any) => c.name?.toLowerCase().includes("walk"));
    const finalCustomerId = customerIdNum > 0 ? customerIdNum : (walkInCustomer?.id || (customerList.length > 0 ? customerList[0].id : null));

    const payload: any = {
      reference: currentValues.reference || generateRef(),
      saleDate: currentValues.saleDate || new Date().toISOString().split("T")[0],
      noted: currentValues.noted?.trim() || null,
      customerId: finalCustomerId,
      storeId: Number(currentValues.storeId) || storeList[0]?.id || 1,
      bankId: Number(currentValues.bankId) > 0 ? Number(currentValues.bankId) : null,
      discount: discountVal,
      totalAmount: subtotalCalc,
      grandTotal: grandTotalCalc,
      paidAmount: recordedPaidAmount,
      dueAmount: recordedDueAmount,
      paymentOption: calculatedPaymentOption,
      paymentStatus: calculatedPaymentStatus,
      status: isPaidInFull ? SaleStatus.Completed : SaleStatus.Pending,
      items,
    };

    let savedSaleId = isEditing && id ? Number(id) : (registeredSaleId || 0);
    if ((isEditing && id) || registeredSaleId) {
      await updateSale.mutateAsync({
        id: savedSaleId,
        request: payload,
      });
      if (isEditing) {
        navigate(ROUTERS.SALE);
      }
    } else {
      const createdSale: any = await createSale.mutateAsync(payload);
      const createdSaleData =
        createdSale?.payload?.data ??
        createdSale?.data ??
        createdSale?.payload ??
        createdSale;
      savedSaleId = Number(createdSaleData?.id || 0);
      setRegisteredSaleId(savedSaleId);
    }

    // Handle payment creation for split, multi-row, and direct flows
    if (savedSaleId > 0 && finalPaidAmount > 0) {
      const multiPayments = (paymentOverride as any)?.payments || (paymentOverride as any)?.lines || (paymentOverride as any)?.paymentLines;
      if (Array.isArray(multiPayments) && multiPayments.length > 0) {
        // Multi-method split payment
        try {
          const splitPayload: PaymentRequest = {
            ...paymentOverride,
            saleId: savedSaleId,
            purchaseId: null,
            idempotencyKey:
              (paymentOverride as any).idempotencyKey ||
              `IDEM-SALE-${savedSaleId}-${Date.now()}`,
            totalAmount: recordedPaidAmount,
            amount: recordedPaidAmount,
            lines: multiPayments,
            paymentLines: multiPayments,
            payments: multiPayments,
          };
          await createPayment.mutateAsync(splitPayload);

          if (isPaidInFull) {
            try {
              await completeSale.mutateAsync(savedSaleId);
            } catch (e) {
              // already completed
            }
          }
          await queryClient.invalidateQueries({ queryKey: useProduct.keys.all });
          await queryClient.invalidateQueries({ queryKey: useProductSerial.keys.all });
        } catch (payErr) {
          console.warn("Split payment recording error:", payErr);
        }
      } else {
        // Single payment fallback
        const paymentRequest: PaymentRequest = {
          totalAmount: recordedPaidAmount,
          paymentNo:
            paymentOverride?.paymentNo || `PAY-${payload.reference}-${Date.now()}`,
          paymentMethod: paymentOverride?.paymentMethod || "CASH",
          bankId: paymentOverride?.bankId || null,
          saleId: savedSaleId,
          amount: recordedPaidAmount,
          transactionNo: paymentOverride?.transactionNo || null,
          paymentDate: paymentOverride?.paymentDate || payload.saleDate,
          status: isPaidInFull ? "PAID" : "PARTIAL",
        };

        try {
          const paymentResponse: any = await createPayment.mutateAsync(
            paymentRequest
          );
          const responseStatus = String(
            paymentResponse?.status ??
              paymentResponse?.payload?.status ??
              paymentResponse?.data?.status ??
              ""
          ).toUpperCase();
          const httpStatus = Number(responseStatus);
          const paymentSucceeded =
            !responseStatus ||
            (httpStatus >= 200 && httpStatus < 300) ||
            ["SUCCESS", "SUCCEEDED", "PAID", "COMPLETED"].includes(responseStatus);

          if (paymentSucceeded && isPaidInFull) {
            await completeSale.mutateAsync(savedSaleId);
            await queryClient.invalidateQueries({ queryKey: useProduct.keys.all });
          }
        } catch (payErr) {
          console.warn("Payment recording warning:", payErr);
        }
      }
    }

    if (!isEditing) {
      form.setFieldValue("items", []);
      form.setFieldValue("discount", 0);
      setDiscountInputValue(0);
      setDiscountType("FIXED");
      form.setFieldValue("paidAmount", 0);
      form.setFieldValue("paymentOption", "PAID");
      setIsPaymentModalOpen(false);
      await queryClient.invalidateQueries({ queryKey: useSale.keys.all });
    }

    return savedSaleId;
  };

  const form = useForm({
    defaultValues: {
      reference: generateRef(),
      saleDate: new Date().toISOString().split("T")[0],
      noted: "",
      customerId: 1,
      storeId: storeList[0]?.id || 1,
      bankId: 1,
      discount: 0,
      paidAmount: 0,
      paymentStatus: SalePaymentStatus.Pending,
      status: SaleStatus.Pending,
      paymentOption: "PAID",
      items: [] as any[],
    } as SaleFormValues,

    validators: {
      onSubmit: SaleSchema,
    },

    onSubmit: async ({ value }) => {
      form.setFieldValue("reference", value.reference || generateRef());
      await submitSale();
    },
  });

  /* -------------------------------------------------------
     FORM VALUES & TOTALS
  ------------------------------------------------------- */

  const formValues = useFormStore(form.store, (state) => state.values);

  useEffect(() => {
    if (storeList.length > 0 && !formValues.storeId) {
      form.setFieldValue("storeId", storeList[0].id);
    }
  }, [storeList, formValues.storeId, form]);

  useEffect(() => {
    if (bankList.length > 0 && !formValues.bankId) {
      form.setFieldValue("bankId", bankList[0].id);
    }
  }, [bankList, formValues.bankId, form]);

  useEffect(() => {
    if (customerList.length > 0 && !formValues.customerId) {
      const walkIn = customerList.find((c) =>
        c.name?.toLowerCase().includes("walk")
      );
      if (walkIn) {
        form.setFieldValue("customerId", walkIn.id);
      }
    }
  }, [customerList, formValues.customerId, form]);

  useEffect(() => {
    const itemsTotal = (formValues.items || []).reduce(
      (sum: number, item: any) =>
        sum +
        (Number(item.price) || 0) * (Number(item.quantity) || 0) -
        (Number(item.itemDiscount) || 0),
      0
    );

    const discount = Number(formValues.discount) || 0;
    const grandTotal = Math.max(itemsTotal - discount, 0);
    const paidAmount = Number(formValues.paidAmount) || 0;
    let targetPaid = paidAmount;

    if (!isEditing && (paidAmount === 0 || paidAmount === grandTotal)) {
      targetPaid = grandTotal;
      form.setFieldValue("paidAmount", grandTotal);
    }

    let paymentStatus: SalePaymentStatus = SalePaymentStatus.Pending;
    let saleStatus: SaleStatus = SaleStatus.Pending;

    if (grandTotal > 0 && targetPaid >= grandTotal) {
      paymentStatus = SalePaymentStatus.Paid;
      saleStatus = SaleStatus.Completed;
    } else if (targetPaid > 0 && targetPaid < grandTotal) {
      paymentStatus = SalePaymentStatus.Partial;
      saleStatus = SaleStatus.Pending;
    }

    if (formValues.paymentStatus !== paymentStatus) {
      form.setFieldValue("paymentStatus", paymentStatus);
    }

    if (formValues.status !== saleStatus) {
      form.setFieldValue("status", saleStatus);
    }
  }, [
    formValues.items,
    formValues.discount,
    formValues.paidAmount,
    formValues.paymentStatus,
    formValues.status,
    isEditing,
    form,
  ]);

  /* -------------------------------------------------------
     LOAD EXISTING SALE (EDIT MODE)
  ------------------------------------------------------- */

  useEffect(() => {
    const sale = saleDetail;
    if (!sale || typeof sale !== "object") return;

    form.reset({
      reference: sale.reference ?? generateRef(),
      noted: sale.noted ?? "",
      saleDate: sale.saleDate ?? new Date().toISOString().split("T")[0],
      customerId: sale.customerId ?? sale.customer?.id  ?? 0,
      storeId: sale.storeId ?? sale.store?.id ?? 1,
      bankId: sale.bankId ?? sale.bank?.id ?? 1,
      discount: sale.discount ?? 0,
      paidAmount: sale.paidAmount ?? 0,
      paymentStatus: sale.paymentStatus ?? SalePaymentStatus.Pending,
      status: sale.status ?? SaleStatus.Pending,
      paymentOption: sale.paymentOption ?? "PAID",
      items: sale.items?.length
        ? sale.items.map((item: any) => {
          const price = item.price ?? item.product?.salePrice ?? 0;
          const quantity = item.quantity ?? 1;
          const itemDiscount = item.itemDiscount ?? 0;

          return {
            productId: item.productId ?? item.product?.id ?? 0,
            quantity,
            price,
            itemDiscount,
            subtotal: price * quantity - itemDiscount,
            serialNumberIds: item.serialNumberIds ?? [],
          };
        })
        : [],
    });
  }, [saleDetail, form]);

  /* -------------------------------------------------------
     ADD PRODUCT TO CART
  ------------------------------------------------------- */

  const handleAddProduct = (product: ProductResponse) => {
    const stock = getProductStock(product);
    if (stock <= 0) {
      toast.warning(
        isKm
          ? `ការព្រមាន៖ "${product.name}" គ្មានក្នុងស្តុកទេ!`
          : `Warning: "${product.name}" is out of stock!`
      );
    }

    const isSerialized = isProductSerialized(product);
    const currentItems = form.state.values.items || [];
    const existingIndex = currentItems.findIndex(
      (item: any) => Number(item.productId) === Number(product.id)
    );

    if (existingIndex !== -1) {
      const existing = currentItems[existingIndex];
      const newQuantity = (Number(existing.quantity) || 1) + 1;
      const price = Number(existing.price) || Number(product.salePrice) || 0;

      if (stock > 0 && newQuantity > stock) {
        toast.warning(
          isKm
            ? `ការព្រមាន៖ ចំនួនក្នុងកន្ត្រក (${newQuantity}) លើសពីស្តុកជាក់ស្តែង (${stock})!`
            : `Warning: Cart quantity (${newQuantity}) exceeds stock (${stock})!`
        );
      }

      const updated = [...currentItems];
      updated[existingIndex] = {
        ...existing,
        quantity: newQuantity,
        subtotal: price * newQuantity - (Number(existing.itemDiscount) || 0),
      };
      form.setFieldValue("items", updated);
      if (isSerialized) {
        setActiveSerialRowIndex(existingIndex);
      }
    } else {
      const price = Number(product.salePrice) || 0;
      form.setFieldValue("items", [
        ...currentItems,
        {
          productId: product.id,
          quantity: 1,
          price,
          itemDiscount: 0,
          subtotal: price,
          serialNumberIds: [],
        },
      ]);
      if (isSerialized) {
        setActiveSerialRowIndex(currentItems.length);
      }
    }
  };

  const handleCartBarcodeScan = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const query = cartBarcodeScan.trim().toLowerCase();
      if (!query) return;

      const foundProduct =
        productList.find(
          (p: any) =>
            (p.barcode || p.barCode || "").toLowerCase() === query ||
            (p.code || "").toLowerCase() === query ||
            (p.sku || "").toLowerCase() === query
        ) ||
        productList.find((p: any) => (p.name || "").toLowerCase() === query) ||
        productList.find((p: any) => (p.name || "").toLowerCase().includes(query));

      if (foundProduct) {
        handleAddProduct(foundProduct);
        toast.success(`Added ${foundProduct.name} to cart`);
        setCartBarcodeScan("");
      } else {
        toast.error(`Product "${cartBarcodeScan}" not found`);
      }
    }
  };

  /* -------------------------------------------------------
     FILTER PRODUCTS & CATEGORIES
  ------------------------------------------------------- */

  // Helper to determine if a product belongs to a given category (by ID or Name)
  const isProductMatchingCategory = (
    product: any,
    targetCatIdOrName: string,
    catList: any[]
  ) => {
    if (!targetCatIdOrName || targetCatIdOrName === "All") return true;

    const targetStr = String(targetCatIdOrName).trim().toLowerCase();

    // Find the category definition from listCategory
    const matchedCategory = catList.find(
      (c: any) =>
        String(c.id).trim().toLowerCase() === targetStr ||
        (c.name && String(c.name).trim().toLowerCase() === targetStr) ||
        (c.categoryName && String(c.categoryName).trim().toLowerCase() === targetStr)
    );

    // Target names to match against
    const validNames = new Set<string>();
    validNames.add(targetStr);
    if (matchedCategory?.name) {
      validNames.add(String(matchedCategory.name).trim().toLowerCase());
    }
    if (matchedCategory?.categoryName) {
      validNames.add(String(matchedCategory.categoryName).trim().toLowerCase());
    }

    // Target IDs to match against
    const validIds = new Set<string>();
    validIds.add(targetStr);
    if (matchedCategory?.id != null) {
      validIds.add(String(matchedCategory.id).trim().toLowerCase());
    }

    // Product attributes
    const pCatName = (
      product.categoryName ||
      product.category?.name ||
      product.model?.categoryName ||
      ""
    )
      .trim()
      .toLowerCase();

    const pModelName = (product.modelName || product.model?.name || "")
      .trim()
      .toLowerCase();

    const pCatId =
      product.categoryId != null
        ? String(product.categoryId).trim().toLowerCase()
        : product.category?.id != null
        ? String(product.category.id).trim().toLowerCase()
        : "";

    const pModelCatId =
      product.model?.categoryId != null
        ? String(product.model.categoryId).trim().toLowerCase()
        : "";

    // Check ID match
    if (pCatId && validIds.has(pCatId)) return true;
    if (pModelCatId && validIds.has(pModelCatId)) return true;

    // Check Name match
    if (pCatName && validNames.has(pCatName)) return true;
    if (pModelName && validNames.has(pModelName)) return true;

    return false;
  };

  const stockCounts = useMemo(() => {
    let inStock = 0;
    let outOfStock = 0;
    let lowStock = 0;

    productList.forEach((p) => {
      const stock = getProductStock(p);
      const reorder = Number(p.reorderLevel) || 3;
      if (stock > 0) {
        inStock++;
        if (stock <= reorder) {
          lowStock++;
        }
      } else {
        outOfStock++;
      }
    });

    return {
      all: productList.length,
      inStock,
      outOfStock,
      lowStock,
    };
  }, [productList]);

  const filteredProducts = useMemo(() => {
    const search = productSearch.toLowerCase().trim();
    return productList.filter((product) => {
      const matchesSearch =
        !search ||
        product.name?.toLowerCase().includes(search) ||
        (product as any).code?.toLowerCase().includes(search) ||
        (product as any).sku?.toLowerCase().includes(search);

      const matchesCategory = isProductMatchingCategory(
        product,
        selectedCategory,
        listCategory
      );

      const stock = getProductStock(product);
      const reorder = Number(product.reorderLevel) || 3;

      let matchesStock = true;
      if (stockFilter === "IN_STOCK") {
        matchesStock = stock > 0;
      } else if (stockFilter === "OUT_OF_STOCK") {
        matchesStock = stock <= 0;
      } else if (stockFilter === "LOW_STOCK") {
        matchesStock = stock > 0 && stock <= reorder;
      }

      return matchesSearch && matchesCategory && matchesStock;
    });
  }, [productList, productSearch, selectedCategory, listCategory, stockFilter]);



  const paginatedProducts = filteredProducts;

  const categoriesToDisplay = useMemo(() => {
    const cats: { id: string; name: string; count: number }[] = [
      { id: "All", name: t("pos.all_categories", "All categories"), count: productList.length },
    ];
    listCategory.forEach((cat: any) => {
      const catName = cat.name || cat.categoryName || `Category ${cat.id}`;
      const catIdStr = String(cat.id);
      const count = productList.filter((p: any) =>
        isProductMatchingCategory(p, catIdStr, listCategory)
      ).length;
      cats.push({ id: catIdStr, name: catName, count });
    });
    return cats;
  }, [listCategory, productList, t]);

  const handleVoidCart = () => {
    form.setFieldValue("items", []);
    form.setFieldValue("discount", 0);
    setDiscountInputValue(0);
    setDiscountType("FIXED");
    setRegisteredSaleId(null);
  };

  /* -------------------------------------------------------
     HOLD SALE HANDLERS
  ------------------------------------------------------- */

  const handleHoldSale = () => {
    const currentItems = form.state.values.items || [];
    if (currentItems.length === 0) {
      if (heldSales.length > 0) {
        setIsHeldSalesOpen(true);
      } else {
        toast.info("Cart is empty. Add products before holding a sale.");
      }
      return;
    }

    const currentValues = form.state.values;
    const customer = customerList.find((c) => c.id === Number(currentValues.customerId));
    const customerName = customer?.name || "Walk-In Customer";

    const itemsSummary: HeldSaleItem[] = currentItems.map((item: any) => {
      const p = productList.find((prod) => prod.id === Number(item.productId));
      const price = Number(item.price) || Number(p?.salePrice) || 0;
      const quantity = Number(item.quantity) || 1;
      const itemDiscount = Number(item.itemDiscount) || 0;
      return {
        productId: Number(item.productId),
        productName: p?.name || item.productName || `Product #${item.productId}`,
        quantity,
        price,
        itemDiscount,
        subtotal: price * quantity - itemDiscount,
        serialNumberIds: item.serialNumberIds || [],
      };
    });

    const subtotalCalc = itemsSummary.reduce((sum, it) => sum + it.subtotal, 0);
    const discountVal = Number(currentValues.discount) || 0;
    const totalCalc = Math.max(subtotalCalc - discountVal, 0);

    const newHeld: HeldSale = {
      id: `held-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      reference: currentValues.reference || generateRef(),
      heldAt: new Date().toISOString(),
      note: currentValues.noted || undefined,
      customerId: currentValues.customerId ? Number(currentValues.customerId) : null,
      customerName,
      storeId: Number(currentValues.storeId) || storeList[0]?.id || 1,
      bankId: currentValues.bankId ? Number(currentValues.bankId) : null,
      discount: discountVal,
      items: itemsSummary,
      totalAmount: totalCalc,
    };

    saveHeldSales([newHeld, ...heldSales]);
    form.setFieldValue("items", []);
    form.setFieldValue("discount", 0);
    form.setFieldValue("paidAmount", 0);
    form.setFieldValue("reference", generateRef());
    toast.success(`Order #${newHeld.reference} placed on hold (${newHeld.items.length} items)`);
  };

  const handleResumeHeldSale = (sale: HeldSale) => {
    const currentItems = form.state.values.items || [];
    if (currentItems.length > 0) {
      if (!window.confirm("Current items in cart will be replaced with this held order. Continue?")) {
        return;
      }
    }

    form.setFieldValue("items", sale.items);
    form.setFieldValue("discount", sale.discount || 0);
    form.setFieldValue("reference", sale.reference);
    if (sale.customerId) form.setFieldValue("customerId", sale.customerId);
    if (sale.storeId) form.setFieldValue("storeId", sale.storeId);
    if (sale.bankId) form.setFieldValue("bankId", sale.bankId);
    if (sale.note) form.setFieldValue("noted", sale.note);

    const updated = heldSales.filter((h) => h.id !== sale.id);
    saveHeldSales(updated);
    setIsHeldSalesOpen(false);
    toast.success(`Resumed held order #${sale.reference}`);
  };

  const handleDeleteHeldSale = (id: string) => {
    const updated = heldSales.filter((h) => h.id !== id);
    saveHeldSales(updated);
    toast.info("Held sale discarded");
  };

  const handleClearAllHeldSales = () => {
    saveHeldSales([]);
    setIsHeldSalesOpen(false);
    toast.info("All held sales cleared");
  };

  /* -------------------------------------------------------
     PRINT BILL DATA & HANDLER
  ------------------------------------------------------- */

  const billData: BillData | null = useMemo(() => {
    const currentItems = formValues.items || [];
    if (currentItems.length === 0) return null;

    const matchedStore = storeList.find((s) => s.id === Number(formValues.storeId)) || storeList[0] || null;
    const matchedCustomer = customerList.find((c) => c.id === Number(formValues.customerId));

    const formattedItems: BillItem[] = currentItems.map((item: any) => {
      const p = productList.find((prod) => prod.id === Number(item.productId));
      const price = Number(item.price) || Number(p?.salePrice) || 0;
      const quantity = Number(item.quantity) || 1;
      const itemDiscount = Number(item.itemDiscount) || 0;
      return {
        productName: p?.name || item.productName || `Product #${item.productId}`,
        quantity,
        price,
        itemDiscount,
        subtotal: price * quantity - itemDiscount,
      };
    });

    const subtotalCalc = formattedItems.reduce((sum, it) => sum + it.subtotal, 0);
    const discountVal = Number(formValues.discount) || 0;
    const grandTotalCalc = Math.max(subtotalCalc - discountVal, 0);

    return {
      reference: formValues.reference || "POS-DRAFT",
      date: formValues.saleDate || new Date().toISOString().split("T")[0],
      cashierName: user?.username ?? "Staff",
      customerName: matchedCustomer?.name || "Walk-In Customer",
      customerPhone: matchedCustomer?.phone || undefined,
      store: matchedStore,
      items: formattedItems,
      subtotal: subtotalCalc,
      discount: discountVal,
      grandTotal: grandTotalCalc,
      noted: formValues.noted || null,
    };
  }, [formValues, productList, customerList, storeList, user?.username]);





  const currentItems = formValues.items || [];
  const totalItemsCount = currentItems.reduce(
    (acc: number, it: any) => acc + (Number(it.quantity) || 0),
    0
  );
  const subtotalCalc = currentItems.reduce(
    (sum: number, it: any) =>
      sum + (Number(it.price) || 0) * (Number(it.quantity) || 0) - (Number(it.itemDiscount) || 0),
    0
  );
  const discountVal = Number(formValues.discount) || 0;
  const grandTotalCalc = Math.max(subtotalCalc - discountVal + orderTax, 0);

  /* =========================================================
     RENDER
  ========================================================= */

  const activeStoreName = storeList.find((s) => s.id === Number(formValues.storeId))?.name;
  const hasCartItems = (formValues.items || []).length > 0;
  const hasProductFilters = selectedCategory !== "All" || stockFilter !== "ALL";

  const customerOptions: SearchSelectOption[] = [
    {
      value: "",
      label: t("pos.walk_in_customer", "Walk-In Customer"),
      leading: (
        <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <User className="size-3.5" />
        </span>
      ),
    },
    ...customerList.map((c) => ({
      value: String(c.id),
      label: c.name,
      description: c.phone || undefined,
      leading: <InitialsAvatar name={c.name || "?"} className="size-7 text-[11px]" />,
    })),
  ];

  const stockFilterOptions: { value: StockFilterType; label: string; count: number; dot?: string }[] = [
    { value: "ALL", label: t("pos.stock_all", "All Stock"), count: stockCounts.all },
    { value: "IN_STOCK", label: t("pos.in_stock", "In Stock"), count: stockCounts.inStock, dot: "bg-success" },
    { value: "OUT_OF_STOCK", label: t("pos.out_of_stock", "Out of Stock"), count: stockCounts.outOfStock, dot: "bg-destructive" },
    ...(stockCounts.lowStock > 0
      ? [{ value: "LOW_STOCK" as const, label: t("pos.low_stock", "Low Stock"), count: stockCounts.lowStock, dot: "bg-warning" }]
      : []),
  ];

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background text-foreground">
      {/* 1. TOP BAR — same shell as the dashboard top bar */}
      <header className="reference-topbar z-20 shrink-0">
        <div className="reference-topbar-left">
          <button
            type="button"
            onClick={() => navigate(ROUTERS.DASHBOARD)}
            className="flex min-w-0 cursor-pointer items-center gap-3 rounded-lg text-left"
            title={isKm ? "ត្រឡប់ទៅផ្ទាំងដើម" : "Go to Dashboard"}
          >
            <span className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-card">
              <img
                src="/logo.png"
                alt=""
                className="size-full object-cover"
                onError={(e) => {
                  const target = e.currentTarget;
                  target.style.display = "none";
                  if (target.nextElementSibling) {
                    (target.nextElementSibling as HTMLElement).style.display = "flex";
                  }
                }}
              />
              <span className="hidden size-full items-center justify-center bg-primary-light text-primary">
                <Smartphone className="size-5" />
              </span>
            </span>
            <span className="min-w-0">
              <span className="block truncate text-[15px] leading-5 font-semibold text-foreground">360 Phone Shop</span>
              <span className="block truncate text-[13px] leading-[18px] text-muted-foreground">
                {t("pos.terminal", "POS Terminal")}
                {activeStoreName ? ` · ${activeStoreName}` : ""}
              </span>
            </span>
          </button>
        </div>

        <div className="reference-topbar-actions">
          {/* Register status */}
          {currentRegister ? (
            <>
              <button
                type="button"
                onClick={() => setIsRegisterDetailsOpen(true)}
                className="hidden h-9 cursor-pointer items-center gap-2 rounded-lg border border-border bg-card px-3 text-[14px] font-medium text-foreground transition-colors hover:border-border-strong hover:bg-muted sm:inline-flex"
                title={t("pos.register_details", "Register Details")}
              >
                <span className="size-2 shrink-0 rounded-full bg-success" />
                <span className="tabular-nums">{currentRegister.registerNo}</span>
                <span className="hidden text-muted-foreground tabular-nums md:inline">
                  {formatCurrency(Number(currentRegister.openingBalance || 0))}
                </span>
              </button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsCloseRegisterOpen(true)}
                className="text-destructive hover:bg-destructive/8 hover:text-destructive"
                title={t("pos.close_register", "Close Register")}
              >
                <X />
                <span className="hidden md:inline">{t("pos.close_register", "Close Register")}</span>
              </Button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setIsOpenRegisterOpen(true)}
              className={cn(
                "inline-flex h-9 cursor-pointer items-center gap-2 rounded-lg px-3 text-[14px] font-medium transition-opacity hover:opacity-85",
                statusToneClass.warning
              )}
              title={t("pos.open_register", "Open Register")}
            >
              <span className="size-2 shrink-0 rounded-full bg-current" />
              <span>{t("pos.register_closed", "Register closed")}</span>
            </button>
          )}

          <Button
            type="button"
            variant="ghost"
            onClick={() => setIsTodaySaleOpen(true)}
            className="hidden sm:inline-flex"
          >
            <CalendarCheck />
            <span>{t("pos.today_sale", "Today's Sale")}</span>
          </Button>

          <span className="reference-header-divider reference-actions-divider" aria-hidden="true" />
          <LanguageToggle className="reference-language-toggle" />
          <ThemeToggle className="reference-theme-toggle" />
          <span className="hidden xl:flex">
            <PosClock />
          </span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={toggleFullscreen}
            className="text-text-secondary"
            title={t("pos.fullscreen", "Fullscreen")}
            aria-label={t("pos.fullscreen", "Fullscreen")}
          >
            <Maximize2 />
          </Button>

          {/* Account menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button type="button" className="reference-user-trigger">
                <Avatar className="reference-user-avatar">
                  <ImageCell
                    fileName={user?.profileImage || ""}
                    name={user?.username || ""}
                    bucketName="user"
                    preview={false}
                    className="size-full rounded-full"
                    fallbackSrc="/default-user-avatar.png"
                  />
                </Avatar>
                <span className="reference-user-copy">
                  <strong className="reference-user-name">{user?.username}</strong>
                  <small className="reference-user-role">{t("pos.cashier", "Cashier")}</small>
                </span>
                <ChevronDown className="reference-user-chevron" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 rounded-xl">
              <div className="px-2.5 py-2">
                <p className="truncate text-sm font-semibold text-foreground">{user?.username}</p>
                <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer" onClick={() => navigate(ROUTERS.DASHBOARD)}>
                <LayoutDashboard className="size-4 text-muted-foreground" />
                <span>{isKm ? "ផ្ទាំងគ្រប់គ្រង" : "Dashboard"}</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer" onClick={() => navigate(ROUTERS.PROFILE)}>
                <BadgeCheck className="size-4 text-muted-foreground" />
                <span>{t("user.profile", "Profile")}</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="cursor-pointer text-destructive focus:bg-destructive/8 focus:text-destructive"
                onClick={handleLogout}
              >
                <LogOut className="size-4 text-destructive" />
                <span>{t("user.logout", "Log out")}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Closed shift notice */}
      {!isLoadingRegister && currentRegister === null && (
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-warning/30 bg-warning/10 px-4 py-2.5 text-[14px] text-warning-text md:px-8">
          <div className="flex min-w-0 items-center gap-2.5">
            <AlertTriangle className="size-4 shrink-0" />
            <span className="truncate font-medium">
              {t("pos.register_closed_notice", "Your cash register is closed. Open a shift to start recording sales.")}
            </span>
          </div>
          <Button type="button" size="sm" onClick={() => setIsOpenRegisterOpen(true)}>
            <KeyRound />
            {t("pos.open_register", "Open Register")}
          </Button>
        </div>
      )}

      {/* 2. MAIN POS WORKSPACE SPLIT */}
      <div className="flex min-h-0 flex-1 overflow-hidden">
        {/* ===================================================
            LEFT PANEL: PRODUCT CATALOG & CATEGORIES
        =================================================== */}
        <section className="flex min-w-0 flex-1 flex-col overflow-hidden bg-background">
          {/* Search, stock filter and categories */}
          <div className="shrink-0 space-y-3 border-b border-border bg-card px-4 py-3.5 md:px-6">
            <div className="flex flex-wrap items-center gap-3 lg:flex-nowrap">
              <div className="relative min-w-[220px] flex-1">
                <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  placeholder={t("pos.search_placeholder", "Search product by name or code...")}
                  className="h-10 pr-9 pl-9 text-[14px]"
                />
                {productSearch && (
                  <button
                    type="button"
                    onClick={() => setProductSearch("")}
                    className="absolute top-1/2 right-2 flex size-6 -translate-y-1/2 cursor-pointer items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                    aria-label={t("pos.btn_reset", "Reset")}
                  >
                    <X className="size-3.5" />
                  </button>
                )}
              </div>

              {/* Stock filter — segmented control */}
              <div className="flex shrink-0 items-center gap-0.5 rounded-lg bg-muted p-1 select-none">
                {stockFilterOptions.map((option) => {
                  const isActive = stockFilter === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setStockFilter(option.value)}
                      className={cn(
                        "inline-flex h-8 cursor-pointer items-center gap-2 rounded-md px-3 text-[14px] font-medium whitespace-nowrap transition-colors",
                        isActive
                          ? "bg-card text-foreground shadow-xs"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {option.dot && <span className={cn("size-2 shrink-0 rounded-full", option.dot)} />}
                      <span>{option.label}</span>
                      <span className="text-[13px] text-muted-foreground tabular-nums">{option.count}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Category chips */}
            <div className="no-scrollbar flex items-center gap-2 overflow-x-auto">
              {categoriesToDisplay.map((cat) => {
                const isSelected =
                  selectedCategory === cat.id ||
                  selectedCategory.toLowerCase() === cat.name.toLowerCase() ||
                  (cat.id === "All" && selectedCategory === "All");
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      setSelectedCategory(cat.id);
                    }}
                    className={cn(
                      "inline-flex h-8 shrink-0 cursor-pointer items-center gap-2 rounded-full border px-3.5 text-[14px] font-medium whitespace-nowrap transition-colors",
                      isSelected
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-card text-text-secondary hover:border-border-strong hover:text-foreground"
                    )}
                  >
                    <span>{cat.name}</span>
                    <span className={cn("text-[13px] tabular-nums", isSelected ? "text-primary-foreground/75" : "text-muted-foreground")}>
                      {cat.count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Product grid */}
          <div className="min-h-0 flex-1 overflow-y-auto p-4 md:p-6">
            {paginatedProducts.length === 0 ? (
              <div className="flex h-full items-center justify-center py-10">
                <div className="flex w-full max-w-md flex-col items-center rounded-2xl border border-dashed border-border-strong bg-card px-8 py-10 text-center">
                  <span className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-primary-light text-primary">
                    {productSearch.trim() ? <SearchX className="size-6" /> : <PackageSearch className="size-6" />}
                  </span>
                  <h3 className="text-[17px] leading-6 font-semibold break-words text-foreground">
                    {productSearch.trim()
                      ? t("pos.no_results_for", 'No results for "{query}"').replace("{query}", productSearch.trim())
                      : t("pos.no_products", "No products found")}
                  </h3>
                  <p className="mt-1.5 text-[14px] leading-[22px] text-muted-foreground">
                    {t("pos.no_products_desc", "Try another category or clear your search.")}
                  </p>
                  {(productSearch || hasProductFilters) && (
                    <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
                      {productSearch && (
                        <Button
                          type="button"
                          variant={hasProductFilters ? "outline" : "default"}
                          onClick={() => setProductSearch("")}
                        >
                          <X />
                          {t("pos.clear_search", "Clear search")}
                        </Button>
                      )}
                      {hasProductFilters && (
                        <Button
                          type="button"
                          onClick={() => {
                            setProductSearch("");
                            setSelectedCategory("All");
                            setStockFilter("ALL");
                          }}
                        >
                          <RotateCcw />
                          {t("pos.show_all_products", "Show all products")}
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 xl:grid-cols-4 2xl:grid-cols-5">
                {paginatedProducts.map((product) => {
                  const inCartItem = (formValues.items || []).find(
                    (it: any) => Number(it.productId) === Number(product.id)
                  );
                  const inCartQty = inCartItem ? Number(inCartItem.quantity) || 0 : 0;
                  const code =
                    (product as any).code ||
                    (product as any).sku ||
                    `P-${String(product.id).padStart(4, "0")}`;

                  const stock = getProductStock(product);
                  const reorder = Number(product.reorderLevel) || 3;
                  const isOutOfStock = stock <= 0;
                  const isLowStock = stock > 0 && stock <= reorder;

                  const stockTone = isOutOfStock ? "text-destructive" : isLowStock ? "text-warning-text" : "text-success";
                  const stockDot = isOutOfStock ? "bg-destructive" : isLowStock ? "bg-warning" : "bg-success";
                  const stockLabel = isOutOfStock
                    ? t("pos.out_of_stock", "Out of Stock")
                    : isKm
                      ? `ស្តុក ${stock}`
                      : `${stock} in stock`;

                  return (
                    <div
                      key={product.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => handleAddProduct(product)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          handleAddProduct(product);
                        }
                      }}
                      className={cn(
                        "group relative flex cursor-pointer flex-col rounded-xl border bg-card p-2 shadow-2xs transition-[border-color,box-shadow] duration-150 outline-none select-none hover:shadow-card focus-visible:ring-3 focus-visible:ring-ring/25",
                        inCartQty > 0
                          ? "border-primary ring-1 ring-primary/25"
                          : "border-border hover:border-border-strong"
                      )}
                    >
                      {/* Image */}
                      <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden rounded-lg bg-muted">
                        {product.imageUrl ? (
                          <ImageCell
                            fileName={product.imageUrl}
                            name={product.name || "Product"}
                            bucketName="product"
                            preview={false}
                            showBorder={false}
                            fit="contain"
                            className="flex size-full items-center justify-center overflow-hidden p-2"
                            imageClassName={cn(
                              "size-full object-contain transition-transform duration-200 group-hover:scale-105",
                              isOutOfStock && "opacity-60 grayscale-[35%]"
                            )}
                          />
                        ) : (
                          <Smartphone className="size-8 text-text-disabled" strokeWidth={1.5} />
                        )}

                        {(product.categoryName || product.brandName) && (
                          <span className="absolute top-2 left-2 max-w-[60%] truncate rounded-md bg-card/95 px-2 py-0.5 text-[12px] font-medium text-text-secondary shadow-2xs">
                            {product.categoryName || product.brandName}
                          </span>
                        )}
                        {inCartQty > 0 && (
                          <span className="absolute top-2 right-2 inline-flex h-6 min-w-6 items-center justify-center gap-1 rounded-full bg-primary px-2 text-[12px] font-semibold text-primary-foreground tabular-nums">
                            <Check className="size-3" strokeWidth={3} />
                            {inCartQty}
                          </span>
                        )}
                      </div>

                      {/* Details */}
                      <div className="flex flex-1 flex-col gap-1 px-1 pt-2.5">
                        <h3 className="line-clamp-1 text-[14px] leading-5 font-semibold text-foreground" title={product.name}>
                          {product.name}
                        </h3>
                        <div className="flex min-w-0 items-center gap-1.5 text-[12px] leading-4">
                          <span className="truncate text-muted-foreground tabular-nums">{code}</span>
                          <span className="text-border-strong" aria-hidden="true">•</span>
                          <span className={cn("inline-flex shrink-0 items-center gap-1 font-medium", stockTone)}>
                            <span className={cn("size-1.5 rounded-full", stockDot)} />
                            {stockLabel}
                          </span>
                        </div>
                        <div className="mt-auto flex items-center justify-between pt-1.5">
                          <span className="text-[16px] leading-6 font-semibold text-primary tabular-nums">
                            {formatCurrency(Number(product.salePrice) || 0)}
                          </span>
                          <span
                            className={cn(
                              "flex size-8 items-center justify-center rounded-lg transition-colors",
                              isOutOfStock
                                ? "bg-muted text-text-disabled"
                                : "bg-primary-light text-primary group-hover:bg-primary group-hover:text-primary-foreground"
                            )}
                            aria-hidden="true"
                          >
                            <Plus className="size-4" strokeWidth={2.25} />
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </section>

        {/* ===================================================
            RIGHT PANEL: CURRENT ORDER & CHECKOUT
        =================================================== */}
        <aside className="flex w-full min-w-0 shrink-0 flex-col border-l border-border bg-card lg:w-[40%] xl:w-[36%]">
          {/* Order header: customer, store, scanner */}
          <div className="shrink-0 space-y-3 border-b border-border px-4 py-3.5">
            <div className="flex items-center gap-2">
              <h2 className="text-[16px] leading-6 font-semibold text-foreground">
                {t("pos.current_order", "Current Order")}
              </h2>
              {totalItemsCount > 0 && (
                <span className="rounded-full bg-primary-light px-2 py-0.5 text-[12px] font-semibold text-primary tabular-nums">
                  {totalItemsCount}
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <div className="flex min-w-0 gap-2">
                <SearchSelect
                  value={formValues.customerId ? String(formValues.customerId) : ""}
                  onValueChange={(value) => form.setFieldValue("customerId", Number(value))}
                  options={customerOptions}
                  icon={User}
                  placeholder={t("pos.walk_in_customer", "Walk-In Customer")}
                  searchPlaceholder={t("pos.search_customer", "Search or select customer...")}
                  emptyText={t("pos.no_customer_found", "No customer found")}
                  aria-label={t("pos.customer", "Customer")}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setIsCustomerDialogOpen(true)}
                  className="size-10"
                  title={t("pos.add_customer", "Add Customer")}
                  aria-label={t("pos.add_customer", "Add Customer")}
                >
                  <UserPlus />
                </Button>
              </div>

              <Select
                value={formValues.storeId ? String(formValues.storeId) : ""}
                onValueChange={(value) => form.setFieldValue("storeId", Number(value))}
              >
                <SelectTrigger className="h-10 text-[14px]" aria-label={t("pos.seller", "Seller")}>
                  <StoreIcon className="text-muted-foreground" />
                  <SelectValue placeholder={`${t("pos.seller", "Seller")} (${storeList[0]?.name || "Default"})`} />
                </SelectTrigger>
                <SelectContent>
                  {storeList.map((s) => (
                    <SelectItem key={s.id} value={String(s.id)}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="relative">
              <ScanLine className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={cartBarcodeScan}
                onChange={(e) => setCartBarcodeScan(e.target.value)}
                onKeyDown={handleCartBarcodeScan}
                placeholder={t("pos.scan_barcode", "Scan barcode or enter SKU / serial...")}
                className="h-10 pl-9 text-[14px]"
              />
            </div>
          </div>

          {/* Items */}
          <div className="min-h-0 flex-1 overflow-y-auto">
            {hasCartItems ? (
              <table className="w-full border-collapse text-left">
                <thead className="sticky top-0 z-10 bg-card shadow-[0_1px_0_0_var(--border)]">
                  <tr className="text-[13px] text-muted-foreground">
                    <th className="px-4 py-2.5 font-medium">{t("pos.col_product", "Product")}</th>
                    <th className="w-24 px-2 py-2.5 text-right font-medium">{t("pos.col_price", "Price")}</th>
                    <th className="w-28 px-2 py-2.5 text-center font-medium">{t("pos.col_qty", "Qty")}</th>
                    <th className="w-24 px-2 py-2.5 text-right font-medium">{t("pos.col_subtotal", "Subtotal")}</th>
                    <th className="w-12 py-2.5 pr-3 pl-1">
                      <span className="sr-only">{t("pos.col_action", "Action")}</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {formValues.items.map((_: any, idx: number) => (
                    <PosItemRow
                      key={idx}
                      form={form}
                      index={idx}
                      products={productList}
                      isOpenModal={activeSerialRowIndex === idx}
                      onCloseModal={() => setActiveSerialRowIndex(null)}
                      onRemove={() => {
                        const current = form.state.values.items || [];
                        const updated = current.filter((_: any, i: number) => i !== idx);
                        form.setFieldValue("items", updated);
                      }}
                    />
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="flex h-full flex-col items-center justify-center px-6 py-12 text-center">
                <span className="mb-3 flex size-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
                  <ShoppingCart className="size-6" />
                </span>
                <p className="text-[15px] font-semibold text-foreground">{t("pos.cart_empty_title", "Your cart is empty")}</p>
                <p className="mt-1 max-w-[260px] text-[14px] text-muted-foreground">
                  {t("pos.cart_empty_desc", "Scan a barcode or click products to add to cart")}
                </p>
              </div>
            )}
          </div>

          {/* Totals & actions */}
          <div className="shrink-0 space-y-3 border-t border-border px-4 pt-3.5 pb-4">
            <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-[14px]">
              <div className="flex items-center justify-between gap-2">
                <dt className="text-muted-foreground">{t("pos.summary_items", "Items")}</dt>
                <dd className="font-medium text-foreground tabular-nums">{totalItemsCount}</dd>
              </div>
              <div className="flex items-center justify-between gap-2">
                <dt className="text-muted-foreground">{t("pos.summary_subtotal", "Subtotal")}</dt>
                <dd className="font-medium text-foreground tabular-nums">{formatCurrency(subtotalCalc)}</dd>
              </div>
              <div className="flex items-center justify-between gap-2">
                <dt>
                  <button
                    type="button"
                    onClick={() => setIsDiscountPopoverOpen(true)}
                    className="inline-flex cursor-pointer items-center gap-1.5 font-medium text-primary underline-offset-4 hover:underline"
                  >
                    {t("pos.summary_discount", "Discount")}
                    <Pencil className="size-3.5" />
                  </button>
                </dt>
                <dd className={cn("font-medium tabular-nums", discountVal > 0 ? "text-destructive" : "text-foreground")}>
                  {discountVal > 0 ? `-${formatCurrency(discountVal)}` : formatCurrency(0)}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-2">
                <dt>
                  <button
                    type="button"
                    onClick={() => {
                      setTaxInputValue(orderTax);
                      setIsOrderTaxOpen(true);
                    }}
                    className="inline-flex cursor-pointer items-center gap-1.5 font-medium text-primary underline-offset-4 hover:underline"
                  >
                    {t("pos.summary_tax", "Order Tax")}
                    <Pencil className="size-3.5" />
                  </button>
                </dt>
                <dd className="font-medium text-foreground tabular-nums">{formatCurrency(orderTax)}</dd>
              </div>
            </dl>

            <div className="flex items-end justify-between gap-3 border-t border-dashed border-border pt-3">
              <span className="pb-1 text-[15px] font-semibold text-foreground">
                {t("pos.total_payable", "Total Payable")}
              </span>
              <span className="text-[28px] leading-9 font-bold tracking-[-0.01em] text-foreground tabular-nums">
                {formatCurrency(grandTotalCalc)}
              </span>
            </div>

            <div className="grid grid-cols-[1fr_1fr_1.6fr] gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  if (formValues.items && formValues.items.length > 0) {
                    if (window.confirm("Are you sure you want to cancel and clear the cart?")) {
                      handleVoidCart();
                    }
                  } else {
                    handleVoidCart();
                  }
                }}
                className="h-12 text-[15px] text-destructive hover:border-destructive/40 hover:bg-destructive/5 hover:text-destructive"
              >
                <XCircle className="size-[18px]" />
                {t("pos.btn_cancel", "Cancel")}
              </Button>

              <Button type="button" variant="outline" onClick={handleHoldSale} className="h-12 text-[15px]">
                <PauseCircle className="size-[18px]" />
                {t("pos.btn_hold", "Hold")}
                {heldSales.length > 0 && (
                  <span className="rounded-full bg-primary-light px-1.5 text-[12px] font-semibold text-primary tabular-nums">
                    {heldSales.length}
                  </span>
                )}
              </Button>

              <Button
                type="button"
                onClick={() => {
                  if (!formValues.items || formValues.items.length === 0) {
                    toast.error(t("pos.empty_cart", "Cart is empty. Please add products first."));
                    return;
                  }
                  if (!currentRegister) {
                      toast.error(
                        isKm
                          ? "សូមបើកបញ្ជីសាច់ប្រាក់ (Open Register) ជាមុនសិន មុនពេលទូទាត់ប្រាក់"
                          : "Please open a cash register before completing checkout."
                      );
                      setIsOpenRegisterOpen(true);
                      return;
                    }

                    const missingSerialsItem = (formValues.items || []).find((it: any) => {
                      const prod = productList.find((p: any) => p.id === it.productId);
                      const reqSerial = isProductSerialized(prod);
                      return reqSerial && (it.serialNumberIds || []).length !== it.quantity;
                    });
                    if (missingSerialsItem) {
                      const prod = productList.find((p: any) => p.id === missingSerialsItem.productId);
                      toast.error(`Please select serial numbers for "${prod?.name || "serialized item"}" before payment.`);
                      return;
                    }

                    setIsPaymentModalOpen(true);
                }}
                className="h-12 text-[15px] font-semibold"
              >
                <Banknote className="size-[18px]" />
                {t("pos.btn_payment", "Payment")}
              </Button>
            </div>
          </div>
        </aside>
      </div>

      <PaymentForm
        open={isPaymentModalOpen}
        setOpen={(open) => {
          // When modal closes after a successful payment, refresh stock & sales
          if (!open && paymentSubmittedRef.current) {
            paymentSubmittedRef.current = false;
            void queryClient.invalidateQueries({ queryKey: useProduct.keys.all });
            void queryClient.invalidateQueries({ queryKey: useProductSerial.keys.all });
            void queryClient.invalidateQueries({ queryKey: useSale.keys.all });
            void queryClient.invalidateQueries({ queryKey: useCashRegister.keys.all });
          }
          setIsPaymentModalOpen(open);
        }}
        payment={null}
        mode="sale"
        saleId={isEditing && id ? Number(id) : (registeredSaleId || undefined)}
        orderRef={formValues.reference}
        amount={grandTotalCalc}
        banks={bankList}
        onPaymentSubmit={async (request) => {
          try {
            const savedSaleId = await submitSale(request);
            if (!savedSaleId) return false;
            request.saleId = savedSaleId;
            paymentSubmittedRef.current = true;
            // Navigate to invoice page
            navigate(ROUTERS.SALE_INVOICE.replace(":id", String(savedSaleId)));
            return true;
          } catch (error: any) {
            const errorMsg =
              error?.response?.data?.message ||
              (typeof error?.response?.data === "string" ? error.response.data : null) ||
              error?.message ||
              "Failed to save sale.";
            toast.error(errorMsg);
            return false;
          }
        }}
      />

      {/* 5. Add Customer Modal */}
      <FormCustomer
        open={isCustomerDialogOpen}
        setOpen={setIsCustomerDialogOpen}
        customer={null}
        onCreated={(res: any) => {
          if (res?.payload?.id) {
            form.setFieldValue("customerId", res.payload.id);
          }
        }}
      />

      {/* 6. Print Bill Modal */}
      <PrintBillModal
        open={isPrintBillOpen}
        onOpenChange={setIsPrintBillOpen}
        billData={billData}
      />

      {/* 7. Held Sales Orders Modal */}
      <HeldSalesModal
        open={isHeldSalesOpen}
        onOpenChange={setIsHeldSalesOpen}
        heldSales={heldSales}
        onResume={handleResumeHeldSale}
        onDelete={handleDeleteHeldSale}
        onClearAll={handleClearAllHeldSales}
      />

      {/* 8. Register Details Dialog */}
      <RegisterDetailsModal
        open={isRegisterDetailsOpen}
        onOpenChange={setIsRegisterDetailsOpen}
        register={currentRegister ?? null}
        onOpenCloseModal={() => setIsCloseRegisterOpen(true)}
      />

      {/* 9. Today's Sale Dialog */}
      <TodaySaleModal
        open={isTodaySaleOpen}
        onOpenChange={setIsTodaySaleOpen}
        storeId={storeList[0]?.id}
        storeName={storeList[0]?.name}
        currentRegister={currentRegister ?? null}
      />

      {/* 10. Discount Dialog */}
      <Dialog open={isDiscountPopoverOpen} onOpenChange={setIsDiscountPopoverOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{language === "km" ? "កំណត់ការបញ្ចុះតម្លៃ" : "Set Discount"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center gap-0.5 rounded-lg bg-muted p-1">
              {(["FIXED", "PERCENT"] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => handleToggleDiscountType(type, subtotalCalc, discountVal)}
                  className={cn(
                    "h-8 flex-1 cursor-pointer rounded-md text-[14px] font-medium transition-colors",
                    discountType === type ? "bg-card text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {type === "FIXED"
                    ? (language === "km" ? "$ ប្រាក់ដុល្លារ" : "$ Fixed")
                    : (language === "km" ? "% ភាគរយ" : "% Percent")}
                </button>
              ))}
            </div>
            <div className="space-y-1.5">
              <label className="block text-[14px] font-medium text-foreground">
                {discountType === "FIXED"
                  ? (language === "km" ? "បញ្ចុះតម្លៃជាប្រាក់ដុល្លារ ($)" : "Discount in Dollars ($)")
                  : (language === "km" ? "បញ្ចុះតម្លៃជាភាគរយ (%)" : "Discount in Percent (%)")}
              </label>
              <Input
                type="number"
                min="0"
                step={discountType === "FIXED" ? "0.01" : "1"}
                max={discountType === "PERCENT" ? "100" : undefined}
                value={discountInputValue}
                onChange={(e) =>
                  handleDiscountChange(Number(e.target.value) || 0, discountType, subtotalCalc)
                }
                className="h-10 text-[15px] tabular-nums"
              />
            </div>
            <div className="grid grid-cols-5 gap-2">
              {(discountType === "PERCENT" ? [5, 10, 15, 20, 25] : [1, 2, 5, 10, 20]).map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => handleDiscountChange(preset, discountType, subtotalCalc)}
                  className={cn(
                    "h-9 cursor-pointer rounded-lg border text-[14px] font-medium tabular-nums transition-colors",
                    discountInputValue === preset
                      ? "border-primary bg-primary-light text-primary"
                      : "border-border bg-card text-text-secondary hover:border-border-strong hover:text-foreground"
                  )}
                >
                  {discountType === "PERCENT" ? `${preset}%` : `$${preset}`}
                </button>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" onClick={() => setIsDiscountPopoverOpen(false)}>
              {language === "km" ? "យល់ព្រម" : "Apply"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 11. Order Tax Dialog */}
      <Dialog open={isOrderTaxOpen} onOpenChange={setIsOrderTaxOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{t("pos.order_tax_title", "Order Tax (%)")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <label className="block text-[14px] font-medium text-foreground">
                {language === "km" ? "ចំនួនពន្ធជាប្រាក់ ($)" : "Tax Amount in Dollars ($)"}
              </label>
              <button
                type="button"
                onClick={() => {
                  const calculatedTax = Number((subtotalCalc * 0.1).toFixed(2));
                  setTaxInputValue(calculatedTax);
                }}
                className="cursor-pointer text-[13px] font-medium text-primary underline-offset-4 hover:underline"
              >
                {language === "km" ? "ពន្ធរហ័ស 10%" : "Quick 10% Tax"}
              </button>
            </div>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={taxInputValue}
              onChange={(e) => setTaxInputValue(Number(e.target.value) || 0)}
              className="h-10 text-[15px] tabular-nums"
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              onClick={() => {
                setOrderTax(taxInputValue);
                setIsOrderTaxOpen(false);
              }}
            >
              {language === "km" ? "អនុវត្តពន្ធ" : "Apply Tax"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 12. Close & Open Register Modals */}
      <CloseRegisterModal
        open={isCloseRegisterOpen}
        onOpenChange={setIsCloseRegisterOpen}
        register={currentRegister ?? null}
        onSuccess={() => {
          navigate(ROUTERS.SALE);
        }}
      />

      <OpenRegisterModal
        open={isOpenRegisterOpen}
        onOpenChange={setIsOpenRegisterOpen}
        defaultStoreId={storeList[0]?.id}
      />

      {/* Hidden Submit Form */}
      <form
        id="sale-form"
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
        className="hidden"
      />
    </div>
  );
}

/* ===========================================================
   POS CART ITEM ROW COMPONENT
=========================================================== */

function PosItemRow({
  form,
  index,
  products,
  onRemove,
  isOpenModal,
  onCloseModal,
}: {
  form: any;
  index: number;
  products: ProductResponse[];
  onRemove: () => void;
  isOpenModal: boolean;
  onCloseModal: () => void;
}) {
  const { t } = useLanguage();
  const productId = useFormStore(
    form.store,
    (state: any) => state.values.items[index]?.productId
  );

  const quantity = useFormStore(
    form.store,
    (state: any) => Number(state.values.items[index]?.quantity) || 1
  );

  const price = useFormStore(
    form.store,
    (state: any) => Number(state.values.items[index]?.price) || 0
  );

  const serialNumberIds = useFormStore(
    form.store,
    (state: any) => state.values.items[index]?.serialNumberIds || []
  );

  const [isSerialModalOpen, setIsSerialModalOpen] = useState(isOpenModal);
  const [scanValue, setScanValue] = useState("");
  const modalSearch = "";
  const [serialError, setSerialError] = useState("");

  const selectedProduct = products.find((p) => p.id === Number(productId));
  const hasSerial = isProductSerialized(selectedProduct);

  useEffect(() => {
    if (hasSerial) {
      setIsSerialModalOpen(isOpenModal);
    } else {
      setIsSerialModalOpen(false);
    }
  }, [isOpenModal, hasSerial]);

  /* -------------------------------------------------------
     SERIALS DATA
  ------------------------------------------------------- */

  const { data: serialsResponse } = useProductSerial.useGetAllProductSerial(
    {
      productId: Number(productId),
      page: 0,
      size: 100,
    },
    {
      enabled: hasSerial && Number(productId) > 0,
    }
  );

  const availableSerials = (
    (serialsResponse as any)?.payload?.data ??
    (serialsResponse as any)?.data ??
    []
  ).filter(
    (serial: any) =>
      Number(serial.quantity ?? 0) > 0 && serial.status !== "OUT_OF_STOCK"
  );

  const filteredAvailableSerials = availableSerials.filter((s: any) => {
    if (!modalSearch.trim()) return true;
    const q = modalSearch.toLowerCase();
    const barcode = (s.barcode || s.barCode || s.serialNumber || `ID #${s.id}`).toLowerCase();
    const store = (s.storeName || s.store?.name || "").toLowerCase();
    return barcode.includes(q) || store.includes(q);
  });

  const handleAutoSelect = () => {
    const needed = quantity;
    const autoIds = availableSerials.slice(0, needed).map((s: any) => s.id);
    form.setFieldValue(`items[${index}].serialNumberIds`, autoIds);
    setSerialError("");
  };



  const serialsComplete = !hasSerial || serialNumberIds.length === quantity;

  const toggleSerial = (serial: any) => {
    if (Number(serial.quantity ?? 0) <= 0 || serial.status === "SOLD") {
      setSerialError("This serial is not available.");
      return;
    }

    const current = [...serialNumberIds];
    const targetIndex = current.indexOf(serial.id);

    if (targetIndex >= 0) {
      current.splice(targetIndex, 1);
    } else {
      if (current.length >= quantity) {
        setSerialError(`Maximum ${quantity} serial numbers allowed.`);
        return;
      }
      current.push(serial.id);
    }

    setSerialError("");
    form.setFieldValue(`items[${index}].serialNumberIds`, current);
  };

  const handleModalScan = () => {
    const code = scanValue.trim().toLowerCase();
    if (!code) return;

    const matched = availableSerials.find(
      (serial: any) =>
        (serial.barcode || serial.barCode || "").toLowerCase() === code
    );

    if (!matched) {
      setSerialError("Barcode not found or unavailable.");
      return;
    }

    toggleSerial(matched);
    setScanValue("");
  };

  return (
    <>
      <tr className="border-b border-border transition-colors last:border-b-0 hover:bg-muted/40">
        {/* Product & serials */}
        <td className="px-4 py-3">
          <div className="min-w-0 space-y-1">
            <span
              className="block max-w-[200px] truncate text-[14px] leading-5 font-semibold text-foreground"
              title={selectedProduct?.name}
            >
              {selectedProduct?.name || `Product #${productId}`}
            </span>
            {hasSerial && (
              <button
                type="button"
                onClick={() => setIsSerialModalOpen(true)}
                className={cn(
                  "inline-flex h-6 cursor-pointer items-center gap-1 rounded-full px-2 text-[12px] font-medium tabular-nums transition-opacity hover:opacity-85",
                  serialsComplete ? statusToneClass.success : statusToneClass.warning
                )}
                title="Click to select serial numbers"
              >
                {serialsComplete ? <Check className="size-3" strokeWidth={3} /> : <Hash className="size-3" />}
                <span>
                  {serialNumberIds.length}/{quantity} serials
                </span>
              </button>
            )}
          </div>
        </td>

        {/* Price */}
        <td className="px-2 py-3 text-right text-[14px] text-text-secondary tabular-nums">
          {formatCurrency(price)}
        </td>

        {/* Qty stepper */}
        <td className="px-2 py-3 text-center">
          <div className="mx-auto flex h-8 w-fit items-center overflow-hidden rounded-lg border border-input bg-card shadow-2xs">
            <button
              type="button"
              aria-label="Decrease quantity"
              className="flex size-8 cursor-pointer items-center justify-center text-text-secondary transition-colors hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
              disabled={quantity <= 1}
              onClick={() => {
                if (quantity <= 1) return;
                const newQuantity = quantity - 1;
                form.setFieldValue(`items[${index}].quantity`, newQuantity);
                if (serialNumberIds.length > newQuantity) {
                  form.setFieldValue(
                    `items[${index}].serialNumberIds`,
                    serialNumberIds.slice(0, newQuantity)
                  );
                }
              }}
            >
              <Minus className="size-3.5" />
            </button>
            <span className="w-8 text-center text-[14px] font-semibold text-foreground tabular-nums">
              {quantity}
            </span>
            <button
              type="button"
              aria-label="Increase quantity"
              className="flex size-8 cursor-pointer items-center justify-center text-text-secondary transition-colors hover:bg-muted hover:text-foreground"
              onClick={() => form.setFieldValue(`items[${index}].quantity`, quantity + 1)}
            >
              <Plus className="size-3.5" />
            </button>
          </div>
        </td>

        {/* Subtotal */}
        <td className="px-2 py-3 text-right text-[14px] font-semibold text-foreground tabular-nums">
          {formatCurrency(price * quantity - (Number(form.store.state.values.items[index]?.itemDiscount) || 0))}
        </td>

        {/* Remove */}
        <td className="py-3 pr-3 pl-1 text-center">
          <button
            type="button"
            onClick={onRemove}
            className="mx-auto flex size-8 cursor-pointer items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/8 hover:text-destructive"
            title="Remove item"
            aria-label="Remove item"
          >
            <Trash2 className="size-4" />
          </button>
        </td>
      </tr>

      {/* Serial Numbers Modal - only rendered when product is serialized */}
      {hasSerial && (
        <Dialog
          open={isSerialModalOpen}
          onOpenChange={(open) => {
            setIsSerialModalOpen(open);
            if (!open) onCloseModal();
          }}
        >
        <DialogContent className="sm:max-w-135 max-h-[85vh] p-0 overflow-hidden bg-background rounded-2xl border border-border/60 shadow-2xl flex flex-col">
          {/* Modal Header */}
          <DialogHeader className="px-5 py-4 pr-14 border-b border-border/60 bg-muted/20 shrink-0">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0 space-y-0.5">
                <DialogTitle className="text-base font-bold text-foreground flex items-center gap-2">
                  <Hash className="size-4 text-primary" />
                  Select Serial Numbers
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground truncate">
                  {selectedProduct?.name || `Product ${productId}`}
                </DialogDescription>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span
                  className={`px-2.5 py-1 text-xs font-bold rounded-lg border tabular-nums ${serialsComplete
                    ? "bg-success/10 text-success border-success/20"
                    : "bg-warning/10 text-warning-text border-warning/20"
                    }`}
                >
                  {serialNumberIds.length} / {quantity} {serialsComplete ? t("pos.selected", "selected") : t("pos.needed", "needed")}
                </span>
              </div>
            </div>
          </DialogHeader>

          {/* Scanner & Quick Actions Toolbar */}
          <div className="p-3.5 border-b border-border/60 bg-muted/30 space-y-2.5 shrink-0">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <ScanLine className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  autoFocus
                  value={scanValue}
                  onChange={(e) => setScanValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleModalScan();
                    }
                  }}
                  placeholder="Scan serial or barcode and press Enter..."
                  className="pl-9 h-9 text-xs rounded-xl bg-background border-border/60"
                />
              </div>
              <Button
                type="button"
                size="sm"
                onClick={handleModalScan}
                className="h-9 px-4 rounded-xl text-xs font-semibold"
              >
                Add
              </Button>
            </div>

            {serialError && (
              <div className="flex items-center gap-1.5 text-xs text-destructive font-medium px-1">
                <AlertTriangle className="size-3.5 shrink-0" />
                <span>{serialError}</span>
              </div>
            )}

            {/* Quick action shortcuts */}
            <div className="flex items-center justify-between pt-0.5 text-xs">
              {/* <div className="relative w-44 sm:w-56">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3 text-muted-foreground" />
                <Input
                  value={modalSearch}
                  onChange={(e) => setModalSearch(e.target.value)}
                  placeholder="Filter serials..."
                  className="h-7 pl-7 text-[12px] rounded-lg bg-background border-border/60"
                />
              </div> */}

              <div className="flex items-center gap-1.5">
                {availableSerials.length > 0 && serialNumberIds.length < quantity && (
                  <button
                    type="button"
                    onClick={handleAutoSelect}
                    className="px-2 py-1 text-[12px] font-medium rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition cursor-pointer"
                  >
                    Auto-Fill ({Math.min(quantity, availableSerials.length)})
                  </button>
                )}
                {/* {serialNumberIds.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearSerials}
                    className="px-2 py-1 text-[12px] font-medium rounded-lg text-muted-foreground hover:bg-muted transition cursor-pointer"
                  >
                    Clear All
                  </button>
                )} */}
              </div>
            </div>
          </div>

          {/* Serial List */}
          <div className="max-h-75 overflow-y-auto p-3 space-y-1.5 flex-1">
            {filteredAvailableSerials.length === 0 ? (
              <div className="py-10 text-center text-xs text-muted-foreground">
                {modalSearch
                  ? "No serial numbers matched your filter."
                  : "No active serial numbers found for this product."}
              </div>
            ) : (
              filteredAvailableSerials.map((serial: any) => {
                const isSelected = serialNumberIds.includes(serial.id);
                const barcode = serial.barcode || serial.barCode || serial.serialNumber || `${serial.id}`;
                // const store = serial.storeName || serial.store?.name;

                return (
                  <div
                    key={serial.id}
                    onClick={() => toggleSerial(serial)}
                    className={`flex items-center justify-between p-2.5 rounded-xl border transition cursor-pointer text-xs ${isSelected
                      ? "border-primary bg-primary/10 text-foreground font-semibold shadow-xs"
                      : "border-border/60 hover:bg-muted/40 text-foreground/90"
                      }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`size-4.5 rounded-md border flex items-center justify-center text-[11px] shrink-0 transition-colors ${isSelected
                          ? "bg-primary border-primary text-primary-foreground font-bold"
                          : "border-border/70 bg-background"
                          }`}
                      >
                        {isSelected && "✓"}
                      </div>
                      <span className="font-mono text-xs truncate">{barcode}</span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {/* {store && (
                        <span className="text-[11px] text-muted-foreground bg-muted/60 px-1.5 py-0.5 rounded">
                          {store}
                        </span>
                      )} */}
                      <span className="text-[11px] text-success font-bold bg-success/10 border border-success/20 px-2 py-0.5 rounded">
                        Available
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Modal Footer */}
          <div className="px-5 py-3.5 border-t border-border/60 bg-muted/20 flex items-center justify-between gap-3 shrink-0 rounded-b-2xl">
            <div className="text-xs text-muted-foreground">
              <span className="font-semibold text-foreground">{serialNumberIds.length}</span> of{" "}
              <span className="font-semibold text-foreground">{quantity}</span> selected
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsSerialModalOpen(false);
                  onCloseModal();
                }}
                className="rounded-xl px-4 text-xs font-medium"
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() => {
                  setIsSerialModalOpen(false);
                  onCloseModal();
                }}
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl px-4 text-xs gap-1.5 shadow-sm"
              >
                <Check className="size-3.5" />
                Done
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      )}
    </>
  );
}