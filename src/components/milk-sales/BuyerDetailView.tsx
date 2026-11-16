'use client'

import { MilkSaleEntry, Seller } from '@/lib/types'
import { formatNumericDate } from '@/lib/dateUtils'
import MonthPicker, { MONTH_NAMES } from '@/components/ui/MonthPicker'
import { BuyerLedger, BuyerTransaction, getDueLabel } from './milkSalesShared'

interface BuyerDetailViewProps {
  selectedBuyer: Seller
  setSelectedBuyer: (buyer: Seller | null) => void
  selectedMonth: number
  selectedYear: number
  setSelectedMonth: (month: number) => void
  setSelectedYear: (year: number) => void
  buyerLedgers: Map<string, BuyerLedger>
  selectedBuyerMonthStats: { sales: number; paid: number; outstanding: number }
  selectedBuyerTransactions: BuyerTransaction[]
  handleOpenAddPayment: (sellerId?: string) => void
  handleOpenAddSale: (sellerId?: string) => void
  handleOpenEditSeller: (seller: Seller) => void
  handleDeleteSellerClick: (sellerId: string) => void
  handleOpenEditSale: (entry: MilkSaleEntry) => void
  handleDeleteEntry: (id: string) => void
  handleDeletePaymentClick: (id: string) => void
  handleExportPDF: () => void
  handleExportExcel: () => void
}

