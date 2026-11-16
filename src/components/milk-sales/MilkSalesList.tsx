'use client'

import React, { useState, useMemo } from 'react'
import { MilkSaleEntry, Seller, SellerPayment } from '@/lib/types'
import AddEditMilkSaleModal from './AddEditMilkSaleModal'
import AddEditSellerModal from './AddEditSellerModal'
import RecordPaymentModal from './RecordPaymentModal'
import BulkPriceUpdateModal from './BulkPriceUpdateModal'
import { deleteMilkSaleEntry, deleteSeller, deleteSellerPayment } from '@/app/dashboard/milk-sales/actions'
import { exportToExcel, exportToPDF, exportBuyerStatementExcel, exportBuyerStatementPDF } from '@/lib/exportUtils'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import { useToast } from '@/components/ui/Toast'
import { MONTH_NAMES } from '@/components/ui/MonthPicker'
import BuyerDetailView from './BuyerDetailView'
import BuyersGrid from './BuyersGrid'
import SalesPaymentsTable from './SalesPaymentsTable'
import { BuyerLedger, BuyerSort, BuyerTransaction } from './milkSalesShared'

interface MilkSalesListProps {
  initialEntries: MilkSaleEntry[]
  sellers: Seller[]
  initialPayments?: SellerPayment[]
}

type MainTab = 'buyers' | 'sales_payments'


