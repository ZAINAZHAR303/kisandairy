'use client'

import { MilkSaleEntry, Seller } from '@/lib/types'
import { formatNumericDate } from '@/lib/dateUtils'
import MonthPicker from '@/components/ui/MonthPicker'

interface SalesPaymentsTableProps {
  sellers: Seller[]
  dateRangeFilteredEntries: MilkSaleEntry[]
  overallRevenue: number
  overallPaid: number
  overallOutstanding: number
  selectedMonth: number
  selectedYear: number
  setSelectedMonth: (month: number) => void
  setSelectedYear: (year: number) => void
  salesBuyerFilter: string
  setSalesBuyerFilter: (sellerId: string) => void
  handleOpenEditSale: (entry: MilkSaleEntry) => void
  handleDeleteEntry: (id: string) => void
  handleExportPDF: () => void
  handleExportExcel: () => void
}

/** Monthly report: totals, export buttons, month and buyer filters, and the sales table. */
export default function SalesPaymentsTable({
  sellers,
  dateRangeFilteredEntries,
  overallRevenue,
  overallPaid,
  overallOutstanding,
  selectedMonth,
  selectedYear,
  setSelectedMonth,
  setSelectedYear,
  salesBuyerFilter,
  setSalesBuyerFilter,
  handleOpenEditSale,
  handleDeleteEntry,
  handleExportPDF,
  handleExportExcel,
}: SalesPaymentsTableProps) {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Filters & Export Card */}
      <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 space-y-4">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
          <div>
            <h3 className="text-sm font-extrabold text-gray-900">Monthly Report</h3>
            <div className="text-xs text-gray-500 font-medium mt-0.5">
              Revenue: <strong className="text-gray-800">PKR {overallRevenue.toLocaleString()}</strong> · Paid: <strong className="text-emerald-600">PKR {overallPaid.toLocaleString()}</strong> · Outstanding: <strong className="text-red-600">PKR {overallOutstanding.toLocaleString()}</strong>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleExportPDF}
              className="bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold px-3 py-1.5 rounded-xl border border-red-200 flex items-center space-x-1"
            >
              <span>📄</span>
              <span>PDF</span>
            </button>
            <button
              onClick={handleExportExcel}
              className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold px-3 py-1.5 rounded-xl border border-emerald-200 flex items-center space-x-1"
            >
              <span>📊</span>
              <span>CSV</span>
            </button>
          </div>
        </div>

        {/* Month Calendar Picker */}
        <div className="w-full">
          <MonthPicker 
            selectedMonth={selectedMonth} 
            selectedYear={selectedYear} 
            onChange={(m, y) => { setSelectedMonth(m); setSelectedYear(y); }} 
          />
        </div>

        {/* Buyer Filter Dropdown */}
        <div className="max-w-xs">
          <select
            value={salesBuyerFilter}
            onChange={e => setSalesBuyerFilter(e.target.value)}
            className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs font-bold bg-gray-50 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="all">All Buyers ({sellers.length})</option>
            {sellers.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100">
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-gray-100 text-gray-400 uppercase font-bold text-[10px] tracking-wider">
                <th className="py-3 px-3">DATE</th>
                <th className="py-3 px-3">BUYER</th>
                <th className="py-3 px-3">LITRES</th>
                <th className="py-3 px-3">PRICE/L</th>
                <th className="py-3 px-3">TOTAL</th>
                <th className="py-3 px-3">PAID</th>
                <th className="py-3 px-3">OUTSTANDING</th>
                <th className="py-3 px-3 text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {dateRangeFilteredEntries.map((entry) => (
                <tr key={entry.id} className="hover:bg-gray-50/80 transition-colors">
                  <td className="py-3.5 px-3 font-semibold text-gray-800">{formatNumericDate(entry.date)}</td>
                  <td className="py-3.5 px-3 font-bold text-gray-900 capitalize">{entry.sellers?.name || '—'}</td>
                  <td className="py-3.5 px-3 font-bold text-blue-600">{entry.total_liters}L</td>
                  <td className="py-3.5 px-3 font-medium text-gray-600">PKR {entry.rate_per_liter}</td>
                  <td className="py-3.5 px-3 font-extrabold text-gray-900">PKR {entry.total_amount.toLocaleString()}</td>
                  <td className="py-3.5 px-3 font-bold text-emerald-600">PKR 0</td>
                  <td className="py-3.5 px-3 font-bold text-red-600">PKR {entry.total_amount.toLocaleString()}</td>
                  <td className="py-3.5 px-3 text-right space-x-2">
                    <button onClick={() => handleOpenEditSale(entry)} className="text-blue-600 hover:underline font-bold">Edit</button>
                    <button onClick={() => handleDeleteEntry(entry.id)} className="text-red-500 hover:underline font-bold">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
