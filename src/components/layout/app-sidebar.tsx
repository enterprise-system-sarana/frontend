"use client";

import * as React from "react";
import {
  Package,
  LayoutGrid,
  Layers,
  Box,
  PlusCircle,
  ShoppingCart,
  Truck,
  Shield,
  Warehouse,
  StoreIcon,
  Wallet,
  Coins,
  ShoppingBag,
  CreditCard,
  Boxes,
  Users,
  BadgeDollarSign,
  Settings,
  CircleSmall,
  LayoutDashboard,
  Receipt,
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
          // permission: PERMISSION.PRODUCT.READ,
        },
        {
          title: "Create Product",
          url: `${ROUTERS.PRODUCT}/create`,
          icon: PlusCircle,
          // permission: PERMISSION.PRODUCT.CREATE,
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
        },
        {
          title: "Expense",
          url: ROUTERS.EXPENSE,
          icon: CreditCard,
        },
      ],
    },
    {
      title: "Setting",
      url: "#",
      icon: Settings,
      items: [
        {
          title: "Category",
          url: ROUTERS.CATEGORY,
          icon: LayoutGrid,
          // permission: PERMISSION.CATEGORY.READ,
        },
        {
          title: "Brand",
          url: ROUTERS.BRAND,
          icon: Layers,
          // permission: PERMISSION.PRODUCT.READ,
        },
        {
          title: "Model",
          url: ROUTERS.MODEL,
          icon: Layers,
          // permission: PERMISSION.PRODUCT.READ,
        },
        {
          title: "Variant Type",
          url: ROUTERS.VARIANT_TYPE,
          icon: LayoutGrid,
          // permission: PERMISSION.PRODUCT.READ,
        },
        {
          title: "Variant Value",
          url: ROUTERS.VARIANT_VALUE,
          icon: Layers,
          // permission: PERMISSION.PRODUCT.READ,
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
          title: "Supplier",
          url: ROUTERS.SUPPLIER,
          icon: Truck,
          // permission: PERMISSION.SUPPLIER.READ,
        },
        {
          title: "Purchase",
          url: ROUTERS.PURCHASE,
          icon: ShoppingBag,
          // permission: PERMISSION.PURCHASE.CREATE,
        },
        {
          title: "Create Purchase",
          url: `${ROUTERS.PURCHASE}/create`,
          icon: PlusCircle,
          // permission: PERMISSION.PURCHASE.CREATE,
        },
        {
          title: "Purchase Payment",
          url: ROUTERS.PURCHASE_PAYMENT,
          icon: CreditCard,
          // permission: PERMISSION.PURCHASE.CREATE,
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
          title: "Create Sale",
          url: ROUTERS.SALE_CREATE,
          icon: PlusCircle,
          permission: PERMISSION.SALE.CREATE,
        },
        {
          title: "Customers",
          url: ROUTERS.CUSTOMER,
          icon: Users,
          permission: PERMISSION.CUSTOMER.READ,
        },
        {
          title: "Payments",
          url: ROUTERS.PAYMENT,
          icon: CreditCard,
        },
        // {
        //   title: "Sale",
        //   url: ROUTERS.SALE,
        //   icon: Receipt,
        //   // permission: PERMISSION.SALE.READ,
        // },
        // {
        //   title: "Create Sale",
        //   url: `${ROUTERS.SALE}/create`,
        //   icon: PlusCircle,
        //   // permission: PERMISSION.SALE.CREATE,
        // },
      ],
    },
    {
      title: "Inventory",
      url: "#",
      icon: Warehouse,
      badge: undefined as string | undefined,
      items: [
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
      ],
    },
    {
      title: "Finance",
      url: "#",
      icon: Wallet,
      badge: undefined as string | undefined,
      items: [
        {
          title: "Bank",
          url: ROUTERS.BANK,
          icon: Wallet,
          permission: PERMISSION.BANK.READ,
        },
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
          title: "Sales Reports",
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
          title: "Product Serial Reports",
          url: ROUTERS.REPORT_PRODUCT_SERIALS,
          icon: Boxes,
          permission: PERMISSION.REPORT.READ,
        },
      ],
    },
    {
      title: "Security",
      url: "#",
      icon: Shield,
      badge: undefined as string | undefined,
      items: [
        {
          title: "User",
          url: ROUTERS.USER,
          icon: CircleSmall,
          permission: PERMISSION.USER.READ,
        },
        {
          title: "Role",
          url: ROUTERS.ROLE,
          icon: CircleSmall,
          permission: PERMISSION.ROLE.READ,
        },
        {
          title: "Role Permissions",
          url: ROUTERS.ROLE_PERMISSIONS,
          icon: CircleSmall,
          permission: PERMISSION.PERMISSION.READ,
        },
      ],
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { Can } = usePermission();

  const filteredNavMain = data.navMain
    .map((group) => {
      const filteredItems = group.items?.filter((subItem: any) => {
        return !subItem.permission || Can(subItem.permission);
      });
      return { ...group, items: filteredItems };
    })
    .filter((group) => !group.items || group.items.length > 0);

  return (
    <Sidebar
      collapsible="icon"
      variant="inset"
      {...props}
      className="h-screen border-r border-sidebar-border/60 bg-sidebar shadow-none"
    >
      <SidebarHeader className="border-b-0 px-4 py-4">
        <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 shadow-sm backdrop-blur-sm">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/12 ring-1 ring-primary/30">
            <img src="/logo.png" alt="Logo" className="size-7 object-contain" />
          </div>

          <div className="min-w-0">
            <p className="truncate text-sm font-black uppercase tracking-[0.12em] text-sidebar-foreground">
              360System
            </p>
            <p className="truncate text-[11px] font-medium text-sidebar-foreground/60">
              Inventory Management
            </p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-1 py-2">
        <NavMain items={filteredNavMain} />
      </SidebarContent>
    </Sidebar>
  );
}
