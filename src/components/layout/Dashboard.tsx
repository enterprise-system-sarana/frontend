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
import ImageCell from "@/components/file/ImageCell";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { fileService } from "@/services/file/file.service";

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
      avatar: user.profileImage || "",
    }
    : {
      name: "Guest User",
      email: "guest@example.com",
      avatar: "",
    };

  const userAvatarSrc = user?.profileImage
    ? user.profileImage.startsWith("http") || user.profileImage.startsWith("blob")
      ? user.profileImage
      : fileService.getPreviewUrl("user", user.profileImage)
    : "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80";

  const userInitials = (user?.username || activeUser.name || "YO").slice(0, 2).toUpperCase();

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
          <header className="flex h-16 items-center justify-between gap-4 border-b bg-white dark:bg-card px-4 md:px-6 shadow-xs w-full transition-all">
            {/* Left side: Sidebar Trigger + Search */}
            <div className="flex items-center gap-3 md:gap-6 flex-1">
              <SidebarTrigger className="h-9 w-9 rounded-full bg-orange-400 hover:bg-orange-500 hover:text-white text-white flex items-center justify-center transition-colors shadow-sm cursor-pointer" />
            </div>

            {/* Right side: Actions & User Menu */}
            <div className="flex items-center gap-2.5 sm:gap-3">
              {/* POS Button */}
              <Button size="sm" onClick={() => window.open(ROUTERS.SALE_CREATE, "_blank")} className="hidden sm:flex bg-[#0e4091] hover:bg-slate-800 text-white gap-2 h-10 px-4.5 rounded-lg cursor-pointer font-semibold shadow-xs">
                <Monitor className="h-4.5 w-4.5" />
                POS
              </Button>

              <Separator orientation="vertical" className="h-7 bg-border/80 mx-1 hidden sm:block" />

              <LanguageToggle />

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`${stockAlerts.length} stock alerts`}
                    className="relative hidden h-10 w-10 rounded-lg border border-border/70 bg-card shadow-2xs hover:bg-muted/70 text-muted-foreground hover:text-foreground md:flex cursor-pointer"
                  >
                    <Mail className="h-5 w-5" />
                    {stockAlerts.length > 0 && (
                      <span className="absolute -top-1 -right-1 flex h-5 min-w-5 px-1 items-center justify-center rounded-full border-2 border-background bg-red-500 text-[10px] font-bold text-white shadow-xs">
                        {stockAlerts.length > 99 ? "99+" : stockAlerts.length}
                      </span>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80 sm:w-88 p-1.5 shadow-lg border-border/70">
                  <div className="flex items-center justify-between px-2.5 py-1.5">
                    <DropdownMenuLabel className="p-0 font-semibold text-xs tracking-tight text-foreground">
                      Stock alerts ({stockAlerts.length})
                    </DropdownMenuLabel>
                    {stockAlerts.length > 0 && (
                      <span className="inline-flex items-center justify-center rounded-full bg-red-500/10 px-2 py-0.5 text-[10px] font-semibold text-red-600 dark:text-red-400">
                        {stockAlerts.length} low stock
                      </span>
                    )}
                  </div>
                  <DropdownMenuSeparator className="my-1" />
                  {stockAlerts.length > 0 ? (
                    <div className="max-h-80 overflow-y-auto space-y-0.5">
                      {stockAlerts.slice(0, 8).map((product) => {
                        const quantity = Number(product.qty ?? product.quantity ?? 0);
                        return (
                          <DropdownMenuItem
                            key={product.id}
                            className="cursor-pointer gap-2.5 p-2 rounded-lg items-center"
                            onClick={() => navigate(`${ROUTERS.PURCHASE_CREATE}?productId=${product.id}`)}
                          >
                            <ImageCell
                              fileName={product.imageUrl}
                              name={product.name || product.code}
                              bucketName="product"
                              preview={false}
                              className="h-10 w-10 rounded-lg shrink-0 border border-border/50 object-cover"
                            />

                            <div className="min-w-0 flex-1 flex flex-col justify-center">
                              <span className="text-xs font-semibold leading-tight truncate text-foreground">
                                {product.name}
                              </span>
                              <span className="text-[10px] text-muted-foreground font-mono truncate mt-0.5">
                                {product.code || `#${product.id}`}
                              </span>
                            </div>

                            <div className="shrink-0 flex items-center">
                              <span
                                className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-semibold ${quantity === 0
                                  ? "bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400 border border-red-200 dark:border-red-900/50"
                                  : "bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200 dark:border-amber-900/50"
                                  }`}
                              >
                                <AlertTriangle className="h-3 w-3 shrink-0" />
                                {quantity} left
                              </span>
                            </div>
                          </DropdownMenuItem>
                        );
                      })}
                    </div>
                  ) : (
                    <DropdownMenuItem disabled className="justify-center py-4 text-xs text-muted-foreground">
                      No stock alerts
                    </DropdownMenuItem>
                  )}
                  {stockAlerts.length > 8 && (
                    <>
                      <DropdownMenuSeparator className="my-1" />
                      <DropdownMenuItem
                        className="cursor-pointer justify-center text-xs text-muted-foreground hover:text-foreground font-medium py-1.5"
                        onClick={() => navigate(ROUTERS.PRODUCT)}
                      >
                        View all alerts ({stockAlerts.length})
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>


              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <div className="flex items-center cursor-pointer ml-1 select-none focus:outline-none">
                    <Avatar className="size-10 rounded-full ring-2 ring-border/80 hover:ring-primary/60 transition-all shadow-xs overflow-hidden">
                      {/* <AvatarImage
                        src={userAvatarSrc}
                        alt={activeUser.name}
                        className="object-cover size-full rounded-full"
                      /> */}
                      <ImageCell
                        fileName={activeUser?.avatar}
                        name={activeUser.name}
                        bucketName="user"
                        preview={false}
                        className="size-full rounded-full"
                      />
                      <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs uppercase">
                        {userInitials}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-56 shadow-lg border-border/60 rounded-xl"
                  align="end"
                  forceMount
                >
                  <DropdownMenuLabel className="font-normal p-2.5">
                    <div className="flex items-center gap-2.5">
                      <Avatar className="size-9 rounded-full ring-1 ring-border/60 shrink-0">
                        <AvatarImage src={userAvatarSrc} alt={activeUser.name} className="object-cover" />
                        <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs uppercase">
                          {userInitials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col space-y-0.5 min-w-0">
                        <p className="text-sm font-semibold leading-none text-foreground truncate">
                          {activeUser.name}
                        </p>
                        <p className="text-xs leading-none text-muted-foreground truncate">
                          {activeUser.email}
                        </p>
                      </div>
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
