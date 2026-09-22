import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Clock,
  LayoutDashboard,
  Store as StoreIcon,
  Calculator,
  Maximize,
  Minimize,
  Printer,
  PauseCircle,
  LogOut,
  User as UserIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ROUTERS } from "@/constants/Route";
import { useAuth } from "@/store/useAuth";
import type { StoreResponse } from "@/types/inventory/Store";

interface PosHeaderProps {
  stores: StoreResponse[];
  selectedStoreId: number;
  onSelectStore: (storeId: number) => void;
  onOpenCalculator: () => void;
  onOpenHeldOrders: () => void;
  heldOrdersCount: number;
  onPrintLastReceipt?: () => void;
  hasLastReceipt?: boolean;
}

export default function PosHeader({
  stores,
  selectedStoreId,
  onSelectStore,
  onOpenCalculator,
  onOpenHeldOrders,
  heldOrdersCount,
  onPrintLastReceipt,
  hasLastReceipt = false,
}: PosHeaderProps) {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Digital Clock
  const [time, setTime] = useState(() =>
    new Date().toLocaleTimeString("en-US", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
  );

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(
        new Date().toLocaleTimeString("en-US", {
          hour12: false,
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fullscreen state
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => { });
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => { });
        setIsFullscreen(false);
      }
    }
  };

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFsChange);
    return () => document.removeEventListener("fullscreenchange", handleFsChange);
  }, []);

  const currentStore = stores.find((s) => s.id === selectedStoreId) || stores[0];

  return (
    <header className="h-16 shrink-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 md:px-6 flex items-center justify-between z-20 shadow-2xs">
      {/* Left: Brand Logo & Title */}
      <div className="flex items-center ">
        <div
          onClick={() => navigate(ROUTERS.DASHBOARD)}
          className="flex items-center gap-2.5 cursor-pointer select-none group"
        >
          {/* <div className="size-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white font-bold text-lg shadow-sm group-hover:scale-105 transition">
            360
          </div>
          <div>
            <span className="font-extrabold text-base tracking-tight text-slate-800 dark:text-white">
              POS <span className="text-teal-600 dark:text-teal-400">PRO</span>
            </span>
            <span className="hidden sm:inline-block ml-2 px-2 py-0.5 text-[10px] font-semibold bg-teal-50 dark:bg-teal-950/50 text-teal-700 dark:text-teal-300 rounded-full border border-teal-200/60 dark:border-teal-800/60">
              Retail v5
            </span>
          </div> */}
        </div>

        {/* Live Digital Clock Badge */}
        {/* <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-teal-500/10 text-teal-700 dark:text-teal-300 border border-teal-500/20 text-xs font-mono font-semibold tracking-wider shadow-2xs">
          <Clock className="size-3.5 text-teal-600 dark:text-teal-400 animate-pulse" />
          <span>{time}</span>
        </div> */}

        {/* Dashboard Shortcut Button */}
        <Button
          type="button"
          size="sm"
          onClick={() => navigate(ROUTERS.DASHBOARD)}
          className="hidden md:flex bg-purple-600 hover:bg-purple-700 text-white gap-1.5 h-8 px-3 rounded-lg text-xs font-medium shadow-2xs"
        >
          <LayoutDashboard className="size-3.5" />
          Dashboard
        </Button>
      </div>

      {/* Right Tools and Profile */}
      <div className="flex items-center gap-2 sm:gap-2.5">
        {/* Select Store Dropdown */}
        {stores.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-2 bg-slate-50 dark:bg-slate-800 text-xs font-medium max-w-[170px] truncate rounded-lg border-slate-200 dark:border-slate-700"
              >
                <StoreIcon className="size-3.5 text-teal-600 shrink-0" />
                <span className="truncate">{currentStore?.name || "Select Store"}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="text-xs">Switch Store</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {stores.map((st) => (
                <DropdownMenuItem
                  key={st.id}
                  onClick={() => onSelectStore(st.id)}
                  className={`text-xs flex items-center justify-between cursor-pointer ${st.id === selectedStoreId ? "font-bold text-teal-600" : ""
                    }`}
                >
                  <span className="truncate">{st.name}</span>
                  {st.id === selectedStoreId && (
                    <span className="size-1.5 rounded-full bg-teal-600" />
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* Held Orders Quick Tool */}
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={onOpenHeldOrders}
          title="Held Orders"
          className="relative h-8 w-8 rounded-lg bg-orange-50 dark:bg-orange-950/30 text-orange-600 hover:bg-orange-100 hover:text-orange-700 border-orange-200/80"
        >
          <PauseCircle className="size-4" />
          {heldOrdersCount > 0 && (
            <span className="absolute -top-1 -right-1 size-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center shadow-xs">
              {heldOrdersCount}
            </span>
          )}
        </Button>

        {/* Calculator Button */}
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={onOpenCalculator}
          title="Calculator"
          className="h-8 w-8 rounded-lg bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700"
        >
          <Calculator className="size-4" />
        </Button>

        {/* Print Last Receipt */}
        {hasLastReceipt && onPrintLastReceipt && (
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={onPrintLastReceipt}
            title="Print Last Receipt"
            className="h-8 w-8 rounded-lg bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700"
          >
            <Printer className="size-4" />
          </Button>
        )}

        {/* Fullscreen Toggle */}
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={toggleFullscreen}
          title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
          className="hidden sm:flex h-8 w-8 rounded-lg bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700"
        >
          {isFullscreen ? <Minimize className="size-4" /> : <Maximize className="size-4" />}
        </Button>

        {/* User Profile Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex items-center gap-2 p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition focus:outline-hidden"
            >
              <div className="size-8 rounded-full bg-teal-600/15 text-teal-700 dark:text-teal-300 flex items-center justify-center font-bold text-xs border border-teal-500/20">
                {user?.username ? user.username.charAt(0).toUpperCase() : <UserIcon className="size-4" />}
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuLabel>
              <div className="flex flex-col">
                <span className="font-semibold text-sm">{user?.username || "Cashier"}</span>
                <span className="text-xs text-muted-foreground">{user?.email || "cashier@pos.com"}</span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate(ROUTERS.SALE)} className="cursor-pointer text-xs">
              <LayoutDashboard className="size-3.5 mr-2" />
              Sales History
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate(ROUTERS.HOME)} className="cursor-pointer text-xs">
              <StoreIcon className="size-3.5 mr-2" />
              Main System
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => navigate(ROUTERS.LOGIN)}
              className="text-red-600 focus:text-red-600 cursor-pointer text-xs"
            >
              <LogOut className="size-3.5 mr-2" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
