import { useState } from "react";
import { useProfitLoss } from "@/hooks/reports/useProfitLoss";
import { Button } from "@/components/ui/button";
import { Calendar } from "lucide-react";
import { toast } from "sonner";

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
  const [initialRange] = useState(currentRange);
  const [startDate, setStartDate] = useState(initialRange.startDate);
  const [endDate, setEndDate] = useState(initialRange.endDate);
  const [activeFilter, setActiveFilter] = useState(initialRange);

  const { data, isLoading, isFetching, isError, error, refetch } = useProfitLoss.useGetReport(activeFilter);

  const handleGenerate = () => {
    if (!startDate || !endDate || startDate > endDate) {
      toast.error("Choose a valid date range.");
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
    <div className="flex flex-col h-full bg-[#f8f9fa] min-h-screen">
      {/* Header matching screenshot */}
      <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-200">
        <h1 className="text-lg font-bold text-gray-700">View Reports of Profit / Loss Report</h1>

        <div className="flex items-center gap-3">
          {/* Date Picker Mockup */}
          <div className="flex items-center border border-gray-300 rounded-md bg-white px-3 py-1.5 text-sm text-gray-600">
            <Calendar className="w-4 h-4 mr-2 text-gray-500" />
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="outline-none border-none bg-transparent"
            />
            <span className="mx-2">-</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="outline-none border-none bg-transparent"
            />
          </div>

          <Button
            onClick={handleGenerate}
            disabled={isFetching}
            className="bg-[#f39c12] hover:bg-[#e67e22] text-white font-medium rounded-md px-5"
          >
            {isFetching ? "Loading..." : "Generate Report"}
          </Button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="p-6 overflow-auto">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-x-auto">
          {isLoading ? (
            <div className="flex justify-center items-center py-20 text-gray-500">
              Loading report data...
            </div>
          ) : isError ? (
            <div className="flex justify-center items-center py-20 text-red-500">
              {error instanceof Error ? error.message : "Failed to load report data."}
            </div>
          ) : data && data.months.length === 0 ? (
            <div className="flex justify-center items-center py-20 text-gray-500">No report data for this date range.</div>
          ) : data ? (
            <table className="w-full text-sm text-left text-gray-600">
              <thead className="text-xs text-gray-700 bg-gray-50 border-b border-gray-200">
                <tr>
                  <th scope="col" className="px-6 py-4 w-48 bg-white border-r border-gray-200">
                    {/* Empty top-left cell */}
                  </th>
                  {data.months.map((month, idx) => (
                    <th key={idx} scope="col" className="px-6 py-4 font-semibold text-center whitespace-nowrap">
                      {month}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 border-b border-gray-200">
                {/* Income Header Row */}
                <tr className="bg-gray-50/50">
                  <td className="px-6 py-3 font-bold text-gray-800 border-r border-gray-200" colSpan={data.months.length + 1}>
                    Income
                  </td>
                </tr>
                {/* Income Data Rows */}
                <tr className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-3 border-r border-gray-200 font-medium">Sales</td>
                  {data.income.sales.map((val, idx) => (
                    <td key={idx} className="px-6 py-3 text-center">{formatCurrency(val)}</td>
                  ))}
                </tr>
                <tr className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-3 border-r border-gray-200 font-medium">Service</td>
                  {data.income.service.map((val, idx) => (
                    <td key={idx} className="px-6 py-3 text-center">{formatCurrency(val)}</td>
                  ))}
                </tr>
                <tr className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-3 border-r border-gray-200 font-medium">Purchase Return</td>
                  {data.income.purchaseReturn.map((val, idx) => (
                    <td key={idx} className="px-6 py-3 text-center">{formatCurrency(val)}</td>
                  ))}
                </tr>
                {/* Gross Profit Totals */}
                <tr className="bg-gray-50/80">
                  <td className="px-6 py-4 font-bold text-gray-900 border-r border-gray-200">Gross Profit</td>
                  {data.income.grossProfit.map((val, idx) => (
                    <td key={idx} className="px-6 py-4 font-bold text-center text-gray-900">{formatCurrency(val)}</td>
                  ))}
                </tr>

                {/* Expenses Header Row */}
                <tr className="bg-gray-50/50">
                  <td className="px-6 py-3 font-bold text-gray-800 border-r border-gray-200" colSpan={data.months.length + 1}>
                    Expenses
                  </td>
                </tr>
                {/* Expenses Data Rows */}
                <tr className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-3 border-r border-gray-200 font-medium">Sales</td>
                  {data.expenses.sales.map((val, idx) => (
                    <td key={idx} className="px-6 py-3 text-center">{formatCurrency(val)}</td>
                  ))}
                </tr>
                <tr className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-3 border-r border-gray-200 font-medium">Purchase</td>
                  {data.expenses.purchase.map((val, idx) => (
                    <td key={idx} className="px-6 py-3 text-center">{formatCurrency(val)}</td>
                  ))}
                </tr>
                <tr className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-3 border-r border-gray-200 font-medium text-gray-900 font-semibold">Sales Return</td>
                  {data.expenses.salesReturn.map((val, idx) => (
                    <td key={idx} className="px-6 py-3 text-center">{formatCurrency(val)}</td>
                  ))}
                </tr>
                {/* Total Expense Totals */}
                <tr className="bg-gray-50/80">
                  <td className="px-6 py-4 font-bold text-gray-900 border-r border-gray-200">Total Expense</td>
                  {data.expenses.totalExpense.map((val, idx) => (
                    <td key={idx} className="px-6 py-4 font-bold text-center text-gray-900">{formatCurrency(val)}</td>
                  ))}
                </tr>

                {/* Net Profit */}
                <tr className="bg-gray-100">
                  <td className="px-6 py-4 font-bold text-gray-900 border-r border-gray-200">Net Profit</td>
                  {data.netProfit.map((val, idx) => (
                    <td key={idx} className={`px-6 py-4 font-bold text-center ${val < 0 ? "text-red-600" : "text-emerald-700"}`}>{formatCurrency(val)}</td>
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
