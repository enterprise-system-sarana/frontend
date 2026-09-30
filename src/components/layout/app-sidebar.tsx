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
} from "lucide-react";

import { NavMain } from "@/components/layout/nav-main";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { PERMISSION } from "@/constants/Permission";
import { usePermission } from "@/utils/UsePermission";

import { ROUTERS } from "@/constants/Route";

const data = {
  navMain: [
    {
      title: "Dashboard",
      url: ROUTERS.DASHBOARD,
      icon: LayoutDashboard,
      // permission: PERMISSION.DASHBOARD.READ,
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
          title: "Bank",
          url: ROUTERS.BANK,
          icon: Wallet,
          permission: PERMISSION.BANK.READ,
        },
        {
          title: "Store",
          url: ROUTERS.STORE,
          icon: StoreIcon,
          permission: PERMISSION.STORE.READ,
        },
        {
          title: "Stock",
          url: ROUTERS.STOCK,
          icon: Boxes,
          permission: PERMISSION.STOCK.READ,
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
      ],
    },
    {
      title: "Sales",
      url: "#",
      icon: BadgeDollarSign,
      badge: undefined as string | undefined,
      items: [
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
          title: "Payments",
          url: ROUTERS.PAYMENT,
          icon: CreditCard,
          permission: PERMISSION.PAYMENT.READ,
        },
        {
          title: "Quote",
          url: ROUTERS.QUOTE,
          icon: FileText,
          // permission: PERMISSION.QUOTE.READ,
        },
        {
          title: "Create Quote",
          url: ROUTERS.QUOTE_CREATE,
          icon: PlusCircle,
          // permission: PERMISSION.QUOTE.CREATE,
        },
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
      ],
    },
    {
      title: "Reports",
      url: "#",
      icon: Receipt,
      badge: undefined as string | undefined,
      permission: PERMISSION.REPORT.READ,
      items: [
        {
          title: "Daily Sales",
          url: ROUTERS.REPORT_DAILY_SALES,
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
          title: "Sales Report",
          url: ROUTERS.REPORT_SALES,
          icon: Receipt,
          permission: PERMISSION.REPORT.READ,
        },
        {
          title: "Sales Item Reports",
          url: ROUTERS.REPORT_SALES_ITEMS,
          icon: ShoppingCart,
          permission: PERMISSION.REPORT.READ,
        },
        {
          title: "Expense Reports",
          url: ROUTERS.REPORT_EXPENSES,
          icon: Wallet,
          permission: PERMISSION.REPORT.READ,
        },
        {
          title: "Profit & Loss",
          url: ROUTERS.REPORT_PROFIT_LOSS,
          icon: BadgeDollarSign,
          permission: PERMISSION.REPORT.READ,
        },
        {
          title: "Product Serial Reports",
          url: ROUTERS.REPORT_PRODUCT_SERIALS,
          icon: Boxes,
          permission: PERMISSION.REPORT.READ,
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
          title: "Customers",
          url: ROUTERS.CUSTOMER,
          icon: Users,
          permission: PERMISSION.CUSTOMER.READ,
        },
        {
          title: "Suppliers",
          url: ROUTERS.SUPPLIER,
          icon: Users,
          permission: PERMISSION.SUPPLIER.READ,
        },
      ],
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { Can } = usePermission();

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
      const order = ["Dashboard", "Sales", "Products", "Purchases", "Expenses", "Finance", "Catalog Setup", "People", "Reports"];
      return order.indexOf(a.title) - order.indexOf(b.title);
    });

  return (
    <Sidebar
      collapsible="icon"
      variant="sidebar"
      {...props}
      className="h-screen border-r-0 bg-sidebar shadow-none reference-sidebar"
    >
      <SidebarHeader className="reference-sidebar-header">
        <div className="reference-brand" aria-label="360System Inventory Management">
          <strong>360<span>°</span></strong>
          <small>360 SYSTEM</small>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-1 py-2">
        <NavMain items={filteredNavMain} />
      </SidebarContent>
    </Sidebar>
  );
}
