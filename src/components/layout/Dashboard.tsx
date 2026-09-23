import { AppSidebar } from "@/components/layout/app-sidebar";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/store/useAuth";
import { useEffect, useState } from "react";
import { ChevronDown, LogOut, BadgeCheck, CreditCard, Search, Store as StoreIcon, PlusCircle, Monitor, Maximize, Mail, Bell, Settings, AlertTriangle } from "lucide-react";
import { useAppDispatch } from "@/store/store";
import { logout } from "@/store/authSlice";
import { AuthService } from "@/services/auth/auth.service";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LanguageToggle } from "@/components/layout/LanguageToggle";
import { useLanguage } from "@/i18n/LanguageContext";
import { KeyRound } from "lucide-react";
import { ROUTERS } from "@/constants/Route";
import { Button } from "@/components/ui/button";
import { useStore } from "@/hooks/inventory/useStore";
import { useProduct } from "@/hooks/product/useProduct";
import type { ProductResponse } from "@/types/product/Product";

const DashboardLayout = () => {
  const { user } = useAuth();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { t, language } = useLanguage();
  const [currentDateString, setCurrentDateString] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStoreId, setSelectedStoreId] = useState<number | null>(null);

  const { data: stores } = useStore.useGetAllStore({ page: 0, size: 1000 });
  const { data: products } = useProduct.useGetAllProduct({ page: 1, size: 1000 });
  const storeOptions = stores?.payload?.data ?? stores?.data ?? [] as any[];
  const productOptions = (products?.payload?.data ?? products?.data ?? []) as ProductResponse[];
  const stockAlerts = productOptions.filter((product) => {
    const quantity = Number(product.qty ?? product.quantity ?? 0);
    const reorderLevel = Number(product.reorderLevel ?? 0);
    return quantity <= reorderLevel;
  });
  const selectedStore =
    storeOptions.find((store: any) => Number(store.id) === Number(selectedStoreId)) ??
    storeOptions[0] ??
    null;

  useEffect(() => {
    const locale = language === "km" ? "km-KH" : "en-GB";
    const day = new Date().toLocaleDateString(locale, {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
    const weekday = new Date().toLocaleDateString(locale, { weekday: "long" });
    setCurrentDateString(`${weekday}, ${day}`);
  }, [language]);

  useEffect(() => {
    if (!selectedStoreId && storeOptions.length > 0) {
      setSelectedStoreId(Number(storeOptions[0].id));
    }
  }, [selectedStoreId, storeOptions]);

  const activeUser = user
    ? {
      name: user.username,
      email: user.email,
      avatar: "",
    }
    : {
      name: "Guest User",
      email: "guest@example.com",
      avatar: "",
    };

  const handleLogout = async () => {
    try {
      await AuthService.logout();
    } catch (err) {
      console.error("Failed to log out from backend:", err);
    }
    dispatch(logout());
    navigate(ROUTERS.LOGIN);
  };

  const handleGlobalSearch = () => {
    const trimmed = searchQuery.trim();
    const targetPath = trimmed ? `${ROUTERS.PRODUCT}?search=${encodeURIComponent(trimmed)}` : ROUTERS.PRODUCT;
    navigate(targetPath);
  };

  const handleAddNew = () => {
    const currentPath = location.pathname;

    if (currentPath.startsWith(ROUTERS.PRODUCT)) {
      navigate(ROUTERS.PRODUCT_CREATE);
      return;
    }

    if (currentPath.startsWith(ROUTERS.PURCHASE)) {
      navigate(ROUTERS.PURCHASE_CREATE);
      return;
    }

    if (currentPath.startsWith(ROUTERS.SALE)) {
      navigate(ROUTERS.SALE_CREATE);
      return;
    }

    if (currentPath.startsWith(ROUTERS.STORE)) {
      navigate(ROUTERS.STORE_CREATE);
      return;
    }

    navigate(ROUTERS.PRODUCT_CREATE);
  };

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="bg-[#f4f5f4] dark:bg-background overflow-hidden flex flex-col h-screen">
        <div className="sticky top-0 z-20 w-full">
          <header className="flex h-14 items-center justify-between gap-4 border-b bg-white dark:bg-card px-4 shadow-sm w-full transition-all">
            {/* Left side: Sidebar Trigger + Search */}
            <div className="flex items-center gap-3 md:gap-6 flex-1">
              <SidebarTrigger className="h-8 w-8 rounded-full bg-orange-400 hover:bg-orange-500 hover:text-white text-white flex items-center justify-center transition-colors shadow-sm" />
            </div>

            {/* Right side: Actions & User Menu */}
            <div className="flex items-center gap-2 sm:gap-3">



              {/* POS Button */}
              <Button size="sm" onClick={() => window.open(ROUTERS.SALE_CREATE, "_blank")} className="hidden sm:flex bg-[#0e4091] hover:bg-slate-800 text-white gap-1.5 h-8 px-4 rounded-md cursor-pointer">
                <Monitor className="h-4 w-4" />
                POS
              </Button>

              <Separator orientation="vertical" className="h-6 bg-border/60 mx-1 hidden sm:block" />

              <LanguageToggle />

              {/* <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:bg-muted rounded-md hidden md:flex">
                <Maximize className="h-4 w-4" />
              </Button> */}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`${stockAlerts.length} stock alerts`}
                    className="relative hidden h-8 w-8 rounded-md text-muted-foreground hover:bg-muted md:flex"
                  >
                    <Mail className="h-4 w-4" />
                    {stockAlerts.length > 0 && (
                      <span className="absolute right-0 top-0 flex h-3.5 w-3.5 items-center justify-center rounded-full border border-white bg-red-500 text-[9px] font-bold text-white">
                        {stockAlerts.length > 99 ? "99+" : stockAlerts.length}
                      </span>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-72">
                  <DropdownMenuLabel>
                    Stock alerts ({stockAlerts.length})
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {stockAlerts.length > 0 ? (
                    stockAlerts.slice(0, 8).map((product) => {
                      const quantity = Number(product.qty ?? product.quantity ?? 0);
                      return (
                        <DropdownMenuItem
                          key={product.id}
                          className="cursor-pointer gap-2"
                          onClick={() => navigate(`${ROUTERS.PURCHASE_CREATE}?productId=${product.id}`)}
                        >
                          <AlertTriangle className="h-4 w-4 shrink-0 text-red-500" />

                          <span className="min-w-0 flex-1 truncate">{product.name}</span>
                          <span className="text-xs text-muted-foreground">{quantity} left</span>
                        </DropdownMenuItem>
                      );
                    })
                  ) : (
                    <DropdownMenuItem disabled>No stock alerts</DropdownMenuItem>
                  )}
                  {stockAlerts.length > 8 && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="cursor-pointer justify-center text-xs text-muted-foreground"
                        onClick={() => navigate(ROUTERS.PRODUCT)}
                      >
                        View all alerts
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>


              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center cursor-pointer border hover:opacity-80 transition-opacity ml-1 overflow-hidden">
                    <span className="text-xs font-bold text-muted-foreground">
                      {activeUser.name.slice(0, 2).toUpperCase()}
                    </span>
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-56 shadow-lg border-border/60 rounded-xl"
                  align="end"
                  forceMount
                >
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-semibold leading-none text-foreground">
                        {activeUser.name}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {activeUser.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuGroup>
                    <DropdownMenuItem
                      className="cursor-pointer text-muted-foreground focus:text-primary focus:bg-primary/10 rounded-lg"
                      onClick={() => navigate(ROUTERS.PROFILE)}
                    >
                      <BadgeCheck className="mr-2 h-4 w-4" />
                      <span>{t("user.profile")}</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="cursor-pointer text-muted-foreground focus:text-primary focus:bg-primary/10 rounded-lg"
                      onClick={() => navigate(ROUTERS.CHANGE_PASSWORD)}
                    >
                      <KeyRound className="mr-2 h-4 w-4" />
                      <span>{t("user.change_password")}</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="cursor-pointer text-muted-foreground focus:text-primary focus:bg-primary/10 rounded-lg"
                      onClick={() => navigate("/settings")}
                    >
                      <CreditCard className="mr-2 h-4 w-4" />
                      <span>{t("user.billing")}</span>
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10 rounded-lg"
                    onClick={handleLogout}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>{t("user.logout")}</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>
        </div>
        {(() => {
          const isNoPaddingPage =
            location.pathname.includes("/sale/create") ||
            location.pathname.includes("/sale/edit") ||
            location.pathname.includes("/purchase/create") ||
            location.pathname.includes("/purchase/edit");
          return (
            <div className={`flex-1 overflow-auto bg-background dark:bg-background ${isNoPaddingPage ? "p-0" : "p-4 sm:p-6"}`}>
              <Outlet />
            </div>
          );
        })()}
      </SidebarInset>
    </SidebarProvider>
  );
};

export default DashboardLayout;
