"use client";

import * as React from "react";
import {
  Package,
  LayoutGrid,
  Layers,
  Box,
  PlusCircle,
  ShoppingCart,
  Shield,
  StoreIcon,
  Wallet,
  Coins,
  ShoppingBag,
  CreditCard,
  Boxes,
  Users,
  BadgeDollarSign,
  Settings,
  LayoutDashboard,
  Receipt,
  FileText,
  RotateCcw,
  ChevronsLeft,
  LogOut,
  Building,
} from "lucide-react";

import { NavMain } from "@/components/layout/nav-main";
import { NavPrimaryColor } from "@/components/layout/nav-primary-color";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useLogout } from "@/hooks/useLogout";
import { useLanguage } from "@/i18n/LanguageContext";
import { PERMISSION } from "@/constants/Permission";
import { usePermission } from "@/utils/UsePermission";

import { ROUTERS } from "@/constants/Route";
import { useAuth } from "@/store/useAuth";
import { useStore } from "@/hooks/inventory/useStore";
import { ImageCell } from "@/components/file/ImageCell";

const data = {
  navMain: [
    {
      title: "Dashboard",
      url: ROUTERS.DASHBOARD,
      icon: LayoutDashboard,
      // permission: PERMISSION.DASHBOARD.READ,
    },
    {
      title: "POS",
      url: ROUTERS.SALE_CREATE,
      icon: LayoutDashboard,
      permission: PERMISSION.SALE.CREATE,
    },
    {
      title: "Products",
      url: "#",
      icon: Package,
      isActive: true,
      badge: undefined as string | undefined,
      items: [
        {
          title: "List Product",
          url: ROUTERS.PRODUCT,
          icon: Box,
          permission: PERMISSION.PRODUCT.READ,
        },
        {
          title: "Create Product",
          url: `${ROUTERS.PRODUCT}/create`,
          icon: PlusCircle,
          permission: PERMISSION.PRODUCT.CREATE,
        },
        {
          title: "Stock",
          url: ROUTERS.STOCK,
          icon: Boxes,
          permission: PERMISSION.STOCK.READ,
        },
      ],
    },
    {
      title: "Expenses",
      url: "#",
      icon: Wallet,
      badge: undefined as string | undefined,
      items: [
        {
          title: "Expense Type",
          url: ROUTERS.EXPENSE_TYPE,
          icon: LayoutGrid,
          permission: PERMISSION.EXPENSES_TYPE.READ,
        },
        {
          title: "Expense",
          url: ROUTERS.EXPENSE,
          icon: CreditCard,
          permission: PERMISSION.EXPENSE.READ,
        },
      ],
    },
    {
      title: "Catalog Setup",
      url: "#",
      icon: Settings,
      items: [
        {
          title: "Category",
          url: ROUTERS.CATEGORY,
          icon: LayoutGrid,
          permission: PERMISSION.CATEGORY.READ,
        },
        {
          title: "Brand",
          url: ROUTERS.BRAND,
          icon: Layers,
          permission: PERMISSION.BRAND.READ,
        },
        {
          title: "Model",
          url: ROUTERS.MODEL,
          icon: Layers,
          permission: PERMISSION.MODEL.READ,
        },
        {
          title: "Variant Type",
          url: ROUTERS.VARIANT_TYPE,
          icon: LayoutGrid,
          permission: PERMISSION.VARIANT_TYPE.READ,
        },
        {
          title: "Variant Value",
          url: ROUTERS.VARIANT_VALUE,
          icon: Layers,
          permission: PERMISSION.VARIANT_VALUE.READ,
        },
        {
          title: "Store",
          url: ROUTERS.STORE,
          icon: StoreIcon,
          permission: PERMISSION.STORE.READ,
        },
      ],
    },
    {
      title: "Purchases",
      url: "#",
      icon: ShoppingCart,
      badge: undefined as string | undefined,
      items: [
        {
          title: "Purchase",
          url: ROUTERS.PURCHASE,
          icon: ShoppingBag,
          permission: PERMISSION.PURCHASE.READ,
        },
        {
          title: "Create Purchase",
          url: `${ROUTERS.PURCHASE}/create`,
          icon: PlusCircle,
          permission: PERMISSION.PURCHASE.CREATE,
        },
        {
          title: "Purchase Payment",
          url: ROUTERS.PURCHASE_PAYMENT,
          icon: CreditCard,
          permission: PERMISSION.PURCHASE.READ,
        },
        {
          title: "Suppliers",
          url: ROUTERS.SUPPLIER,
          icon: Users,
          permission: PERMISSION.SUPPLIER.READ,
        },
      ],
    },
    {
      title: "Sales",
      url: "#",
      icon: BadgeDollarSign,
      badge: undefined as string | undefined,
      items: [
        {
          title: "Customers",
          url: ROUTERS.CUSTOMER,
          icon: Users,
          permission: PERMISSION.CUSTOMER.READ,
        },
        {
          title: "List Sales",
          url: ROUTERS.SALE,
          icon: ShoppingCart,
          permission: PERMISSION.SALE.READ,
        },
        {
          title: "Sales Return",
          url: ROUTERS.SALE_RETURN,
          icon: RotateCcw,
          permission: PERMISSION.SALE.READ,
        },
        {
          title: "Create Sale",
          url: ROUTERS.SALE_CREATE,
          icon: PlusCircle,
          permission: PERMISSION.SALE.CREATE,
        },
        {
          title: "Cash Registers",
          url: ROUTERS.CASH_REGISTER,
          icon: Receipt,
          permission: PERMISSION.SALE.READ,
        },
        {
          title: "Payments",
          url: ROUTERS.PAYMENT,
          icon: CreditCard,
          permission: PERMISSION.PAYMENT.READ,
        },
        // {
        //   title: "Quote",
        //   url: ROUTERS.QUOTE,
        //   icon: FileText,
        //   // permission: PERMISSION.QUOTE.READ,
        // },
        // {
        //   title: "Create Quote",
        //   url: ROUTERS.QUOTE_CREATE,
        //   icon: PlusCircle,
        //   // permission: PERMISSION.QUOTE.CREATE,
        // },
      ],
    },
    {
      title: "Finance",
      url: "#",
      icon: Wallet,
      badge: undefined as string | undefined,
      items: [
        {
          title: "Currency",
          url: ROUTERS.CURRENCY,
          icon: Coins,
          permission: PERMISSION.CURRENCY.READ,
        },
        {
          title: "Bank",
          url: ROUTERS.BANK,
          icon: Building,
          permission: PERMISSION.BANK.READ,
        },
      ],
    },
    {
      title: "People",
      url: "#",
      icon: Users,
      badge: undefined as string | undefined,
      items: [
        {
          title: "User",
          url: ROUTERS.USER,
          icon: Users,
          permission: PERMISSION.USER.READ,
        },
        {
          title: "Role",
          url: ROUTERS.ROLE,
          icon: Shield,
          permission: PERMISSION.ROLE.READ,
        },
        {
          title: "Role Permissions",
          url: ROUTERS.ROLE_PERMISSIONS,
          icon: Shield,
          permission: PERMISSION.PERMISSION.READ,
        },
      ],
    },
    {
      title: "Sale Reports",
      url: "#",
      icon: Receipt,
      badge: undefined as string | undefined,
      permission: PERMISSION.REPORT.READ,
      items: [
        {
          title: "Sale",
          url: ROUTERS.REPORT_SALES,
          icon: Receipt,
          permission: PERMISSION.REPORT.READ,
        },
        {
          title: "Daily Sales",
          url: ROUTERS.REPORT_DAILY_SALES,
          icon: Receipt,
          permission: PERMISSION.REPORT.READ,
        },
        {
          title: "Weekly Sales",
          url: ROUTERS.REPORT_WEEKLY_SALES,
          icon: Receipt,
          permission: PERMISSION.REPORT.READ,
        },
        {
          title: "Monthly Sales",
          url: ROUTERS.REPORT_MONTHLY_SALES,
          icon: Receipt,
          permission: PERMISSION.REPORT.READ,
        },

        {
          title: "Sales Item ",
          url: ROUTERS.REPORT_SALES_ITEMS,
          icon: ShoppingCart,
          permission: PERMISSION.REPORT.READ,
        },
      ],
    },
    {
      title: "Payment Reports",
      url: "#",
      icon: CreditCard,
      badge: undefined as string | undefined,
      permission: PERMISSION.REPORT.READ,
      items: [
        {
          title: "Sale Payments",
          url: ROUTERS.REPORT_SALE_PAYMENTS,
          icon: CreditCard,
          permission: PERMISSION.REPORT.READ,
        },
        {
          title: "Purchase Payments",
          url: ROUTERS.REPORT_PURCHASE_PAYMENTS,
          icon: Wallet,
          permission: PERMISSION.REPORT.READ,
        },
        {
          title: "Expense Reports",
          url: ROUTERS.REPORT_EXPENSES,
          icon: Wallet,
          permission: PERMISSION.REPORT.READ,
        },
        // {
        //   title: "Profit & Loss",
        //   url: ROUTERS.REPORT_PROFIT_LOSS,
        //   icon: BadgeDollarSign,
        //   permission: PERMISSION.REPORT.READ,
        // },
      ],
    },
    {
      title: "Stock Reports",
      url: "#",
      icon: Boxes,
      badge: undefined as string | undefined,
      permission: PERMISSION.REPORT.READ,
      items: [
        {
          title: "Stock ",
          url: ROUTERS.REPORT_STOCK,
          icon: Box,
          permission: PERMISSION.REPORT.READ,
        },
        {
          title: "Product Serial ",
          url: ROUTERS.REPORT_PRODUCT_SERIALS,
          icon: Boxes,
          permission: PERMISSION.REPORT.READ,
        },
      ],
    },
    {
      title: "Purchase Reports",
      url: "#",
      icon: ShoppingBag,
      badge: undefined as string | undefined,
      permission: PERMISSION.REPORT.READ,
      items: [
        {
          title: "Purchase",
          url: ROUTERS.REPORT_PURCHASES,
          icon: ShoppingBag,
          permission: PERMISSION.REPORT.READ,
        },
        {
          title: "Purchase Item ",
          url: ROUTERS.REPORT_PURCHASE_ITEMS,
          icon: Package,
          permission: PERMISSION.REPORT.READ,
        },
      ],
    },
  ],
};