export default function MilkSalesList({ initialEntries, sellers, initialPayments = [] }: MilkSalesListProps) {
  // Navigation State
  const [activeTab, setActiveTab] = useState<MainTab>('buyers')
  const [selectedBuyer, setSelectedBuyer] = useState<Seller | null>(null)

  // Filters State
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<BuyerSort>('outstanding')
  const [salesBuyerFilter, setSalesBuyerFilter] = useState<string>('all')

  // Month/Year calendar picker state (defaults to current month)
  const now = new Date()
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth()) // 0-11
  const [selectedYear, setSelectedYear] = useState(now.getFullYear())

  // Compute the start and end dates for the selected month (inclusive)
  const selectedMonthPrefix = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}`
  const isCurrentMonth = selectedMonth === now.getMonth() && selectedYear === now.getFullYear()

  // Modals State
  const [isSaleModalOpen, setIsSaleModalOpen] = useState(false)
  const [editSaleEntry, setEditSaleEntry] = useState<MilkSaleEntry | null>(null)

  const [isSellerModalOpen, setIsSellerModalOpen] = useState(false)
  const [editSeller, setEditSeller] = useState<Seller | null>(null)

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
  const [paymentTargetSellerId, setPaymentTargetSellerId] = useState<string | undefined>(undefined)

  const [isBulkPriceModalOpen, setIsBulkPriceModalOpen] = useState(false)

  const { showToast } = useToast()
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: async () => {}
  })

  // Selected month label for exports
  const selectedMonthLabel = `${MONTH_NAMES[selectedMonth]} ${selectedYear}`

  // Calculate Buyer Ledgers (Sales, Payments, Outstanding)
  const buyerLedgers = useMemo(() => {
    const map = new Map<string, BuyerLedger>()

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

  // Date Filter Logic for Sales & Payments Tab — filtered by selected calendar month
  const dateRangeFilteredEntries = useMemo(() => {
    return initialEntries.filter(entry => {
      if (salesBuyerFilter !== 'all' && entry.seller_id !== salesBuyerFilter) return false
      if (!entry.date) return true
      // Filter by selected month prefix (e.g. "2026-08")
      return entry.date.startsWith(selectedMonthPrefix)
    }).sort((a, b) => a.date.localeCompare(b.date))
  }, [initialEntries, salesBuyerFilter, selectedMonthPrefix])

  // Filter payments by selected calendar month too
  const dateRangeFilteredPayments = useMemo(() => {
    return initialPayments.filter(pay => {
      if (salesBuyerFilter !== 'all' && pay.seller_id !== salesBuyerFilter) return false
      if (!pay.date) return true
      return pay.date.startsWith(selectedMonthPrefix)
    })
  }, [initialPayments, salesBuyerFilter, selectedMonthPrefix])

  // Combined Sales & Payments for Selected Buyer, filtered by selected calendar month
  const selectedBuyerTransactions = useMemo((): BuyerTransaction[] => {
    if (!selectedBuyer) return []

    const sales = initialEntries
      .filter(e => e.seller_id === selectedBuyer.id && e.date?.startsWith(selectedMonthPrefix))
      .map(e => ({
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

    const payments = initialPayments
      .filter(p => p.seller_id === selectedBuyer.id && p.date?.startsWith(selectedMonthPrefix))
      .map(p => ({
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

    return [...sales, ...payments].sort((a, b) => a.date.localeCompare(b.date))
  }, [selectedBuyer, initialEntries, initialPayments, selectedMonthPrefix])

  // Calculate stats for the selected buyer and selected month
  const selectedBuyerMonthStats = useMemo(() => {
    let sales = 0
    let paid = 0
    selectedBuyerTransactions.forEach(t => {
      if (t.type === 'sale') sales += (t.total || 0)
      if (t.type === 'payment') paid += (t.paid || 0)
    })
    return { sales, paid, outstanding: sales - paid }
  }, [selectedBuyerTransactions])

  // Total metrics for Sales & Payments view — now correctly scoped to selected month
  const overallRevenue = useMemo(() => dateRangeFilteredEntries.reduce((sum, e) => sum + Number(e.total_amount || 0), 0), [dateRangeFilteredEntries])
  const overallPaid = useMemo(() => dateRangeFilteredPayments.reduce((sum, p) => sum + Number(p.amount_paid || 0), 0), [dateRangeFilteredPayments])
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

  const handleDeleteEntry = (id: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Milk Sale',
      message: 'Are you sure you want to delete this milk sale record?',
      onConfirm: async () => {
        try {
          const res = await deleteMilkSaleEntry(id)
          if (res?.error) showToast('error', 'Could not delete milk sale', String(res.error))
        } catch {
          showToast('error', 'Could not delete milk sale', 'Please check your connection and try again.')
        }
        setConfirmDialog(prev => ({ ...prev, isOpen: false }))
      }
    })
  }

  const handleDeleteSellerClick = (sellerId: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Buyer',
      message: 'Are you sure you want to delete this buyer? This will also delete their transaction history.',
      onConfirm: async () => {
        try {
          const res = await deleteSeller(sellerId)
          if (res?.error) {
            showToast('error', 'Could not delete buyer', String(res.error), 8000)
          } else {
            setSelectedBuyer(null)
          }
        } catch {
          showToast('error', 'Could not delete buyer', 'Please check your connection and try again.')
        }
        setConfirmDialog(prev => ({ ...prev, isOpen: false }))
      }
    })
  }

  const handleDeletePaymentClick = (id: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Payment',
      message: 'Are you sure you want to delete this payment record?',
      onConfirm: async () => {
        try {
          const res = await deleteSellerPayment(id)
          if (res?.error) showToast('error', 'Could not delete payment', String(res.error))
        } catch {
          showToast('error', 'Could not delete payment', 'Please check your connection and try again.')
        }
        setConfirmDialog(prev => ({ ...prev, isOpen: false }))
      }
    })
  }

  // Export handlers
  const handleExportExcel = () => {
    if (selectedBuyer) {
      exportBuyerStatementExcel(selectedBuyer.name, selectedBuyerTransactions)
    } else {
      exportToExcel(dateRangeFilteredEntries, selectedMonthLabel, 'Buyers Report')
    }
  }

  const handleExportPDF = () => {
    if (selectedBuyer) {
      exportBuyerStatementPDF(selectedBuyer.name, selectedBuyerTransactions)
    } else {
      exportToPDF(dateRangeFilteredEntries, selectedMonthLabel, 'Buyers Report')
    }
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
        <BuyerDetailView
          selectedBuyer={selectedBuyer}
          setSelectedBuyer={setSelectedBuyer}
          selectedMonth={selectedMonth}
          selectedYear={selectedYear}
          setSelectedMonth={setSelectedMonth}
          setSelectedYear={setSelectedYear}
          buyerLedgers={buyerLedgers}
          selectedBuyerMonthStats={selectedBuyerMonthStats}
          selectedBuyerTransactions={selectedBuyerTransactions}
          handleOpenAddPayment={handleOpenAddPayment}
          handleOpenAddSale={handleOpenAddSale}
          handleOpenEditSeller={handleOpenEditSeller}
          handleDeleteSellerClick={handleDeleteSellerClick}
          handleOpenEditSale={handleOpenEditSale}
          handleDeleteEntry={handleDeleteEntry}
          handleDeletePaymentClick={handleDeletePaymentClick}
          handleExportPDF={handleExportPDF}
          handleExportExcel={handleExportExcel}
        />
      ) : activeTab === 'buyers' ? (
        <BuyersGrid
          filteredBuyers={filteredBuyers}
          buyerLedgers={buyerLedgers}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          sortBy={sortBy}
          setSortBy={setSortBy}
          setSelectedBuyer={setSelectedBuyer}
          setIsBulkPriceModalOpen={setIsBulkPriceModalOpen}
          setEditSeller={setEditSeller}
          setIsSellerModalOpen={setIsSellerModalOpen}
          handleOpenAddPayment={handleOpenAddPayment}
          handleOpenAddSale={handleOpenAddSale}
          handleOpenEditSeller={handleOpenEditSeller}
        />
      ) : (
        <SalesPaymentsTable
          sellers={sellers}
          dateRangeFilteredEntries={dateRangeFilteredEntries}
          overallRevenue={overallRevenue}
          overallPaid={overallPaid}
          overallOutstanding={overallOutstanding}
          selectedMonth={selectedMonth}
          selectedYear={selectedYear}
          setSelectedMonth={setSelectedMonth}
          setSelectedYear={setSelectedYear}
          salesBuyerFilter={salesBuyerFilter}
          setSalesBuyerFilter={setSalesBuyerFilter}
          handleOpenEditSale={handleOpenEditSale}
          handleDeleteEntry={handleDeleteEntry}
          handleExportPDF={handleExportPDF}
          handleExportExcel={handleExportExcel}
        />
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

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  )
}
