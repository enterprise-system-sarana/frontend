import { AppSidebar } from "@/components/layout/app-sidebar";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "@/store/useAuth";
import { useEffect, useState } from "react";
import { ChevronDown, LogOut, BadgeCheck, CreditCard } from "lucide-react";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LanguageToggle } from "@/components/layout/LanguageToggle";
import { useLanguage } from "@/i18n/LanguageContext";
import { KeyRound } from "lucide-react";
import { ROUTERS } from "@/constants/Route";

const DashboardLayout = () => {
  const { user } = useAuth();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const [currentDateString, setCurrentDateString] = useState("");

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

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="bg-[#f4f5f4] dark:bg-background">
        <div className="sticky top-3 z-10 mx-3 my-2 sm:mx-6">
          <header className="flex h-14 items-center justify-between gap-4 rounded-xl border border-border/60 bg-card/90 px-3 shadow-sm backdrop-blur-md transition-all sm:px-4">
            {/* Left side: Sidebar Trigger + User Welcome Info */}
            <div className="flex items-center gap-3">
              <SidebarTrigger className="-ml-1 text-muted-foreground hover:bg-primary/10 hover:text-primary rounded-lg transition-colors" />
              <Separator orientation="vertical" className="h-5 bg-border/60" />
              <div className="flex flex-col">
                <h1 className="text-xs font-semibold text-foreground md:text-sm leading-tight font-heading">
                  {t("common.welcome")}, {activeUser.name}
                </h1>
                {currentDateString && (
                  <p className="text-[10px] text-muted-foreground font-medium">
                    {currentDateString}
                  </p>
                )}
              </div>
            </div>

            {/* Right side: Language Switcher & User Menu */}
            <div className="flex items-center gap-2.5 sm:gap-3">
              <LanguageToggle />

              <Separator
                orientation="vertical"
                className="h-5 bg-border/60 hidden sm:block"
              />

              {/* User dropdown pill */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <div className="flex items-center gap-2.5 p-1 pr-3 rounded-full border border-border/60 bg-card shadow-2xs cursor-pointer hover:bg-muted/60 transition-all select-none">
                    {/* <Avatar className="h-7 w-7 rounded-full border border-primary/20">
                      <AvatarImage
                        src={activeUser.avatar}
                        alt={activeUser.name}
                      />
                      <AvatarFallback className="rounded-full bg-primary/10 text-primary font-bold text-[10px]">
                        {activeUser.name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar> */}
                    <span className="text-xs font-semibold text-foreground truncate max-w-[120px] hidden sm:inline-block font-sans">
                      {activeUser.name}
                    </span>
                    <ChevronDown className="h-3 w-3 text-muted-foreground" />
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
                      onClick={() => navigate("/profile")}
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
        <div className="flex flex-1 flex-col gap-4 px-3 pb-6 pt-2 sm:px-6">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
};

export default DashboardLayout;
