import { useState } from "react";
import { useProfitLoss } from "@/hooks/reports/useProfitLoss";
import { Button } from "@/components/ui/button";
import { Calendar } from "lucide-react";

export default function ProfitLossReportPage() {
  const [startDate, setStartDate] = useState("2026-01-01");
  const [endDate, setEndDate] = useState("2026-06-30");

  const [activeFilter, setActiveFilter] = useState({
    startDate: "2026-01-01",
    endDate: "2026-06-30"
  });

  const { data, isLoading, isError } = useProfitLoss.useGetReport(activeFilter);

  const handleGenerate = () => {
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
            className="bg-[#f39c12] hover:bg-[#e67e22] text-white font-medium rounded-md px-5"
          >
            Generate Report
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
              Failed to load report data.
            </div>
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
                    <td key={idx} className="px-6 py-4 font-bold text-center text-gray-900">{formatCurrency(val)}</td>
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
