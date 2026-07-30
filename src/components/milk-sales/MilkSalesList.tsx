'use client'

import React, { useState, useMemo } from 'react'
import { MilkSaleEntry, Seller, SellerPayment } from '@/lib/types'
import AddEditMilkSaleModal from './AddEditMilkSaleModal'
import AddEditSellerModal from './AddEditSellerModal'
import RecordPaymentModal from './RecordPaymentModal'
import BulkPriceUpdateModal from './BulkPriceUpdateModal'
import { deleteMilkSaleEntry, deleteSeller, deleteSellerPayment } from '@/app/dashboard/milk-sales/actions'
import { exportToExcel, exportToPDF } from '@/lib/exportUtils'
import { formatNumericDate } from '@/lib/dateUtils'

interface MilkSalesListProps {
  initialEntries: MilkSaleEntry[]
  sellers: Seller[]
  initialPayments?: SellerPayment[]
}

type MainTab = 'buyers' | 'sales_payments'
type DateFilterOption = 'Today' | 'Yesterday' | '7 Days' | '30 Days' | '3 Months' | 'This Month' | 'Last Month' | 'This Year' | 'All'

export default function MilkSalesList({ initialEntries, sellers, initialPayments = [] }: MilkSalesListProps) {
  // Navigation State
  const [activeTab, setActiveTab] = useState<MainTab>('buyers')
  const [selectedBuyer, setSelectedBuyer] = useState<Seller | null>(null)

  // Filters State
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'outstanding' | 'name'>('outstanding')
  const [dateFilter, setDateFilter] = useState<DateFilterOption>('This Month')
  const [salesBuyerFilter, setSalesBuyerFilter] = useState<string>('all')

  // Modals State
  const [isSaleModalOpen, setIsSaleModalOpen] = useState(false)
  const [editSaleEntry, setEditSaleEntry] = useState<MilkSaleEntry | null>(null)

  const [isSellerModalOpen, setIsSellerModalOpen] = useState(false)
  const [editSeller, setEditSeller] = useState<Seller | null>(null)

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
  const [paymentTargetSellerId, setPaymentTargetSellerId] = useState<string | undefined>(undefined)

  const [isBulkPriceModalOpen, setIsBulkPriceModalOpen] = useState(false)

  // Helper date calculations
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], [])

  // Calculate Buyer Ledgers (Sales, Payments, Outstanding)
  const buyerLedgers = useMemo(() => {
    const map = new Map<string, { totalSales: number; totalPaid: number; outstanding: number; entriesCount: number }>()

    // Initialize all sellers
    sellers.forEach(s => {
      map.set(s.id, { totalSales: 0, totalPaid: 0, outstanding: 0, entriesCount: 0 })
    })

    // Sum sales
    initialEntries.forEach(entry => {
      const sId = entry.seller_id
      const current = map.get(sId) || { totalSales: 0, totalPaid: 0, outstanding: 0, entriesCount: 0 }
      current.totalSales += Number(entry.total_amount || 0)
      current.entriesCount += 1
      map.set(sId, current)
    })

    // Sum payments
    initialPayments.forEach(pay => {
      const sId = pay.seller_id
      const current = map.get(sId) || { totalSales: 0, totalPaid: 0, outstanding: 0, entriesCount: 0 }
      current.totalPaid += Number(pay.amount_paid || 0)
      map.set(sId, current)
    })

    // Compute outstanding
    map.forEach((val) => {
      val.outstanding = val.totalSales - val.totalPaid
    })

    return map
  }, [sellers, initialEntries, initialPayments])

  // Filtered & Sorted Buyers for Buyers Tab
  const filteredBuyers = useMemo(() => {
    return sellers.filter(s => {
      const q = searchQuery.toLowerCase().trim()
      if (!q) return true
      return s.name.toLowerCase().includes(q) || (s.contact_number && s.contact_number.includes(q))
    }).sort((a, b) => {
      if (sortBy === 'outstanding') {
        const outA = buyerLedgers.get(a.id)?.outstanding || 0
        const outB = buyerLedgers.get(b.id)?.outstanding || 0
        return outB - outA
      }
      return a.name.localeCompare(b.name)
    })
  }, [sellers, searchQuery, sortBy, buyerLedgers])

  // Date Filter Logic for Sales & Payments Tab
  const dateRangeFilteredEntries = useMemo(() => {
    const now = new Date()

    return initialEntries.filter(entry => {
      if (salesBuyerFilter !== 'all' && entry.seller_id !== salesBuyerFilter) return false
      if (!entry.date) return true

      const entryDate = new Date(entry.date)
      if (isNaN(entryDate.getTime())) return true

      if (dateFilter === 'Today') {
        return entry.date === todayStr
      } else if (dateFilter === 'Yesterday') {
        const yest = new Date()
        yest.setDate(now.getDate() - 1)
        return entry.date === yest.toISOString().split('T')[0]
      } else if (dateFilter === '7 Days') {
        const diffTime = now.getTime() - entryDate.getTime()
        return diffTime <= 7 * 24 * 60 * 60 * 1000
      } else if (dateFilter === '30 Days') {
        const diffTime = now.getTime() - entryDate.getTime()
        return diffTime <= 30 * 24 * 60 * 60 * 1000
      } else if (dateFilter === '3 Months') {
        const diffTime = now.getTime() - entryDate.getTime()
        return diffTime <= 90 * 24 * 60 * 60 * 1000
      } else if (dateFilter === 'This Month') {
        const currentMonthPrefix = todayStr.substring(0, 7)
        return entry.date.startsWith(currentMonthPrefix)
      } else if (dateFilter === 'Last Month') {
        const lm = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        const lmPrefix = lm.toISOString().split('T')[0].substring(0, 7)
        return entry.date.startsWith(lmPrefix)
      } else if (dateFilter === 'This Year') {
        const currentYear = now.getFullYear().toString()
        return entry.date.startsWith(currentYear)
      }
      return true
    })
  }, [initialEntries, salesBuyerFilter, dateFilter, todayStr])

  // Combined Sales & Payments for Selected Buyer
  const selectedBuyerTransactions = useMemo(() => {
    if (!selectedBuyer) return []

    const sales = initialEntries.filter(e => e.seller_id === selectedBuyer.id).map(e => ({
      id: e.id,
      date: e.date,
      type: 'sale' as const,
      litres: e.total_liters,
      rate: e.rate_per_liter,
      total: e.total_amount,
      paid: 0,
      notes: e.sellers?.name || '',
      raw: e
    }))

    const payments = initialPayments.filter(p => p.seller_id === selectedBuyer.id).map(p => ({
      id: p.id,
      date: p.date,
      type: 'payment' as const,
      litres: 0,
      rate: 0,
      total: 0,
      paid: p.amount_paid,
      notes: p.notes || 'Payment Received',
      raw: p
    }))

    return [...sales, ...payments].sort((a, b) => b.date.localeCompare(a.date))
  }, [selectedBuyer, initialEntries, initialPayments])

  // Total metrics for Sales & Payments view
  const overallRevenue = useMemo(() => dateRangeFilteredEntries.reduce((sum, e) => sum + Number(e.total_amount || 0), 0), [dateRangeFilteredEntries])
  const overallPaid = useMemo(() => initialPayments.reduce((sum, p) => sum + Number(p.amount_paid || 0), 0), [initialPayments])
  const overallOutstanding = overallRevenue - overallPaid

  // Action Triggers
  const handleOpenAddSale = (sellerId?: string) => {
    setEditSaleEntry(null)
    setIsSaleModalOpen(true)
  }

  const handleOpenEditSale = (entry: MilkSaleEntry) => {
    setEditSaleEntry(entry)
    setIsSaleModalOpen(true)
  }

  const handleOpenAddPayment = (sellerId?: string) => {
    setPaymentTargetSellerId(sellerId)
    setIsPaymentModalOpen(true)
  }

  const handleOpenEditSeller = (seller: Seller) => {
    setEditSeller(seller)
    setIsSellerModalOpen(true)
  }

  const handleDeleteEntry = async (id: string) => {
    if (confirm('Are you sure you want to delete this milk sale record?')) {
      await deleteMilkSaleEntry(id)
    }
  }

  const handleDeleteSellerClick = async (sellerId: string) => {
    if (confirm('Are you sure you want to delete this buyer? This will also delete their transaction history.')) {
      const res = await deleteSeller(sellerId)
      if (res?.error) {
        alert(typeof res.error === 'string' ? res.error : (res.error as any)?.message || 'Failed to delete buyer')
      } else {
        setSelectedBuyer(null)
      }
    }
  }

  // Export handlers
  const handleExportExcel = () => {
    exportToExcel(dateRangeFilteredEntries, dateFilter, 'Buyers Report')
  }

  const handleExportPDF = () => {
    exportToPDF(dateRangeFilteredEntries, dateFilter, 'Buyers Report')
  }

  return (
    <div className="space-y-6 pb-24 font-[Inter] text-gray-900 selection:bg-emerald-100">
      {/* Top Header Navigation Tabs */}
      <div className="flex items-center space-x-3 border-b border-gray-200 pb-3">
        <button
          onClick={() => { setActiveTab('buyers'); setSelectedBuyer(null); }}
          className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl font-extrabold text-sm transition-all shadow-sm ${
            activeTab === 'buyers' && !selectedBuyer
              ? 'bg-emerald-600 text-white ring-2 ring-emerald-600/30'
              : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          <span>👥</span>
          <span>Buyers</span>
        </button>

        <button
          onClick={() => { setActiveTab('sales_payments'); setSelectedBuyer(null); }}
          className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl font-extrabold text-sm transition-all shadow-sm ${
            activeTab === 'sales_payments' && !selectedBuyer
              ? 'bg-emerald-600 text-white ring-2 ring-emerald-600/30'
              : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          <span>🥛</span>
          <span>Sales & Payments</span>
        </button>
      </div>

      {/* VIEW 1: BUYER DETAIL VIEW (When clicking on a buyer card) */}
      {selectedBuyer ? (
        <div className="space-y-6 animate-fade-in">
          {/* Back Navigation Bar */}
          <button
            onClick={() => setSelectedBuyer(null)}
            className="inline-flex items-center space-x-2 text-xs font-bold text-gray-600 hover:text-gray-900 bg-white px-3.5 py-2 rounded-xl border border-gray-200 shadow-sm transition-all"
          >
            <span>← Back to Buyers</span>
          </button>

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
                    <span>Due in 1 days</span>
                  </span>
                </div>
              </div>

              <div className="text-left sm:text-right">
                <div className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Outstanding (بقایا / ادھار)</div>
                <div className={`text-2xl sm:text-3xl font-black ${
                  (buyerLedgers.get(selectedBuyer.id)?.outstanding || 0) > 0 ? 'text-red-600' : 'text-emerald-600'
                }`}>
                  PKR {(buyerLedgers.get(selectedBuyer.id)?.outstanding || 0).toLocaleString()}
                </div>
              </div>
            </div>

            {/* Metrics Summary */}
            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-100 text-center">
              <div>
                <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Total Sales (کل سیل)</div>
                <div className="text-base sm:text-lg font-extrabold text-gray-900">
                  PKR {(buyerLedgers.get(selectedBuyer.id)?.totalSales || 0).toLocaleString()}
                </div>
              </div>

              <div>
                <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Total Paid (وصولی / کیش)</div>
                <div className="text-base sm:text-lg font-extrabold text-emerald-600">
                  PKR {(buyerLedgers.get(selectedBuyer.id)?.totalPaid || 0).toLocaleString()}
                </div>
              </div>

              <div>
                <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Default Price (ریٹ)</div>
                <div className="text-base sm:text-lg font-extrabold text-gray-900">
                  PKR {selectedBuyer.rate_per_liter}/L
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
                  {selectedBuyerTransactions.map((tx) => (
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
                          <button onClick={() => deleteSellerPayment(tx.id)} className="text-red-500 hover:underline font-bold">Delete</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : activeTab === 'buyers' ? (
        /* VIEW 2: BUYERS TAB GRID (Image 1) */
        <div className="space-y-6">
          {/* Top Actions & Search Bar */}
          <div className="space-y-4">
            <div>
              <button
                onClick={() => setIsBulkPriceModalOpen(true)}
                className="bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 text-xs font-bold px-4 py-2.5 rounded-2xl shadow-sm transition-all flex items-center space-x-1.5"
              >
                <span>💰</span>
                <span>Bulk Price Update</span>
              </button>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-between items-center">
              <div className="relative flex-1 w-full">
                <input
                  type="text"
                  placeholder="Search by name or phone..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white shadow-sm"
                />
              </div>

              <div className="flex items-center space-x-2 self-end sm:self-auto">
                <label className="text-xs font-semibold text-gray-400">Sort:</label>
                <select
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value as any)}
                  className="rounded-2xl border border-gray-200 px-3 py-2 text-xs font-bold bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm"
                >
                  <option value="outstanding">Sort: Outstanding</option>
                  <option value="name">Sort: Name</option>
                </select>
              </div>
            </div>
          </div>

          {/* Buyer Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filteredBuyers.map(seller => {
              const ledger = buyerLedgers.get(seller.id) || { totalSales: 0, totalPaid: 0, outstanding: 0 }
              const isDue = ledger.outstanding > 0

              return (
                <div
                  key={seller.id}
                  onClick={() => setSelectedBuyer(seller)}
                  className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-all cursor-pointer space-y-4 group relative"
                >
                  {/* Top Row: Name & Outstanding */}
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-base font-extrabold text-gray-900 capitalize group-hover:text-emerald-700 transition-colors">
                        {seller.name}
                      </h3>
                      <div className="flex items-center space-x-1.5 mt-1">
                        <span className="bg-blue-50 text-blue-700 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-blue-100">
                          {seller.payment_terms || 'End of Month'}
                        </span>
                        {isDue && (
                          <span className="text-[10px] text-amber-700 font-semibold">Due in 1 days</span>
                        )}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Outstanding</div>
                      <div className={`text-lg font-black ${isDue ? 'text-red-600' : 'text-emerald-600'}`}>
                        PKR {ledger.outstanding.toLocaleString()}
                      </div>
                    </div>
                  </div>

                  {/* Mid Row: Sales vs Paid */}
                  <div className="text-xs text-gray-500 font-medium flex items-center space-x-3 pt-1 border-t border-gray-50">
                    <span>Sales: <strong className="text-gray-800">PKR {ledger.totalSales.toLocaleString()}</strong></span>
                    <span>Paid: <strong className="text-emerald-600">PKR {ledger.totalPaid.toLocaleString()}</strong></span>
                  </div>

                  {/* Bottom Actions Row */}
                  <div className="flex items-center justify-between pt-2 gap-2" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleOpenAddPayment(seller.id)}
                        className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1.5 rounded-xl border border-emerald-200 flex items-center space-x-1"
                      >
                        <span>💰</span>
                        <span>Pay</span>
                      </button>

                      <button
                        onClick={() => handleOpenAddSale(seller.id)}
                        className="bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold px-3 py-1.5 rounded-xl border border-blue-200 flex items-center space-x-1"
                      >
                        <span>🥛</span>
                        <span>Sale</span>
                      </button>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleOpenEditSeller(seller)}
                        className="bg-gray-50 hover:bg-gray-100 text-gray-700 text-xs font-bold px-3 py-1.5 rounded-xl border border-gray-200"
                      >
                        Edit
                      </button>

                      <button
                        onClick={() => handleOpenEditSeller(seller)}
                        className="bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-bold px-3 py-1.5 rounded-xl border border-purple-200 flex items-center space-x-1"
                      >
                        <span>💰</span>
                        <span>Price</span>
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Add Buyer Floating Action Button */}
          <button
            onClick={() => { setEditSeller(null); setIsSellerModalOpen(true); }}
            className="fixed bottom-6 right-6 w-14 h-14 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full flex items-center justify-center shadow-xl hover:scale-105 transition-all z-40"
            title="Add New Buyer"
          >
            <span className="text-3xl font-light leading-none mb-1">+</span>
          </button>
        </div>
      ) : (
        /* VIEW 3: SALES & PAYMENTS TAB (Image 3) */
        <div className="space-y-6 animate-fade-in">
          {/* Filters & Export Card */}
          <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 space-y-4">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
              <div>
                <h3 className="text-sm font-extrabold text-gray-900">Filters & Export</h3>
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

            {/* Quick Date Chips */}
            <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar py-1">
              {(['Today', 'Yesterday', '7 Days', '30 Days', '3 Months', 'This Month', 'Last Month', 'This Year', 'All'] as DateFilterOption[]).map((opt) => (
                <button
                  key={opt}
                  onClick={() => setDateFilter(opt)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                    dateFilter === opt
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {opt}
                </button>
              ))}
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
      )}

      {/* MODALS */}
      <AddEditMilkSaleModal
        isOpen={isSaleModalOpen}
        onClose={() => setIsSaleModalOpen(false)}
        sellers={sellers}
        editEntry={editSaleEntry}
      />

      <AddEditSellerModal
        isOpen={isSellerModalOpen}
        onClose={() => setIsSellerModalOpen(false)}
        editSeller={editSeller}
      />

      <RecordPaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        sellers={sellers}
        defaultSellerId={paymentTargetSellerId}
      />

      <BulkPriceUpdateModal
        isOpen={isBulkPriceModalOpen}
        onClose={() => setIsBulkPriceModalOpen(false)}
      />
    </div>
  )
}