/** One buyer's statement: balance, month totals, actions and transaction history. */
export default function BuyerDetailView({
  selectedBuyer,
  setSelectedBuyer,
  selectedMonth,
  selectedYear,
  setSelectedMonth,
  setSelectedYear,
  buyerLedgers,
  selectedBuyerMonthStats,
  selectedBuyerTransactions,
  handleOpenAddPayment,
  handleOpenAddSale,
  handleOpenEditSeller,
  handleDeleteSellerClick,
  handleOpenEditSale,
  handleDeleteEntry,
  handleDeletePaymentClick,
  handleExportPDF,
  handleExportExcel,
}: BuyerDetailViewProps) {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Back Navigation Bar & Month Picker */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-white p-4 rounded-3xl border border-gray-100 shadow-sm">
        <button
          onClick={() => setSelectedBuyer(null)}
          className="inline-flex items-center space-x-2 text-xs font-bold text-gray-600 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 px-3.5 py-2.5 rounded-xl border border-gray-200 shadow-sm transition-all"
        >
          <span>← Back to Buyers</span>
        </button>
        <div className="w-full sm:w-72">
          <MonthPicker 
            selectedMonth={selectedMonth} 
            selectedYear={selectedYear} 
            onChange={(m, y) => { setSelectedMonth(m); setSelectedYear(y); }} 
          />
        </div>
      </div>

      {/* Buyer Header Card */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900 capitalize tracking-tight flex items-center gap-2">
              <span>{selectedBuyer.name}</span>
            </h1>
            <div className="flex items-center space-x-2 mt-2">
              <span className="bg-blue-50 text-blue-700 text-xs font-bold px-3 py-1 rounded-full border border-blue-100">
                {selectedBuyer.payment_terms || 'End of Month'}
              </span>
              <span className="bg-amber-50 text-amber-800 text-xs font-bold px-3 py-1 rounded-full border border-amber-100 flex items-center gap-1">
                <span>📅</span>
                <span>{getDueLabel(selectedBuyer.payment_terms)}</span>
              </span>
            </div>
          </div>

          <div className="text-left sm:text-right">
            <div className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Total Outstanding (کل بقایا)</div>
            <div className={`text-2xl sm:text-3xl font-black ${
              (buyerLedgers.get(selectedBuyer.id)?.outstanding || 0) > 0 ? 'text-red-600' : 'text-emerald-600'
            }`}>
              PKR {(buyerLedgers.get(selectedBuyer.id)?.outstanding || 0).toLocaleString()}
            </div>
          </div>
        </div>

        {/* Metrics Summary (Month Specific) */}
        <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-100 text-center">
          <div>
            <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Month Sales (کل سیل)</div>
            <div className="text-base sm:text-lg font-extrabold text-gray-900">
              PKR {selectedBuyerMonthStats.sales.toLocaleString()}
            </div>
          </div>

          <div>
            <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Month Paid (وصولی / کیش)</div>
            <div className="text-base sm:text-lg font-extrabold text-emerald-600">
              PKR {selectedBuyerMonthStats.paid.toLocaleString()}
            </div>
          </div>

          <div>
            <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Month Outstanding</div>
            <div className="text-base sm:text-lg font-extrabold text-red-600">
              PKR {selectedBuyerMonthStats.outstanding.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Action Buttons Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <button
            onClick={() => handleOpenAddPayment(selectedBuyer.id)}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-2xl shadow-sm transition-all text-xs sm:text-sm flex items-center justify-center space-x-1.5"
          >
            <span>💰</span>
            <span>Record Payment</span>
          </button>

          <button
            onClick={() => handleOpenAddSale(selectedBuyer.id)}
            className="w-full bg-white hover:bg-emerald-50 text-emerald-700 border-2 border-emerald-600 font-bold py-3 px-4 rounded-2xl transition-all text-xs sm:text-sm flex items-center justify-center space-x-1.5"
          >
            <span>🥛</span>
            <span>Record Sale</span>
          </button>

          <button
            onClick={() => handleOpenEditSeller(selectedBuyer)}
            className="w-full bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 font-bold py-3 px-4 rounded-2xl transition-all text-xs sm:text-sm"
          >
            Edit
          </button>

          <button
            onClick={() => handleDeleteSellerClick(selectedBuyer.id)}
            className="w-full bg-white hover:bg-red-50 text-red-600 border border-red-200 font-bold py-3 px-4 rounded-2xl transition-all text-xs sm:text-sm"
          >
            Delete
          </button>
        </div>
      </div>

      {/* Price History Section */}
      <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-sm font-bold text-gray-900">Price History</h3>
          <div className="flex items-center space-x-4 mt-2 text-xs">
            <div>
              <span className="text-gray-400 font-medium">Current Price: </span>
              <span className="font-extrabold text-purple-700">PKR {selectedBuyer.rate_per_liter}/L</span>
            </div>
            <div>
              <span className="text-gray-400 font-medium">Payment Terms: </span>
              <span className="font-bold text-gray-800 uppercase">{selectedBuyer.payment_terms || 'END OF MONTH'}</span>
            </div>
          </div>
        </div>

        <button
          onClick={() => handleOpenEditSeller(selectedBuyer)}
          className="inline-flex items-center space-x-1 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 text-xs font-bold px-3.5 py-2 rounded-xl transition-all"
        >
          <span>💰 Update Price</span>
        </button>
      </div>

      {/* Transaction History Table */}
      <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-bold text-gray-900">
            Transaction History ({selectedBuyerTransactions.length})
          </h3>

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

        {/* Table */}
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-gray-100 text-gray-400 uppercase font-bold text-[10px] tracking-wider">
                <th className="py-3 px-3">DATE</th>
                <th className="py-3 px-3">LITRES</th>
                <th className="py-3 px-3">PRICE/L</th>
                <th className="py-3 px-3">TOTAL</th>
                <th className="py-3 px-3">PAID</th>
                <th className="py-3 px-3">OUTSTANDING</th>
                <th className="py-3 px-3">NOTES</th>
                <th className="py-3 px-3 text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {selectedBuyerTransactions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-gray-500 font-medium text-sm">
                    No transactions found for {MONTH_NAMES[selectedMonth]} {selectedYear}.
                  </td>
                </tr>
              ) : (
                selectedBuyerTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="py-3.5 px-3 font-semibold text-gray-800">{formatNumericDate(tx.date)}</td>
                    <td className="py-3.5 px-3 font-bold text-blue-600">{tx.litres ? `${tx.litres}L` : '—'}</td>
                    <td className="py-3.5 px-3 font-medium text-gray-600">{tx.rate ? `PKR ${tx.rate}` : '—'}</td>
                    <td className="py-3.5 px-3 font-extrabold text-gray-900">{tx.total ? `PKR ${tx.total.toLocaleString()}` : '—'}</td>
                    <td className="py-3.5 px-3 font-bold text-emerald-600">{tx.paid ? `PKR ${tx.paid.toLocaleString()}` : 'PKR 0'}</td>
                    <td className="py-3.5 px-3 font-bold text-red-600">
                      {tx.total ? `PKR ${(tx.total - tx.paid).toLocaleString()}` : '—'}
                    </td>
                    <td className="py-3.5 px-3 text-gray-500 italic">{tx.notes || '—'}</td>
                    <td className="py-3.5 px-3 text-right space-x-2">
                      {tx.type === 'sale' && (
                        <>
                          <button onClick={() => handleOpenEditSale(tx.raw)} className="text-blue-600 hover:underline font-bold">Edit</button>
                          <button onClick={() => handleDeleteEntry(tx.id)} className="text-red-500 hover:underline font-bold">Delete</button>
                        </>
                      )}
                      {tx.type === 'payment' && (
                        <button onClick={() => handleDeletePaymentClick(tx.id)} className="text-red-500 hover:underline font-bold">Delete</button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
