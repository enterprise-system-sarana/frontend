import { useState, useMemo, useEffect } from "react";
import { DataTable } from "@/components/ui/data-table";
import { QueryBoundary } from "@/components/ui/query-boundary";
import { useCashRegister } from "@/hooks/sales/useCashRegister";
import { useStore } from "@/hooks/inventory/useStore";
import type { CashRegisterResponse } from "@/types/sales/CashRegister";
import { CashRegisterColumns } from "./CashRegisterColumn";
import { PageFilter } from "@/utils/PageFilter";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { ROUTERS } from "@/constants/Route";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";
import { KpiCard, KpiGrid } from "@/components/ui/kpi-card";
import { formatMoney } from "@/components/ui/money";
import {
  KeyRound,
  Lock,
  ShoppingCart,
  Sparkles,
  RefreshCw,
  DollarSign,
  Scale,
  Banknote,
} from "lucide-react";
import OpenRegisterModal from "../sale/components/OpenRegisterModal";
import CloseRegisterModal from "../sale/components/CloseRegisterModal";
import RegisterDetailsModal from "../sale/components/RegisterDetailsModal";

export default function CashRegisterPage() {
  const navigate = useNavigate();
  const { language, t } = useLanguage();
  const isKm = language === "km";

  const [page, setPage] = useState(1);
  const [size, setSize] = useState(10);
  const [search, setSearch] = useState("");
  const [storeId, setStoreId] = useState("");
  const [status, setStatus] = useState<string | undefined>(undefined);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [selectedRegister, setSelectedRegister] = useState<CashRegisterResponse | null>(null);
  const [openDetailModal, setOpenDetailModal] = useState(false);
  const [openCloseModal, setOpenCloseModal] = useState(false);
  const [openOpenModal, setOpenOpenModal] = useState(false);

  // Debounced search reset
  useEffect(() => {
    const handler = setTimeout(() => {
      setPage(1);
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  const { data: storeData } = useStore.useGetAllStore();
  const stores = useMemo(() => storeData?.payload?.data ?? [], [storeData]);

  // Current logged in cashier's open shift
  const { data: currentRegister, refetch: refetchCurrent } = useCashRegister.GetCurrent();

  // All Cash Registers list query
  const { data, isError, isLoading, refetch, isFetching } = useCashRegister.GetAll({
    page,
    size,
    search: search || undefined,
    storeId: storeId && storeId !== "all" ? Number(storeId) : undefined,
    status: status && status !== "all" ? status : undefined,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
  });

  // Resilient parsing of Spring Boot page or custom page response
  const rawRegisters: CashRegisterResponse[] = useMemo(() => {
    const payload = (data as any)?.payload ?? data;
    if (!payload) return [];
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload.content)) return payload.content;
    if (Array.isArray(payload.data)) return payload.data;
    return [];
  }, [data]);

  // Client-side quick filter for instant search feedback
  const registers = useMemo(() => {
    if (!search.trim()) return rawRegisters;
    const term = search.toLowerCase().trim();
    return rawRegisters.filter((r) => {
      const regNo = (r.registerNo || "").toLowerCase();
      const userName = (r.userName || "").toLowerCase();
      const storeName = (r.storeName || "").toLowerCase();
      const note = (r.closingNote || "").toLowerCase();
      return (
        regNo.includes(term) ||
        userName.includes(term) ||
        storeName.includes(term) ||
        note.includes(term)
      );
    });
  }, [rawRegisters, search]);

  const totalElements = useMemo(() => {
    const payload = (data as any)?.payload ?? data;
    return (
      payload?.totalElements ??
      payload?.pagination?.totalElements ??
      registers.length ??
      0
    );
  }, [data, registers.length]);

  const totalPages = useMemo(() => {
    const payload = (data as any)?.payload ?? data;
    return (
      payload?.totalPages ??
      payload?.pagination?.totalPages ??
      Math.max(1, Math.ceil(totalElements / size))
    );
  }, [data, totalElements, size]);

  const pct = (part: number, whole: number) => (whole > 0 ? (part / whole) * 100 : 0);

  // Summary Metrics across loaded shifts
  const shiftMetrics = useMemo(() => {
    let openCount = 0;
    let closedCount = 0;
    let totalSales = 0;
    let totalCashSales = 0;
    let totalBankSales = 0;
    let totalDifference = 0;
    let totalOrders = 0;

    rawRegisters.forEach((r) => {
      if (r.status === "OPEN") {
        openCount++;
      } else {
        closedCount++;
      }
      totalSales += Number(r.totalSales || 0);
      totalCashSales += Number(r.totalCashSales || 0);
      totalBankSales += Number(r.totalBankSales || 0);
      totalDifference += Number(r.difference || 0);
      totalOrders += Number(r.saleCount || 0);
    });

    return {
      openCount,
      closedCount,
      totalSales,
      totalCashSales,
      totalBankSales,
      totalDifference,
      totalOrders,
    };
  }, [rawRegisters]);

  const handleView = (reg: CashRegisterResponse) => {
    setSelectedRegister(reg);
    setOpenDetailModal(true);
  };

  const handleClose = (reg: CashRegisterResponse) => {
    setSelectedRegister(reg);
    setOpenCloseModal(true);
  };

  const handleRefresh = async () => {
    await Promise.all([refetch(), refetchCurrent()]);
  };

  const handleResetFilters = () => {
    setSearch("");
    setStoreId("");
    setStatus(undefined);
    setStartDate("");
    setEndDate("");
    setPage(1);
  };

  const columns = useMemo(
    () =>
      CashRegisterColumns({
        onView: handleView,
        onClose: handleClose,
        canClose: true,
      }),
    []
  );

  // Filter groups for PageFilter toolbar
  const filterGroups = useMemo(
    () => [
      {
        key: "storeId",
        label: isKm ? "ហាង" : "Store",
        options: stores.map((s: any) => ({
          label: s.name,
          value: String(s.id),
        })),
      },
      {
        key: "status",
        label: isKm ? "ស្ថានភាព" : "Status",
        options: [
          { label: isKm ? "កំពុងបើក (OPEN)" : "OPEN", value: "OPEN" },
          { label: isKm ? "បានបិទ (CLOSED)" : "CLOSED", value: "CLOSED" },
        ],
      },
    ],
    [stores, isKm]
  );

  const filterValues = useMemo(
    () => ({
      storeId: storeId || "",
      status: status || "",
    }),
    [storeId, status]
  );

  const handleFilterChange = (key: string, value: string) => {
    if (key === "storeId") {
      setStoreId(value === "all" ? "" : value);
    } else if (key === "status") {
      setStatus(value === "all" || !value ? undefined : value);
    }
    setPage(1);
  };

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <PageHeader
        title={isKm ? "បញ្ជីវេនលក់ (Cash Registers)" : "Cash Registers "}
        description={
          isKm
            ? "គ្រប់គ្រងការបើក/បិទវេនលក់ និងផ្ទៀងផ្ទាត់ទឹកប្រាក់ក្នុងថតប្រចាំថ្ងៃ"
            : "Manage cashier shifts, reconcile drawer cash balances, and monitor sales performance"
        }
      >
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleRefresh}
            disabled={isFetching}
            className="text-xs h-9 px-3 gap-1.5 cursor-pointer"
            title="Refresh Data"
          >
            <RefreshCw className={`size-3.5 ${isFetching ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">{isKm ? "ទាញយកឡើងវិញ" : "Refresh"}</span>
          </Button>

          {currentRegister ? (
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setSelectedRegister(currentRegister);
                setOpenCloseModal(true);
              }}
              className="text-xs h-9 border-destructive/20 text-destructive hover:bg-destructive/10 gap-1.5 cursor-pointer font-semibold"
            >
              <Lock className="size-3.5" />
              <span>{isKm ? "បិទវេនបច្ចុប្បន្ន" : "Close Active Shift"}</span>
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={() => setOpenOpenModal(true)}
              className="text-xs h-9 bg-primary hover:bg-primary-hover text-primary-foreground font-semibold gap-1.5 cursor-pointer shadow-xs"
            >
              <KeyRound className="size-3.5" />
              <span>{isKm ? "បើកបញ្ជីលក់ថ្មី" : "Open Register "}</span>
            </Button>
          )}

          <Button
            size="sm"
            onClick={() => navigate(ROUTERS.SALE_CREATE)}
            className="text-xs h-9 bg-primary hover:bg-primary-hover text-primary-foreground font-semibold gap-1.5 cursor-pointer shadow-xs"
          >
            <ShoppingCart className="size-3.5" />
            <span>{isKm ? "ទៅកាន់ POS" : "POS Terminal"}</span>
          </Button>
        </div>
      </PageHeader>

      {/* KPI Stats Cards Bar (shared KpiCard) */}
      <KpiGrid>
        <KpiCard
          featured
          icon={DollarSign}
          title={t("cash_register.total_shift_sales", "Total Shift Sales")}
          value={formatMoney(shiftMetrics.totalSales)}
          caption={`${shiftMetrics.totalOrders} ${t("cash_register.bills", "bills")}`}
          splits={[
            { label: t("cash_register.cash", "Cash"), value: shiftMetrics.totalCashSales, color: "#4ade80" },
            { label: t("cash_register.bank_qr", "Bank/QR"), value: shiftMetrics.totalBankSales, color: "#67d4f5" },
          ]}
        />
        <KpiCard
          tone="cyan"
          icon={KeyRound}
          title={t("cash_register.active_shifts", "Active Shifts")}
          subtitle={t("cash_register.active_shifts_desc", "Registers currently open")}
          value={shiftMetrics.openCount}
          caption={`/ ${rawRegisters.length} ${t("cash_register.shifts", "shifts")}`}
          percent={pct(shiftMetrics.openCount, rawRegisters.length)}
        />
        <KpiCard
          tone="green"
          icon={Banknote}
          title={t("cash_register.cash_vs_bank", "Cash vs Bank/QR")}
          subtitle={t("cash_register.cash_vs_bank_desc", "Cash share of shift sales")}
          value={formatMoney(shiftMetrics.totalCashSales)}
          caption={`${t("cash_register.bank_qr", "Bank/QR")}: ${formatMoney(shiftMetrics.totalBankSales)}`}
          percent={pct(shiftMetrics.totalCashSales, shiftMetrics.totalCashSales + shiftMetrics.totalBankSales)}
        />
        <KpiCard
          tone={shiftMetrics.totalDifference >= 0 ? "amber" : "red"}
          icon={Scale}
          title={t("cash_register.drawer_discrepancy", "Drawer Discrepancy")}
          subtitle={t("cash_register.drawer_discrepancy_desc", "Counted cash vs expected")}
          value={`${shiftMetrics.totalDifference >= 0 ? "+" : ""}${formatMoney(shiftMetrics.totalDifference)}`}
          caption={`${shiftMetrics.closedCount} ${t("cash_register.closed", "closed")}`}
        />
      </KpiGrid>

      {/* Active Shift Banner (if current cashier has an open shift) */}
      {currentRegister && (
        <div className="rounded-xl p-3 sm:p-3.5 bg-success/10 border border-success/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            {/* <div className="size-9 rounded-lg bg-success/15 text-success flex items-center justify-center font-bold">
              <Sparkles className="size-4.5" />
            </div> */}
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-foreground">
                  {isKm ? "វេនលក់បច្ចុប្បន្នកំពុងដំណើរការ" : "Active Register Shift"}
                </span>
                <span className="tabular-nums text-xs font-semibold px-2 py-0.5 rounded-full bg-success/15 text-success border border-success/30">
                  {currentRegister.registerNo}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isKm ? "ហាង:" : "Store:"}{" "}
                <span className="font-medium text-foreground">{currentRegister.storeName}</span> •{" "}
                {isKm ? "ទឹកប្រាក់ដើមគ្រា:" : "Opening Cash:"}{" "}
                <span className="tabular-nums font-semibold text-foreground">
                  ${Number(currentRegister.openingBalance || 0).toFixed(2)}
                </span> •{" "}
                {isKm ? "ការលក់:" : "Sales:"}{" "}
                <span className="tabular-nums font-semibold text-success">
                  ${Number(currentRegister.totalSales || 0).toFixed(2)}
                </span>
                {currentRegister.totalCashSales !== null && currentRegister.totalCashSales !== undefined && (
                  <>
                    {" "}• {isKm ? "សាច់ប្រាក់:" : "Cash:"}{" "}
                    <span className="tabular-nums font-semibold text-success">
                      ${Number(currentRegister.totalCashSales).toFixed(2)}
                    </span>
                  </>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setSelectedRegister(currentRegister);
                setOpenDetailModal(true);
              }}
              className="text-xs h-8 cursor-pointer"
            >
              {isKm ? "មើលលម្អិត" : "Shift Details"}
            </Button>
            <Button
              size="sm"
              onClick={() => {
                setSelectedRegister(currentRegister);
                setOpenCloseModal(true);
              }}
              className="text-xs h-8 bg-destructive hover:bg-destructive/90 text-white font-semibold cursor-pointer shadow-xs"
            >
              {isKm ? "បិទវេន" : "Close Shift"}
            </Button>
          </div>
        </div>
      )}

      {/* Shifts Table with Filters */}
      <div className="rounded-2xl border border-border bg-card shadow-card overflow-hidden">
        <div className="p-3 border-b border-border/60">
          <PageFilter
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder={isKm ? "ស្វែងរកតាមលេខកូដបញ្ជី ឬឈ្មោះបេឡាករ..." : "Search register or cashier..."}
            startDate={startDate}
            endDate={endDate}
            onStartDateChange={(val) => {
              setStartDate(val);
              setPage(1);
            }}
            onEndDateChange={(val) => {
              setEndDate(val);
              setPage(1);
            }}
            filterGroups={filterGroups}
            filterValues={filterValues}
            onFilterChange={handleFilterChange}
            onReset={handleResetFilters}
          />
        </div>

        <div className="px-0">
          <QueryBoundary isError={isError} isLoading={isLoading} onRetry={refetch}>
            <DataTable
              columns={columns}
              data={registers}
              pagination={{
                currentPage: page,
                pageSize: size,
                totalElements,
                totalPages,
                onPageChange: setPage,
                onPageSizeChange: (newSize) => {
                  setSize(newSize);
                  setPage(1);
                },
              }}
            />
          </QueryBoundary>
        </div>
      </div>

      {/* Modals */}
      <OpenRegisterModal
        open={openOpenModal}
        onOpenChange={setOpenOpenModal}
        onSuccess={() => {
          refetch();
          refetchCurrent();
        }}
      />

      <CloseRegisterModal
        open={openCloseModal}
        onOpenChange={setOpenCloseModal}
        register={selectedRegister}
        onSuccess={() => {
          refetch();
          refetchCurrent();
          setSelectedRegister(null);
        }}
      />

      <RegisterDetailsModal
        open={openDetailModal}
        onOpenChange={setOpenDetailModal}
        register={selectedRegister}
        onOpenCloseModal={() => {
          setOpenDetailModal(false);
          setOpenCloseModal(true);
        }}
      />
    </div>
  );
}