/** Sidebar section each top-level menu belongs to (Figma: OVERVIEW / OPERATIONS / FINANCE / MANAGEMENT / REPORTS). */
const SECTION_BY_TITLE: Record<string, { key: string; fallback: string }> = {
  Dashboard: { key: "nav.section_overview", fallback: "Overview" },
  POS: { key: "nav.section_overview", fallback: "Overview" },
  Sales: { key: "nav.section_operations", fallback: "Operations" },
  Products: { key: "nav.section_operations", fallback: "Operations" },
  Purchases: { key: "nav.section_operations", fallback: "Operations" },
  Expenses: { key: "nav.section_finance", fallback: "Finance" },
  Finance: { key: "nav.section_finance", fallback: "Finance" },
  "Catalog Setup": { key: "nav.section_management", fallback: "Management" },
  People: { key: "nav.section_management", fallback: "Management" },
  "Sale Reports": { key: "nav.section_reports", fallback: "Reports" },
  "Payment Reports": { key: "nav.section_reports", fallback: "Reports" },
  "Stock Reports": { key: "nav.section_reports", fallback: "Reports" },
  "Purchase Reports": { key: "nav.section_reports", fallback: "Reports" },
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { Can } = usePermission();
  const { t } = useLanguage();
  const { toggleSidebar } = useSidebar();
  const handleLogout = useLogout();
  const { user } = useAuth();
  const { data: storesData } = useStore.useGetAllStore({ page: 0, size: 50 });
  const storeList = (storesData && storesData.payload && storesData.payload.data) || (storesData && storesData.data) || [];
  const currentStore = React.useMemo(() => {
    if (user && user.storeId && Array.isArray(storeList)) {
      const found = storeList.find((s) => Number(s.id) === Number(user.storeId));
      if (found) return found;
    }
    return storeList[0] || null;
  }, [storeList, user]);
  const storeName = (currentStore && currentStore.name) || "360 Phone Shop";
  const storeLogo = currentStore && currentStore.logo;

  const filteredNavMain = data.navMain
    .map((group) => {
      const groupHasPermission = !group.permission || Can(group.permission);
      const filteredItems = group.items?.filter((subItem) => {
        return !subItem.permission || Can(subItem.permission);
      });
      return {
        ...group,
        items: groupHasPermission ? filteredItems : [],
      };
    })
    .filter((group) => !group.items || group.items.length > 0)
    .sort((a, b) => {
      const order = [
        "Dashboard",
        "POS",
        "Sales",
        "Products",
        "Purchases",
        "Expenses",
        "Finance",
        "Catalog Setup",
        "People",
        "Sale Reports",
        "Payment Reports",
        "Stock Reports",
        "Purchase Reports",
      ];
      const indexA = order.indexOf(a.title);
      const indexB = order.indexOf(b.title);
      const safeA = indexA === -1 ? 999 : indexA;
      const safeB = indexB === -1 ? 999 : indexB;
      return safeA - safeB;
    })
    .map((group, index, list) => {
      const section = SECTION_BY_TITLE[group.title];
      const previous = index > 0 ? SECTION_BY_TITLE[list[index - 1].title] : undefined;
      const startsSection = section && section.key !== previous?.key;
      return startsSection ? { ...group, sectionLabel: t(section.key, section.fallback) } : group;
    });

  return (
    <Sidebar
      collapsible="icon"
      variant="sidebar"
      {...props}
      className="h-screen border-r-0 bg-sidebar shadow-none reference-sidebar"
    >
      <SidebarHeader className="reference-sidebar-header">
        <span className="reference-brand-mark flex items-center justify-center overflow-hidden">
          {storeLogo ? (
            <ImageCell
              fileName={storeLogo}
              name={storeName}
              bucketName="store"
              preview={false}
              className="size-full rounded-md object-contain"
              fallbackSrc="/logo.png"
            />
          ) : (
            <img
              className="reference-brand-logo"
              src="/logo.png"
              alt={storeName}
            />
          )}
        </span>
        <span className="reference-brand-wordmark">
          <strong className="truncate">{storeName}</strong>
        </span>
        <button
          type="button"
          onClick={toggleSidebar}
          className="reference-collapse-button"
          aria-label="Collapse sidebar"
        >
          <ChevronsLeft className="size-5" />
        </button>
      </SidebarHeader>

      <SidebarContent className="gap-0 py-3">
        <NavMain items={filteredNavMain} />
      </SidebarContent>

      <SidebarFooter className="reference-sidebar-footer">
        <SidebarMenu>
          <NavPrimaryColor />
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip={t("user.logout", "Sign out")}
              onClick={handleLogout}
              className="h-9 rounded-lg px-3 text-sm font-medium text-sidebar-foreground/88 hover:bg-sidebar-accent hover:text-sidebar-foreground"
            >
              <LogOut strokeWidth={1.75} />
              <span>{t("user.logout", "Sign out")}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
