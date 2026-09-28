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
  Package,
  Check,
  AlertTriangle,
  AlertCircle,
  User,
  Monitor,
  ListChecks,
  CalendarCheck,
  X,
  XCircle,
  FileText,
  Banknote,
  Edit3,
  MessageSquare,
  Smartphone,
  LogOut,
  ChevronDown,
  LayoutDashboard,
  BadgeCheck,
} from "lucide-react";
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
import { useLanguage } from "@/i18n/LanguageContext";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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

function generateRef() {
  const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, "");
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `POS-${dateStr}-${rand}`;
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
  const [isRegisterDetailsOpen, setIsRegisterDetailsOpen] = useState(false);
  const [isTodaySaleOpen, setIsTodaySaleOpen] = useState(false);
  const [isDiscountPopoverOpen, setIsDiscountPopoverOpen] = useState(false);
  const [orderTax, setOrderTax] = useState(0);
  const [isOrderTaxOpen, setIsOrderTaxOpen] = useState(false);
  const [taxInputValue, setTaxInputValue] = useState(0);
  const [isCloseRegisterOpen, setIsCloseRegisterOpen] = useState(false);
  const [cartBarcodeScan, setCartBarcodeScan] = useState("");

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

  const submitSale = async (paymentOverride?: PaymentRequest): Promise<number> => {
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

    let savedSaleId = isEditing && id ? Number(id) : 0;
    if (isEditing && id) {
      await updateSale.mutateAsync({
        id: Number(id),
        request: payload,
      });
      toast.success("Sale updated successfully!");
      navigate(ROUTERS.SALE);
    } else {
      const createdSale: any = await createSale.mutateAsync(payload);
      const createdSaleData = createdSale?.payload?.data ?? createdSale?.data ?? createdSale?.payload ?? createdSale;
      savedSaleId = Number(createdSaleData?.id || 0);
      toast.success("Sale created successfully!");
    }

    // Handle payment creation for both direct and modal flows
    if (savedSaleId > 0 && finalPaidAmount > 0) {
      const paymentRequest: PaymentRequest = {
        paymentNo: paymentOverride?.paymentNo || `PAY-${payload.reference}-${Date.now()}`,
        paymentMethod: paymentOverride?.paymentMethod || "CASH",
        bankId: paymentOverride?.bankId || null,
        saleId: savedSaleId,
        amount: recordedPaidAmount,
        transactionNo: paymentOverride?.transactionNo || null,
        paymentDate: paymentOverride?.paymentDate || payload.saleDate,
        status: isPaidInFull ? "PAID" : "PARTIAL",
      };

      try {
        const paymentResponse: any = await createPayment.mutateAsync(paymentRequest);
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
      customerId: sale.customerId ?? sale.customer?.id ?? 0,
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
      setActiveSerialRowIndex(existingIndex);
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
      setActiveSerialRowIndex(currentItems.length);
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

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background text-foreground">
      {/* 1. TOP NAVBAR */}
      <header className="h-13 shrink-0 bg-[#f8f9fa] dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-3 md:px-4 flex items-center justify-between z-20">
        {/* Left: Brand Logo (360° Phone Shop like Login) */}
        <div className="flex items-center gap-3">
          <div
            className="flex items-center gap-2.5 select-none group cursor-pointer"
            onClick={() => navigate(ROUTERS.DASHBOARD)}
            title={isKm ? "ត្រឡប់ទៅផ្ទាំងដើម" : "Go to Dashboard"}
          >
            {/* Store Circular Logo Badge */}
            <div className="relative size-9 rounded-full bg-gradient-to-tr from-blue-600 to-sky-400 p-[1.5px] shadow-sm flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <div className="size-full rounded-full bg-white dark:bg-slate-900 overflow-hidden flex items-center justify-center">
                <img
                  src="/logo.png"
                  alt="360° Phone Shop"
                  className="size-full object-cover"
                  onError={(e) => {
                    const target = e.currentTarget;
                    target.style.display = "none";
                    if (target.nextElementSibling) {
                      (target.nextElementSibling as HTMLElement).style.display = "flex";
                    }
                  }}
                />
                <div className="hidden size-full items-center justify-center text-blue-600 dark:text-sky-400 bg-blue-50 dark:bg-blue-950/50">
                  <Smartphone className="size-4.5" />
                </div>
              </div>
            </div>

            {/* Brand Title & Subtitle */}
            <div className="flex flex-col justify-center">
              <div className="flex items-center gap-1.5 leading-none">
                <span className="font-black text-base tracking-tight text-blue-600 dark:text-sky-400 font-sans">
                  360°
                </span>
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-800 dark:text-slate-100 font-sans">
                  Phone Shop
                </span>
              </div>
              <span className="text-[9px] font-semibold tracking-wide text-slate-400 dark:text-slate-500 mt-0.5">
                {isKm ? "ហាងលក់ទូរស័ព្ទដៃទំនើប" : "Smartphones & Accessories"}
              </span>
            </div>
          </div>

          <div className="h-6 w-px bg-slate-300 dark:bg-slate-700 hidden sm:block mx-1" />
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 hidden sm:inline">
            {t("pos.terminal", "POS Terminal")}
          </span>
        </div>

        {/* Right: POS Actions & Cashier Profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          <LanguageToggle className="flex items-center gap-1.5 h-8 px-2.5 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-2xs cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition select-none text-xs font-bold text-slate-800 dark:text-slate-100" />

          <button
            type="button"
            onClick={toggleFullscreen}
            className="p-1.5 text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white rounded hover:bg-slate-200/60 dark:hover:bg-slate-800 transition cursor-pointer"
            title={t("pos.fullscreen", "Toggle Fullscreen")}
          >
            <Monitor className="size-4.5" />
          </button>

          <button
            type="button"
            onClick={() => setIsRegisterDetailsOpen(true)}
            className="hidden sm:flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white font-medium px-2 py-1 rounded hover:bg-slate-200/60 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <ListChecks className="size-4 text-slate-500" />
            <span>{t("pos.register_details", "Register Details")}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsTodaySaleOpen(true)}
            className="hidden sm:flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white font-medium px-2 py-1 rounded hover:bg-slate-200/60 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <CalendarCheck className="size-4 text-slate-500" />
            <span>{t("pos.today_sale", "Today's Sale")}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsCloseRegisterOpen(true)}
            className="flex items-center gap-1 text-xs text-slate-700 dark:text-slate-200 hover:text-rose-600 font-medium px-2 py-1 rounded hover:bg-rose-50 dark:hover:bg-rose-950/30 transition cursor-pointer"
          >
            <X className="size-4 text-rose-500 stroke-[2.5]" />
            <span className="hidden md:inline">{t("pos.close_register", "Close Register")}</span>
          </button>

          {/* User Profile & Logout Dropdown */}
          <div className="flex items-center gap-1 pl-2 border-l border-slate-300 dark:border-slate-700">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-slate-200/60 dark:hover:bg-slate-800 transition cursor-pointer select-none group"
                  title={isKm ? "ព័ត៌មានគណនី និងចាកចេញ" : "Account menu & Logout"}
                >
                  <div className="size-7 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 overflow-hidden flex items-center justify-center font-bold text-xs shrink-0 border border-blue-200 dark:border-blue-800">
                    <User className="size-4" />
                  </div>
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 max-w-[120px] truncate hidden md:inline group-hover:text-blue-600 dark:group-hover:text-sky-400 transition-colors">
                    {user?.username || "younam"}
                  </span>
                  <ChevronDown className="size-3.5 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200 transition-transform hidden sm:inline" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 p-1.5 shadow-xl border border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2.5 p-2 rounded-md bg-slate-50 dark:bg-slate-900 mb-1 border border-slate-100 dark:border-slate-800">
                  <div className="size-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                    <User className="size-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-foreground truncate">
                      {user?.username || "younam"}
                    </p>
                    <p className="text-[10px] text-muted-foreground truncate">
                      {user?.email || "cashier@pos.com"}
                    </p>
                  </div>
                </div>

                <DropdownMenuSeparator className="my-1" />

                <DropdownMenuItem
                  className="cursor-pointer text-xs py-2 px-2.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                  onClick={() => navigate(ROUTERS.DASHBOARD)}
                >
                  <LayoutDashboard className="mr-2 size-4 text-slate-500" />
                  <span>{isKm ? "ផ្ទាំងគ្រប់គ្រង" : "Dashboard"}</span>
                </DropdownMenuItem>

                <DropdownMenuItem
                  className="cursor-pointer text-xs py-2 px-2.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                  onClick={() => navigate(ROUTERS.PROFILE)}
                >
                  <BadgeCheck className="mr-2 size-4 text-slate-500" />
                  <span>{t("user.profile", "Profile")}</span>
                </DropdownMenuItem>

                <DropdownMenuSeparator className="my-1" />

                <DropdownMenuItem
                  className="cursor-pointer text-xs py-2 px-2.5 rounded-md text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 focus:bg-rose-50 dark:focus:bg-rose-950/40 font-semibold transition"
                  onClick={handleLogout}
                >
                  <LogOut className="mr-2 size-4 text-rose-500 stroke-[2.2]" />
                  <span>{t("user.logout", "Log out")}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Direct Quick Logout Button */}
            <button
              type="button"
              onClick={handleLogout}
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition cursor-pointer"
              title={isKm ? "ចាកចេញ (Log out)" : "Log out"}
            >
              <LogOut className="size-4" />
            </button>
          </div>

          <span className="text-xs font-extrabold tracking-wider text-slate-900 dark:text-white px-2.5 py-1 bg-slate-200/80 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded uppercase">
            {storeList.find((s) => s.id === Number(formValues.storeId))?.name || "360SYSTEM"}
          </span>
        </div>
      </header>

      {/* 2. MAIN POS WORKSPACE SPLIT */}
      <div className="flex min-h-0 flex-1 overflow-hidden">
        {/* ===================================================
            LEFT PANEL: PRODUCT CATALOG & CATEGORIES
        =================================================== */}
        <section className="flex-1 flex flex-col min-w-0 bg-[#f4f6f9] dark:bg-slate-950 overflow-hidden">
          {/* Category Filter Pills & Search Bar & Stock Filter */}
          <div className="p-3 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shrink-0 space-y-2">
            <div className="flex items-center gap-2 flex-wrap lg:flex-nowrap">
              {/* Product search input */}
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                <Input
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  placeholder={t("pos.search_placeholder", "Search product by name or code...")}
                  className="pl-9 h-8.5 text-xs bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-md focus-visible:ring-sky-500"
                />
                {productSearch && (
                  <button
                    type="button"
                    onClick={() => setProductSearch("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
                  >
                    ×
                  </button>
                )}
              </div>

              {/* Stock Status Filter Group (All, In Stock, Not Stock, Low Stock) */}
              <div className="flex items-center p-0.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold shrink-0 select-none">
                {/* All */}
                <button
                  type="button"
                  onClick={() => setStockFilter("ALL")}
                  className={`px-2.5 py-1 rounded-md text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    stockFilter === "ALL"
                      ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                  }`}
                  title={isKm ? "បង្ហាញស្តុកទាំងអស់" : "Show all products"}
                >
                  <span>{isKm ? "ស្តុកទាំងអស់" : "All Stock"}</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                    stockFilter === "ALL"
                      ? "bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                      : "bg-slate-200/80 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                  }`}>
                    {stockCounts.all}
                  </span>
                </button>

                {/* In Stock */}
                <button
                  type="button"
                  onClick={() => setStockFilter("IN_STOCK")}
                  className={`px-2.5 py-1 rounded-md text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    stockFilter === "IN_STOCK"
                      ? "bg-emerald-600 text-white shadow-2xs"
                      : "text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                  }`}
                  title={isKm ? "ទំនិញដែលមានក្នុងស្តុក" : "In Stock products"}
                >
                  <span className="size-1.5 rounded-full bg-emerald-500 shrink-0" />
                  <span>{isKm ? "មានស្តុក" : "In Stock"}</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                    stockFilter === "IN_STOCK"
                      ? "bg-emerald-700 text-white"
                      : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                  }`}>
                    {stockCounts.inStock}
                  </span>
                </button>

                {/* Out of Stock (Not Stock) */}
                <button
                  type="button"
                  onClick={() => setStockFilter("OUT_OF_STOCK")}
                  className={`px-2.5 py-1 rounded-md text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    stockFilter === "OUT_OF_STOCK"
                      ? "bg-rose-600 text-white shadow-2xs"
                      : "text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                  }`}
                  title={isKm ? "ទំនិញដែលដាច់ស្តុក/គ្មានស្តុក" : "Out of Stock / Not Stock products"}
                >
                  <span className="size-1.5 rounded-full bg-rose-500 shrink-0" />
                  <span>{isKm ? "ដាច់ស្តុក" : "Not Stock"}</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                    stockFilter === "OUT_OF_STOCK"
                      ? "bg-rose-700 text-white"
                      : "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                  }`}>
                    {stockCounts.outOfStock}
                  </span>
                </button>

                {/* Low Stock (if any exist) */}
                {stockCounts.lowStock > 0 && (
                  <button
                    type="button"
                    onClick={() => setStockFilter("LOW_STOCK")}
                    className={`px-2 py-1 rounded-md text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                      stockFilter === "LOW_STOCK"
                        ? "bg-amber-500 text-white shadow-2xs"
                        : "text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40"
                    }`}
                    title={isKm ? "ទំនិញដែលជិតអស់ស្តុក" : "Low Stock products"}
                  >
                    <span className="size-1.5 rounded-full bg-amber-400 shrink-0" />
                    <span>{isKm ? "ជិតអស់" : "Low"}</span>
                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                      stockFilter === "LOW_STOCK"
                        ? "bg-amber-600 text-white"
                        : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                    }`}>
                      {stockCounts.lowStock}
                    </span>
                  </button>
                )}
              </div>
            </div>

            {/* Category Pills Bar */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-0.5">
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
                      setCurrentPage(1);
                    }}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap transition cursor-pointer ${
                      isSelected
                        ? "bg-[#0b1b32] text-white shadow-xs"
                        : "bg-[#edf0f3] dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                    }`}
                  >
                    <span>{cat.name}</span>
                    <span
                      className={`px-1.5 py-0.2 text-[10px] rounded-full font-bold ${
                        isSelected
                          ? "bg-white/25 text-white"
                          : "bg-slate-300 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
                      }`}
                    >
                      {cat.count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4-Column Product Cards Grid */}
          <div className="flex-1 overflow-y-auto p-3.5 sm:p-4 min-h-0">
            {paginatedProducts.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 py-16">
                <Package className="size-12 mb-3 opacity-25" />
                <p className="text-sm font-semibold">{t("pos.no_products", "No products found")}</p>
                <p className="text-xs text-slate-400 mt-1">
                  {t("pos.no_products_desc", "Try another category or clear your search.")}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-5 gap-2.5 sm:gap-3">
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

                  return (
                    <div
                      key={product.id}
                      onClick={() => handleAddProduct(product)}
                      className={`rounded-xl border overflow-hidden transition-all duration-200 cursor-pointer flex flex-col relative group select-none hover:shadow-md hover:-translate-y-0.5 ${
                        inCartQty > 0
                          ? "bg-emerald-50/15 dark:bg-emerald-950/20 border-emerald-400 dark:border-emerald-500 shadow-xs ring-1 ring-emerald-400/40"
                          : isOutOfStock
                          ? "bg-white dark:bg-slate-900 border-rose-200/80 dark:border-rose-900/60 shadow-2xs hover:border-rose-400"
                          : "bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 shadow-2xs hover:border-blue-400 dark:hover:border-sky-500"
                      }`}
                    >
                      {/* Top Badges (Category + Stock Alert + In Cart) */}
                      <div className="absolute top-1.5 inset-x-1.5 z-10 flex items-center justify-between pointer-events-none gap-1">
                        {/* Category or Brand Pill */}
                        {(product.categoryName || product.brandName) ? (
                          <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-white/95 dark:bg-slate-900/95 text-slate-700 dark:text-slate-300 shadow-2xs backdrop-blur-xs border border-slate-200/60 dark:border-slate-700/60 max-w-[80px] truncate">
                            {product.categoryName || product.brandName}
                          </span>
                        ) : <div />}

                        {/* Top-Right Badges: Stock Alert & In-Cart */}
                        <div className="flex items-center gap-1">
                          {isOutOfStock ? (
                            <span className="inline-flex items-center gap-0.5 bg-rose-600 text-white text-[9px] font-extrabold px-1.5 py-0.2 rounded-full shadow-xs">
                              <AlertTriangle className="size-2.5" />
                              <span>{isKm ? "ដាច់ស្តុក" : "Out of Stock"}</span>
                            </span>
                          ) : isLowStock ? (
                            <span className="inline-flex items-center gap-0.5 bg-amber-500 text-white text-[9px] font-extrabold px-1.5 py-0.2 rounded-full shadow-xs">
                              <AlertCircle className="size-2.5" />
                              <span>{isKm ? `សល់ ${stock}` : `Low: ${stock}`}</span>
                            </span>
                          ) : null}

                          {inCartQty > 0 && (
                            <span className="inline-flex items-center gap-0.5 bg-emerald-600 text-white text-[10px] font-extrabold px-1.5 py-0.2 rounded-full shadow-xs">
                              <Check className="size-2.5 stroke-[3]" />
                              <span>{inCartQty}</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Product Image Showcase - Compact & Clean */}
                      <div className="h-28 sm:h-32 w-full bg-white dark:bg-slate-900/60 p-1.5 overflow-hidden relative flex items-center justify-center">
                        {product.imageUrl ? (
                          <ImageCell
                            fileName={product.imageUrl}
                            name={product.name || "Product"}
                            bucketName="product"
                            preview={false}
                            showBorder={false}
                            fit="contain"
                            className="w-full h-full flex items-center justify-center overflow-hidden"
                            imageClassName={`w-full h-full object-contain filter drop-shadow-sm group-hover:drop-shadow-md scale-100 group-hover:scale-108 transition-all duration-200 ease-out ${
                              isOutOfStock ? "grayscale-[35%] opacity-85" : ""
                            }`}
                          />
                        ) : (
                          <div className="flex flex-col items-center justify-center text-slate-400 dark:text-slate-500">
                            <div className="size-10 rounded-xl bg-slate-50 dark:bg-slate-800 shadow-2xs flex items-center justify-center mb-1 border border-slate-200/60 dark:border-slate-700/60">
                              <Smartphone className="size-5 text-slate-400" />
                            </div>
                            <span className="text-[9px] uppercase font-mono tracking-wider font-semibold">{code}</span>
                          </div>
                        )}
                      </div>

                      {/* Product Details Section - Compact */}
                      <div className="p-2 sm:p-2.5 flex-1 flex flex-col justify-between bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800/70">
                        <div>
                          <h3
                            className="font-bold text-xs text-slate-900 dark:text-slate-100 line-clamp-1 group-hover:text-blue-600 dark:group-hover:text-sky-400 transition-colors leading-tight"
                            title={product.name}
                          >
                            {product.name}
                          </h3>
                          <div className="flex items-center gap-1 mt-0.5 flex-wrap">
                            <span className="inline-block px-1 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-mono text-[9px] tracking-wide">
                              {code}
                            </span>

                            {/* Qty Stock Alert Status Tag */}
                            {isOutOfStock ? (
                              <span className="inline-flex items-center gap-1 text-[9px] font-bold text-rose-600 dark:text-rose-400">
                                <span className="size-1 rounded-full bg-rose-500" />
                                <span>{isKm ? "អស់ស្តុក (0)" : "0 in stock"}</span>
                              </span>
                            ) : isLowStock ? (
                              <span className="inline-flex items-center gap-1 text-[9px] font-bold text-amber-600 dark:text-amber-400">
                                <span className="size-1 rounded-full bg-amber-500" />
                                <span>{isKm ? `ជិតអស់ (${stock})` : `Low (${stock})`}</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[9px] font-medium text-emerald-600 dark:text-emerald-400">
                                <span className="size-1 rounded-full bg-emerald-500" />
                                <span>{isKm ? `ស្តុក: ${stock}` : `${stock} in stock`}</span>
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-800/50 flex items-center justify-between">
                          <span className="text-xs sm:text-sm font-black text-emerald-600 dark:text-emerald-400 font-mono tracking-tight">
                            {formatCurrency(Number(product.salePrice) || 0)}
                          </span>
                          <span className={`size-6 sm:size-7 rounded-full shadow-2xs group-hover:shadow-xs group-hover:scale-105 active:scale-95 transition-all flex items-center justify-center ${
                            isOutOfStock
                              ? "bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500"
                              : "bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-sky-300 group-hover:bg-blue-600 group-hover:text-white dark:group-hover:bg-sky-500"
                          }`}>
                            <Plus className="size-3.5 stroke-[2.5]" />
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
            RIGHT PANEL: CART & CHECKOUT (Mockup Style)
        =================================================== */}
        <aside className="w-full lg:w-[40%] xl:w-[38%] flex flex-col border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 min-w-0 shrink-0">
          {/* Row 1: Customer selector with (+) button */}
          <div className="p-2 border-b border-slate-200 dark:border-slate-800 flex items-center gap-1.5 bg-slate-50/50 dark:bg-slate-900/50">
            <div className="relative flex-1">
              <select
                value={formValues.customerId ? String(formValues.customerId) : ""}
                onChange={(e) => form.setFieldValue("customerId", Number(e.target.value))}
                className="w-full h-8.5 pl-2.5 pr-8 text-xs font-normal bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-sky-500 cursor-pointer"
              >
                <option value="">{t("pos.walk_in_customer", "Walk-In Customer")}</option>
                {customerList.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.phone ? `(${c.phone})` : ""}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              onClick={() => setIsCustomerDialogOpen(true)}
              className="size-8.5 rounded bg-[#17a2b8] hover:bg-[#138496] text-white flex items-center justify-center shrink-0 shadow-2xs transition cursor-pointer"
              title={t("pos.add_customer", "Add New Customer")}
            >
              <Plus className="size-4 stroke-[3]" />
            </button>
          </div>

          {/* Row 2: Seller Selector */}
          <div className="px-2 py-1.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/30">
            <select
              value={formValues.storeId ? String(formValues.storeId) : ""}
              onChange={(e) => form.setFieldValue("storeId", Number(e.target.value))}
              className="w-full h-8 px-2.5 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-slate-600 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-sky-500 cursor-pointer"
            >
              <option value="">{t("pos.seller", "Seller")} ({storeList[0]?.name || "Default"})</option>
              {storeList.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Row 3: Search / Scan Input */}
          <div className="p-2 border-b border-slate-200 dark:border-slate-800">
            <div className="relative">
              <Input
                value={cartBarcodeScan}
                onChange={(e) => setCartBarcodeScan(e.target.value)}
                onKeyDown={handleCartBarcodeScan}
                placeholder={t("pos.scan_barcode", "Scan barcode or enter SKU / serial...")}
                className="h-8.5 text-xs pl-2.5 pr-8 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 rounded placeholder:text-slate-400 focus-visible:ring-1 focus-visible:ring-sky-500"
              />
              <ScanLine className="absolute right-2.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
            </div>
          </div>

          {/* Items Table */}
          <div className="flex-1 overflow-y-auto min-h-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="sticky top-0 bg-slate-50/90 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold border-b border-slate-300 dark:border-slate-700 z-10 shadow-2xs backdrop-blur-xs">
                <tr>
                  <th className="py-2.5 px-3.5 border-b border-slate-300 dark:border-slate-700">{t("pos.col_product", "Product")}</th>
                  <th className="py-2.5 px-2.5 text-right w-20 border-b border-slate-300 dark:border-slate-700">{t("pos.col_price", "Price")}</th>
                  <th className="py-2.5 px-2.5 text-center w-28 border-b border-slate-300 dark:border-slate-700">{t("pos.col_qty", "Qty")}</th>
                  <th className="py-2.5 px-2.5 text-right w-24 border-b border-slate-300 dark:border-slate-700">{t("pos.col_subtotal", "Subtotal")}</th>
                  <th className="py-2.5 px-2 text-center w-10 border-b border-slate-300 dark:border-slate-700">
                    <Trash2 className="size-3.5 mx-auto text-slate-400" />
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {(!formValues.items || formValues.items.length === 0) ? (
                  <tr>
                    <td colSpan={5} className="py-20 text-center text-slate-400 dark:text-slate-500">
                      <ShoppingCart className="size-8 mx-auto mb-2 opacity-30 text-slate-400" />
                      <p className="text-xs font-medium">{t("pos.cart_empty_title", "Cart is empty")}</p>
                      <p className="text-[11px] text-slate-400/80 mt-0.5">
                        {t("pos.cart_empty_desc", "Click products on the left or scan barcode")}
                      </p>
                    </td>
                  </tr>
                ) : (
                  formValues.items.map((_: any, idx: number) => (
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
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* 2x3 Classic Summary Grid */}
          <div className="shrink-0 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs select-none">
            {/* Row 1: Total Items | Total */}
            <div className="grid grid-cols-2 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between p-2.5 border-r border-slate-200 dark:border-slate-700">
                <span className="font-semibold text-slate-700 dark:text-slate-300">{t("pos.summary_items", "Total Items")}</span>
                <span className="font-bold text-slate-900 dark:text-white tabular-nums">
                  {totalItemsCount}
                </span>
              </div>
              <div className="flex items-center justify-between p-2.5">
                <span className="font-semibold text-slate-700 dark:text-slate-300">{t("pos.summary_subtotal", "Total")}</span>
                <span className="font-bold text-slate-900 dark:text-white tabular-nums font-mono">
                  {formatCurrency(subtotalCalc)}
                </span>
              </div>
            </div>

            {/* Row 2: Discount | Order Tax */}
            <div className="grid grid-cols-2 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between p-2.5 border-r border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setIsDiscountPopoverOpen(true)}
                  className="inline-flex items-center gap-1 text-[#0066cc] dark:text-sky-400 font-semibold hover:underline cursor-pointer"
                >
                  <span>{t("pos.summary_discount", "Discount")}</span>
                  <Edit3 className="size-3 text-[#0066cc] dark:text-sky-400" />
                </button>
                <span className="font-bold text-slate-900 dark:text-white tabular-nums font-mono">
                  {discountVal > 0 ? `-${formatCurrency(discountVal)}` : "0"}
                </span>
              </div>
              <div className="flex items-center justify-between p-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setTaxInputValue(orderTax);
                    setIsOrderTaxOpen(true);
                  }}
                  className="inline-flex items-center gap-1 text-[#0066cc] dark:text-sky-400 font-semibold hover:underline cursor-pointer"
                >
                  <span>{t("pos.summary_tax", "Order Tax")}</span>
                  <Edit3 className="size-3 text-[#0066cc] dark:text-sky-400" />
                </button>
                <span className="font-bold text-slate-900 dark:text-white tabular-nums font-mono">
                  {orderTax > 0 ? formatCurrency(orderTax) : "0"}
                </span>
              </div>
            </div>

            {/* Row 3: Total Payable (Full Width) */}
            <div className="flex items-center justify-between px-3 py-2.5 bg-[#eaf4ea] dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-100">
              <div className="flex items-center gap-1.5 font-bold text-sm text-emerald-900 dark:text-emerald-300">
                <span>{t("pos.total_payable", "Total Payable")}</span>
                <MessageSquare className="size-3.5 fill-emerald-600 text-emerald-600" />
              </div>
              <span className="font-black text-base md:text-lg text-emerald-800 dark:text-emerald-200 tabular-nums font-mono">
                {formatCurrency(grandTotalCalc)}
              </span>
            </div>
          </div>

          {/* 3 Bottom Action Buttons with distinct colored backgrounds (shifted up with padding) */}
          <div className="p-2 pb-3.5 sm:pb-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 shrink-0">
            <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
              <button
                type="button"
                onClick={() => {
                  if (formValues.items && formValues.items.length > 0) {
                    if (window.confirm("Are you sure you want to cancel and clear the cart?")) {
                      handleVoidCart();
                    }
                  } else {
                    handleVoidCart();
                  }
                }}
                className="h-10 sm:h-11 rounded-xl flex items-center justify-center gap-1.5 text-xs font-bold text-white bg-rose-500 hover:bg-rose-600 active:bg-rose-700 transition cursor-pointer shadow-xs select-none"
              >
                <XCircle className="size-4 text-white fill-white/20" />
                <span>{t("pos.btn_cancel", "Cancel")}</span>
              </button>

              <button
                type="button"
                onClick={handleHoldSale}
                className="h-10 sm:h-11 rounded-xl flex items-center justify-center gap-1.5 text-xs font-bold text-white bg-amber-500 hover:bg-amber-600 active:bg-amber-700 transition cursor-pointer shadow-xs select-none"
              >
                <FileText className="size-4 text-white" />
                <span>{t("pos.btn_hold", "Hold")}</span>
                {heldSales.length > 0 && (
                  <span className="ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] bg-white text-amber-700 font-extrabold shadow-2xs">
                    {heldSales.length}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  if (!formValues.items || formValues.items.length === 0) {
                    toast.error(t("pos.empty_cart", "Cart is empty. Please add products first."));
                    return;
                  }
                  setIsPaymentModalOpen(true);
                }}
                className="h-10 sm:h-11 rounded-xl flex items-center justify-center gap-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 transition cursor-pointer shadow-xs select-none"
              >
                <span>{t("pos.btn_payment", "Payment")}</span>
                <Banknote className="size-4 text-white stroke-[2.5]" />
              </button>
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
          }
          setIsPaymentModalOpen(open);
        }}
        payment={null}
        mode="sale"
        saleId={isEditing && id ? Number(id) : undefined}
        orderRef={formValues.reference}
        amount={grandTotalCalc}
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
      <Dialog open={isRegisterDetailsOpen} onOpenChange={setIsRegisterDetailsOpen}>
        <DialogContent className="sm:max-w-md bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-0 overflow-hidden">
          <DialogHeader className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <ListChecks className="size-5 text-sky-600" />
              {t("pos.register_details", "Register Details")}
            </DialogTitle>
          </DialogHeader>
          <div className="p-4 space-y-3 text-xs">
            <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
              <span className="text-muted-foreground">{language === "km" ? "អ្នកគិតប្រាក់:" : "Cashier:"}</span>
              <span className="font-semibold text-foreground">{user?.username || "Wintech Cambodia"}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
              <span className="text-muted-foreground">{language === "km" ? "ហាង/បញ្ជរ:" : "Store / Counter:"}</span>
              <span className="font-semibold text-foreground">{storeList[0]?.name || "CAFA"}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
              <span className="text-muted-foreground">{language === "km" ? "ម៉ោងបើក:" : "Opening Time:"}</span>
              <span className="font-semibold text-foreground">{language === "km" ? "ថ្ងៃនេះ ម៉ោង 08:00 ព្រឹក" : "Today at 08:00 AM"}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
              <span className="text-muted-foreground">{language === "km" ? "សាច់ប្រាក់ដើមគ្រា:" : "Opening Cash:"}</span>
              <span className="font-semibold font-mono text-emerald-600">$100.00</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
              <span className="text-muted-foreground">{language === "km" ? "ការលក់សាច់ប្រាក់:" : "Cash Sales:"}</span>
              <span className="font-semibold font-mono text-foreground">$450.00</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
              <span className="text-muted-foreground">{language === "km" ? "ការលក់តាមធនាគារ/QR:" : "Bank / QR Sales:"}</span>
              <span className="font-semibold font-mono text-foreground">$620.00</span>
            </div>
            <div className="flex justify-between py-2 bg-emerald-50 dark:bg-emerald-950/40 px-3 rounded-lg font-bold text-sm text-emerald-700 dark:text-emerald-300">
              <span>{language === "km" ? "សរុបសាច់ប្រាក់ក្នុងបញ្ជរបច្ចុប្បន្ន:" : "Current Register Total:"}</span>
              <span className="font-mono">$1,170.00</span>
            </div>
          </div>
          <div className="p-3 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex justify-end">
            <Button size="sm" variant="outline" onClick={() => setIsRegisterDetailsOpen(false)}>
              {language === "km" ? "បិទ" : "Close"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 9. Today's Sale Dialog */}
      <Dialog open={isTodaySaleOpen} onOpenChange={setIsTodaySaleOpen}>
        <DialogContent className="sm:max-w-md bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-0 overflow-hidden">
          <DialogHeader className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <CalendarCheck className="size-5 text-emerald-600" />
              {t("pos.today_sale", "Today's Sales Report")}
            </DialogTitle>
          </DialogHeader>
          <div className="p-4 space-y-3 text-xs">
            <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
              <span className="text-muted-foreground">{language === "km" ? "កាលបរិច្ឆេទ:" : "Date:"}</span>
              <span className="font-semibold">
                {new Date().toLocaleDateString(language === "km" ? "km-KH" : "en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
              <span className="text-muted-foreground">{language === "km" ? "វិក្កយបត្រសរុប:" : "Total Invoices:"}</span>
              <span className="font-semibold">18 Orders</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
              <span className="text-muted-foreground">{language === "km" ? "ការលក់សរុប:" : "Gross Sales:"}</span>
              <span className="font-semibold font-mono">$1,450.00</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
              <span className="text-muted-foreground">{language === "km" ? "បញ្ចុះតម្លៃសរុប:" : "Discounts Given:"}</span>
              <span className="font-semibold font-mono text-rose-500">-$45.00</span>
            </div>
            <div className="flex justify-between py-2 bg-sky-50 dark:bg-sky-950/40 px-3 rounded-lg font-bold text-sm text-sky-700 dark:text-sky-300">
              <span>{language === "km" ? "ចំណូលសុទ្ធ:" : "Net Revenue:"}</span>
              <span className="font-mono">$1,405.00</span>
            </div>
          </div>
          <div className="p-3 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex justify-end">
            <Button size="sm" variant="outline" onClick={() => setIsTodaySaleOpen(false)}>
              {language === "km" ? "បិទ" : "Close"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 10. Discount Dialog */}
      <Dialog open={isDiscountPopoverOpen} onOpenChange={setIsDiscountPopoverOpen}>
        <DialogContent className="sm:max-w-xs bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
          <DialogHeader className="pb-2">
            <DialogTitle className="text-sm font-bold flex items-center gap-1.5">
              <Edit3 className="size-4 text-sky-600" />
              {language === "km" ? "កំណត់ការបញ្ចុះតម្លៃ" : "Set Discount"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
              <button
                type="button"
                onClick={() => handleToggleDiscountType("FIXED", subtotalCalc, discountVal)}
                className={`flex-1 py-1.5 text-xs font-bold rounded-md transition cursor-pointer ${
                  discountType === "FIXED"
                    ? "bg-white dark:bg-slate-700 text-sky-600 shadow-xs"
                    : "text-muted-foreground"
                }`}
              >
                {language === "km" ? "$ ប្រាក់ដុល្លារ" : "$ Fixed"}
              </button>
              <button
                type="button"
                onClick={() => handleToggleDiscountType("PERCENT", subtotalCalc, discountVal)}
                className={`flex-1 py-1.5 text-xs font-bold rounded-md transition cursor-pointer ${
                  discountType === "PERCENT"
                    ? "bg-white dark:bg-slate-700 text-sky-600 shadow-xs"
                    : "text-muted-foreground"
                }`}
              >
                {language === "km" ? "% ភាគរយ" : "% Percent"}
              </button>
            </div>
            <div>
              <label className="text-[11px] text-muted-foreground font-medium mb-1 block">
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
                className="h-9 text-sm font-mono"
              />
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              {discountType === "PERCENT"
                ? [5, 10, 15, 20, 25].map((pct) => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => handleDiscountChange(pct, "PERCENT", subtotalCalc)}
                      className="px-2 py-0.5 text-xs rounded bg-slate-100 dark:bg-slate-800 hover:bg-sky-50 hover:text-sky-600 font-medium cursor-pointer"
                    >
                      {pct}%
                    </button>
                  ))
                : [1, 2, 5, 10, 20].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => handleDiscountChange(amt, "FIXED", subtotalCalc)}
                      className="px-2 py-0.5 text-xs rounded bg-slate-100 dark:bg-slate-800 hover:bg-sky-50 hover:text-sky-600 font-medium font-mono cursor-pointer"
                    >
                      ${amt}
                    </button>
                  ))}
            </div>
            <div className="pt-2 flex justify-end">
              <Button
                size="sm"
                onClick={() => setIsDiscountPopoverOpen(false)}
                className="h-8 text-xs bg-sky-600 hover:bg-sky-700 text-white"
              >
                {language === "km" ? "យល់ព្រម" : "Apply"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 11. Order Tax Dialog */}
      <Dialog open={isOrderTaxOpen} onOpenChange={setIsOrderTaxOpen}>
        <DialogContent className="sm:max-w-xs bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
          <DialogHeader className="pb-2">
            <DialogTitle className="text-sm font-bold flex items-center gap-1.5">
              <Edit3 className="size-4 text-sky-600" />
              {t("pos.order_tax_title", "Order Tax (%)")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <div>
              <label className="text-[11px] text-muted-foreground font-medium mb-1 block">
                {language === "km" ? "ចំនួនពន្ធជាប្រាក់ ($)" : "Tax Amount in Dollars ($)"}
              </label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={taxInputValue}
                onChange={(e) => setTaxInputValue(Number(e.target.value) || 0)}
                className="h-9 text-sm font-mono"
              />
            </div>
            <div className="pt-2 flex justify-between items-center">
              <button
                type="button"
                onClick={() => {
                  const calculatedTax = Number((subtotalCalc * 0.1).toFixed(2));
                  setTaxInputValue(calculatedTax);
                }}
                className="text-xs text-sky-600 hover:underline cursor-pointer"
              >
                {language === "km" ? "ពន្ធរហ័ស 10%" : "Quick 10% Tax"}
              </button>
              <Button
                size="sm"
                onClick={() => {
                  setOrderTax(taxInputValue);
                  setIsOrderTaxOpen(false);
                }}
                className="h-8 text-xs bg-sky-600 hover:bg-sky-700 text-white"
              >
                {language === "km" ? "អនុវត្តពន្ធ" : "Apply Tax"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 12. Close Register Confirmation Dialog */}
      <Dialog open={isCloseRegisterOpen} onOpenChange={setIsCloseRegisterOpen}>
        <DialogContent className="sm:max-w-xs bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
          <DialogHeader className="pb-2">
            <DialogTitle className="text-sm font-bold flex items-center gap-1.5 text-rose-600">
              <XCircle className="size-4" />
              {language === "km" ? "បិទវេនបញ្ជរ?" : "Close Register?"}
            </DialogTitle>
          </DialogHeader>
          <p className="text-xs text-muted-foreground">
            {language === "km"
              ? "តើអ្នកប្រាកដជាចង់បិទវេនបញ្ជរនេះមែនទេ? វានឹងបញ្ចប់របាយការណ៍វេនរបស់អ្នក។"
              : "Are you sure you want to close this register session? This will finalize your shift summary."}
          </p>
          <div className="pt-4 flex justify-end gap-2">
            <Button size="sm" variant="outline" onClick={() => setIsCloseRegisterOpen(false)}>
              {t("common.cancel", "Cancel")}
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => {
                setIsCloseRegisterOpen(false);
                toast.success(
                  language === "km"
                    ? "វេនបញ្ជរត្រូវបានបិទដោយជោគជ័យ។"
                    : "Register session closed successfully."
                );
                navigate(ROUTERS.SALE);
              }}
            >
              {language === "km" ? "បិទបញ្ជរ" : "Close Register"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

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

  useEffect(() => {
    setIsSerialModalOpen(isOpenModal);
  }, [isOpenModal]);

  const selectedProduct = products.find((p) => p.id === Number(productId));

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
      enabled: Number(productId) > 0,
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



  const serialsComplete = serialNumberIds.length === quantity;

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
      {/* Data row with clear border */}
      <tr className="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
        {/* 1. Product Name & Serials */}
        <td className="px-3.5 py-2.5">
          <div className="space-y-0.5">
            <span
              className="font-bold text-xs text-slate-800 dark:text-slate-100 truncate block max-w-[170px]"
              title={selectedProduct?.name}
            >
              {selectedProduct?.name || `Product #${productId}`}
            </span>
            {serialNumberIds.length > 0 && (
              <button
                type="button"
                onClick={() => setIsSerialModalOpen(true)}
                className="inline-flex items-center gap-0.5 text-[10px] text-primary hover:underline font-mono"
              >
                <Hash className="size-2.5" />
                <span>{serialNumberIds.length} serial{serialNumberIds.length > 1 ? "s" : ""}</span>
              </button>
            )}
          </div>
        </td>

        {/* 2. Price */}
        <td className="px-2.5 py-2.5 text-right">
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 tabular-nums font-mono">
            {formatCurrency(price)}
          </span>
        </td>

        {/* 3. Qty Stepper with borders */}
        <td className="px-2.5 py-2.5 text-center">
          <div className="flex items-center justify-center border border-slate-300 dark:border-slate-600 rounded-lg overflow-hidden h-7 bg-white dark:bg-slate-800 w-fit mx-auto shadow-2xs">
            <button
              type="button"
              className="size-7 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition cursor-pointer border-r border-slate-200 dark:border-slate-700"
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
              <Minus className="size-3" />
            </button>
            <span className="w-8 text-center text-xs font-bold font-mono text-slate-800 dark:text-slate-200 bg-slate-50/50 dark:bg-slate-800/50">
              {quantity}
            </span>
            <button
              type="button"
              className="size-7 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition cursor-pointer border-l border-slate-200 dark:border-slate-700"
              onClick={() => form.setFieldValue(`items[${index}].quantity`, quantity + 1)}
            >
              <Plus className="size-3" />
            </button>
          </div>
        </td>

        {/* 4. Subtotal */}
        <td className="px-2.5 py-2.5 text-right">
          <span className="text-xs font-bold text-slate-900 dark:text-white tabular-nums font-mono">
            {formatCurrency(price * quantity - (Number(form.store.state.values.items[index]?.itemDiscount) || 0))}
          </span>
        </td>

        {/* 5. Delete with border */}
        <td className="px-2 py-2.5 text-center">
          <button
            type="button"
            onClick={onRemove}
            className="size-7 rounded-md border border-slate-200 dark:border-slate-700 hover:border-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-400 hover:text-rose-600 transition flex items-center justify-center mx-auto cursor-pointer"
            title="Remove item"
          >
            <Trash2 className="size-3.5" />
          </button>
        </td>
      </tr>

      {/* Serial Numbers Modal */}
      <Dialog
        open={isSerialModalOpen}
        onOpenChange={(open) => {
          setIsSerialModalOpen(open);
          if (!open) onCloseModal();
        }}
      >
        <DialogContent className="sm:max-w-135 max-h-[85vh] p-0 overflow-hidden bg-background rounded-2xl border border-border/60 shadow-2xl flex flex-col">
          {/* Modal Header */}
          <DialogHeader className="px-5 py-4 border-b border-border/60 bg-muted/20 shrink-0">
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
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                    : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                    }`}
                >
                  {serialNumberIds.length} / {quantity} {serialsComplete ? "✓ Selected" : "needed"}
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
              <div className="flex items-center gap-1.5 text-xs text-rose-500 font-medium px-1">
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
                  className="h-7 pl-7 text-[11px] rounded-lg bg-background border-border/60"
                />
              </div> */}

              <div className="flex items-center gap-1.5">
                {availableSerials.length > 0 && serialNumberIds.length < quantity && (
                  <button
                    type="button"
                    onClick={handleAutoSelect}
                    className="px-2 py-1 text-[11px] font-medium rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition cursor-pointer"
                  >
                    Auto-Fill ({Math.min(quantity, availableSerials.length)})
                  </button>
                )}
                {/* {serialNumberIds.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearSerials}
                    className="px-2 py-1 text-[11px] font-medium rounded-lg text-muted-foreground hover:bg-muted transition cursor-pointer"
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
                        className={`size-4.5 rounded-md border flex items-center justify-center text-[10px] shrink-0 transition-colors ${isSelected
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
                        <span className="text-[10px] text-muted-foreground bg-muted/60 px-1.5 py-0.5 rounded">
                          {store}
                        </span>
                      )} */}
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
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
    </>
  );
}