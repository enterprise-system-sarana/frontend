import { DateRangePicker } from "@/components/ui/date-picker";
import { useState } from "react";
import { useProfitLoss } from "@/hooks/reports/useProfitLoss";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { toast } from "sonner";
import { useLanguage } from "@/i18n/LanguageContext";

const localDate = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

const currentRange = () => {
  const today = new Date();
  return {
    startDate: localDate(new Date(today.getFullYear(), today.getMonth() - 5, 1)),
    endDate: localDate(today),
  };
};

export default function ProfitLossReportPage() {
  const { t } = useLanguage();
  const [initialRange] = useState(currentRange);
  const [startDate, setStartDate] = useState(initialRange.startDate);
  const [endDate, setEndDate] = useState(initialRange.endDate);
  const [activeFilter, setActiveFilter] = useState(initialRange);

  const { data, isLoading, isFetching, isError, error, refetch } = useProfitLoss.useGetReport(activeFilter);

  const handleGenerate = () => {
    if (!startDate || !endDate || startDate > endDate) {
      toast.error(t("report.select_date_range", "Choose a valid date range."));
      return;
    }
    if (activeFilter.startDate === startDate && activeFilter.endDate === endDate) {
      void refetch();
      return;
    }
    setActiveFilter({ startDate, endDate });
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 }).format(val);
  };

  return (
    <div className="space-y-5 pb-6">
      <PageHeader
        title={t("report.profit_loss_title", "Profit & Loss Statement")}
        hideButton
        actions={
          <>
            <DateRangePicker
              startDate={startDate}
              endDate={endDate}
              align="end"
              onChange={(start, end) => {
                setStartDate(start);
                setEndDate(end);
              }}
            />
            <Button onClick={handleGenerate} disabled={isFetching}>
              {isFetching ? t("common.loading", "Loading...") : t("report.generate", "Generate Report")}
            </Button>
          </>
        }
      />

      <div>
        <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-card">
          {isLoading ? (
            <div className="flex justify-center items-center py-20 text-muted-foreground">
              {t("common.loading", "Loading report data...")}
            </div>
          ) : isError ? (
            <div className="flex justify-center items-center py-20 text-destructive">
              {error instanceof Error ? error.message : "Failed to load report data."}
            </div>
          ) : data && data.months.length === 0 ? (
            <div className="flex justify-center items-center py-20 text-muted-foreground">{t("report.no_data", "No report data for this date range.")}</div>
          ) : data ? (
            <table className="w-full text-sm text-left text-text-secondary">
              <thead className="text-xs text-text-secondary bg-muted/50 border-b border-border">
                <tr>
                  <th scope="col" className="px-6 py-4 w-48 bg-card border-r border-border">
                    {/* Empty top-left cell */}
                  </th>
                  {data.months.map((month, idx) => (
                    <th key={idx} scope="col" className="px-6 py-4 font-semibold text-center whitespace-nowrap">
                      {month}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border border-b border-border">
                {/* Income Header Row */}
                <tr className="bg-muted/50">
                  <td className="px-6 py-3 font-bold text-foreground border-r border-border" colSpan={data.months.length + 1}>
                    {t("dashboard.gross_profit", "Income")}
                  </td>
                </tr>
                {/* Income Data Rows */}
                <tr className="hover:bg-muted/50 transition-colors">
                  <td className="px-6 py-3 border-r border-border font-medium">{t("common.sale", "Sales")}</td>
                  {data.income.sales.map((val, idx) => (
                    <td key={idx} className="px-6 py-3 text-center">{formatCurrency(val)}</td>
                  ))}
                </tr>
                <tr className="hover:bg-muted/50 transition-colors">
                  <td className="px-6 py-3 border-r border-border font-medium">Service</td>
                  {data.income.service.map((val, idx) => (
                    <td key={idx} className="px-6 py-3 text-center">{formatCurrency(val)}</td>
                  ))}
                </tr>
                <tr className="hover:bg-muted/50 transition-colors">
                  <td className="px-6 py-3 border-r border-border font-medium">Purchase Return</td>
                  {data.income.purchaseReturn.map((val, idx) => (
                    <td key={idx} className="px-6 py-3 text-center">{formatCurrency(val)}</td>
                  ))}
                </tr>
                {/* Gross Profit Totals */}
                <tr className="bg-muted/80">
                  <td className="px-6 py-4 font-bold text-foreground border-r border-border">{t("report.total_profit", "Gross Profit")}</td>
                  {data.income.grossProfit.map((val, idx) => (
                    <td key={idx} className="px-6 py-4 font-bold text-center text-foreground">{formatCurrency(val)}</td>
                  ))}
                </tr>

                {/* Expenses Header Row */}
                <tr className="bg-muted/50">
                  <td className="px-6 py-3 font-bold text-foreground border-r border-border" colSpan={data.months.length + 1}>
                    {t("dashboard.total_expense", "Expenses")}
                  </td>
                </tr>
                {/* Expenses Data Rows */}
                <tr className="hover:bg-muted/50 transition-colors">
                  <td className="px-6 py-3 border-r border-border font-medium">{t("common.sale", "Sales")}</td>
                  {data.expenses.sales.map((val, idx) => (
                    <td key={idx} className="px-6 py-3 text-center">{formatCurrency(val)}</td>
                  ))}
                </tr>
                <tr className="hover:bg-muted/50 transition-colors">
                  <td className="px-6 py-3 border-r border-border font-medium">{t("nav.purchase", "Purchase")}</td>
                  {data.expenses.purchase.map((val, idx) => (
                    <td key={idx} className="px-6 py-3 text-center">{formatCurrency(val)}</td>
                  ))}
                </tr>
                <tr className="hover:bg-muted/50 transition-colors">
                  <td className="px-6 py-3 border-r border-border font-medium text-foreground font-semibold">{t("sale.return", "Sales Return")}</td>
                  {data.expenses.salesReturn.map((val, idx) => (
                    <td key={idx} className="px-6 py-3 text-center">{formatCurrency(val)}</td>
                  ))}
                </tr>
                {/* Total Expense Totals */}
                <tr className="bg-muted/80">
                  <td className="px-6 py-4 font-bold text-foreground border-r border-border">{t("report.total_expense", "Total Expense")}</td>
                  {data.expenses.totalExpense.map((val, idx) => (
                    <td key={idx} className="px-6 py-4 font-bold text-center text-foreground">{formatCurrency(val)}</td>
                  ))}
                </tr>

                {/* Net Profit */}
                <tr className="bg-muted">
                  <td className="px-6 py-4 font-bold text-foreground border-r border-border">{t("report.net_income", "Net Profit")}</td>
                  {data.netProfit.map((val, idx) => (
                    <td key={idx} className={`px-6 py-4 font-bold text-center ${val < 0 ? "text-destructive" : "text-success"}`}>{formatCurrency(val)}</td>
                  ))}
                </tr>
              </tbody>
            </table>
          ) : null}
        </div>
      </div>
    </div>
  );
}
