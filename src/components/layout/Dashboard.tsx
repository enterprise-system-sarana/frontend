import { AppSidebar } from "@/components/layout/app-sidebar";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/store/useAuth";
import { LogOut, BadgeCheck, CreditCard, Monitor, AlertTriangle, CalendarDays, ChevronDown } from "lucide-react";
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
import { useProduct } from "@/hooks/product/useProduct";
import type { ProductResponse } from "@/types/product/Product";
import { useStock } from "@/hooks/inventory/useStock";
import type { StockResponse } from "@/types/inventory/Stock";
import ImageCell from "@/components/file/ImageCell";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { fileService } from "@/services/file/file.service";

const DashboardLayout = () => {
  const { user } = useAuth();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { t, language } = useLanguage();
  const currentDateString = new Date().toLocaleDateString(language === "km" ? "km-KH" : "en-GB", { day: "2-digit", month: "short", year: "numeric" });
  const currentPageTitle = location.pathname === ROUTERS.DASHBOARD
    ? "Dashboard"
    : location.pathname === ROUTERS.SALE
      ? "Sales"
      : location.pathname.split("/").filter(Boolean).at(-1)?.replace(/-/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase()) || "Dashboard";

  const { data: products } = useProduct.useGetAllProduct({ page: 1, size: 1000 });
  const { data: stocks, isError: isStocksError } = useStock.useGetAllStock({ page: 1, size: 1000 });
  const productOptions = ((products as any)?.payload?.data ?? (products as any)?.data ?? []) as ProductResponse[];
  const rawStocks = (stocks as any)?.payload?.data ?? (stocks as any)?.payload?.content ?? (stocks as any)?.data ?? [];
  const stockRecords: StockResponse[] = Array.isArray(rawStocks) ? rawStocks : [];
  const stockAlerts = stockRecords
    .filter((stock) => Number(stock.quantity) <= Number(stock.alertQuantity ?? stock.reorderLevel ?? 0))
    .map((stock) => {
      const product = productOptions.find((item) => item.id === stock.productId);
      return {
        id: stock.productId,
        name: stock.productName || product?.name || `Product #${stock.productId}`,
        code: product?.code || "",
        imageUrl: product?.imageUrl || "",
        qty: Number(stock.quantity) || 0,
        storeName: stock.storeName || "",
        storeId: stock.storeId,
      };
    });

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
    : "/default-user-avatar.png";

  const handleLogout = async () => {
    try {
      await AuthService.logout();
    } catch (err) {
      console.error("Failed to log out from backend:", err);
    }
    dispatch(logout());
    navigate(ROUTERS.LOGIN);
  };

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="bg-[#edf2f8] dark:bg-background overflow-hidden flex flex-col h-screen reference-layout">
        <div className="sticky top-0 z-20 w-full">
          <header className="reference-topbar">
            <div className="reference-topbar-left">
              <SidebarTrigger className="reference-menu-trigger" />
              <span className="reference-header-divider" aria-hidden="true" />
              <div className="reference-workspace-title">
                <span>360 SYSTEM <i>/</i> WORKSPACE</span>
                <strong>{currentPageTitle}</strong>
              </div>
            </div>

            <div className="reference-topbar-actions">
              {/* POS Button */}
              <Button size="sm" onClick={() => window.open(ROUTERS.SALE_CREATE, "_blank")} className="reference-pos-button">
                <Monitor className="h-4 w-4" />
                <span>POS</span>
              </Button>

              <span className="reference-header-divider reference-actions-divider" aria-hidden="true" />
              <LanguageToggle className="reference-language-toggle" />
              <span className="reference-date"><CalendarDays className="h-4 w-4" /><span>{currentDateString}</span></span>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`${stockAlerts.length} stock alerts`}
                    className="reference-alert-button"
                  >
                    <AlertTriangle className="h-5 w-5" />
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
                        const quantity = product.qty;
                        return (
                          <DropdownMenuItem
                            key={`${product.id}-${product.storeId}`}
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
                                {[product.code || `#${product.id}`, product.storeName].filter(Boolean).join(" · ")}
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
                      {isStocksError ? "Stock alerts unavailable" : "No stock alerts"}
                    </DropdownMenuItem>
                  )}
                  {stockAlerts.length > 8 && (
                    <>
                      <DropdownMenuSeparator className="my-1" />
                      <DropdownMenuItem
                        className="cursor-pointer justify-center text-xs text-muted-foreground hover:text-foreground font-medium py-1.5"
                        onClick={() => navigate(ROUTERS.STOCK)}
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
                  <button type="button" className="reference-user-trigger">
                    <Avatar className="reference-user-avatar">
                      <ImageCell
                        fileName={activeUser?.avatar}
                        name={activeUser.name}
                        bucketName="user"
                        preview={false}
                        className="size-full rounded-full"
                        fallbackSrc="/default-user-avatar.png"
                      />
                      <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs uppercase">
                        <img src="/default-user-avatar.png" alt="" className="size-full object-cover" />
                      </AvatarFallback>
                    </Avatar>
                    <span className="reference-user-copy"><strong className="reference-user-name">{activeUser.name}</strong><small>My account</small></span>
                    <ChevronDown className="reference-user-chevron" />
                  </button>
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
                          <img src="/default-user-avatar.png" alt="" className="size-full object-cover" />
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
            location.pathname.includes("/purchase/edit") ||
            location.pathname === ROUTERS.PURCHASE_PAYMENT ||
            location.pathname === ROUTERS.HOME;
          return (
            <div className={`flex-1 overflow-auto bg-[#edf2f8] dark:bg-background ${isNoPaddingPage ? "p-0" : "p-4 sm:p-6"}`}>
              <Outlet />
            </div>
          );
        })()}
      </SidebarInset>
    </SidebarProvider>
  );
};

export default DashboardLayout;
