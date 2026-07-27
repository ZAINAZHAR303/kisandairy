'use client'

import React, { useState, useMemo } from 'react'
import { MilkSaleEntry, Seller } from '@/lib/types'
import Link from 'next/link'
import MilkSaleCard from './MilkSaleCard'
import AddEditMilkSaleModal from './AddEditMilkSaleModal'
import { deleteMilkSaleEntry } from '@/app/dashboard/milk-sales/actions'

import { exportToExcel, exportToPDF } from '@/lib/exportUtils'

interface MilkSalesListProps {
  initialEntries: MilkSaleEntry[]
  sellers: Seller[]
}

export default function MilkSalesList({ initialEntries, sellers }: MilkSalesListProps) {
  // Get current YYYY-MM
  const currentMonthStr = useMemo(() => {
    const now = new Date()
    const y = now.getFullYear()
    const m = String(now.getMonth() + 1).padStart(2, '0')
    return `${y}-${m}`
  }, [])

  const [selectedSellerId, setSelectedSellerId] = useState<string>('all')
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthStr)

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editEntry, setEditEntry] = useState<MilkSaleEntry | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Get active seller name for reports
  const activeSellerName = useMemo(() => {
    if (selectedSellerId === 'all') return 'All Sellers'
    const found = sellers.find(s => s.id === selectedSellerId)
    return found ? found.name : 'All Sellers'
  }, [selectedSellerId, sellers])

  // Today stats
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], [])

  const todayEntries = useMemo(() => {
    return initialEntries.filter(e => e.date === todayStr)
  }, [initialEntries, todayStr])

  const todayTotalLiters = useMemo(() => {
    return todayEntries.reduce((sum, e) => sum + Number(e.total_liters || 0), 0)
  }, [todayEntries])

  const todayTotalAmount = useMemo(() => {
    return todayEntries.reduce((sum, e) => sum + Number(e.total_amount || 0), 0)
  }, [todayEntries])

  // Current Month stats
  const thisMonthEntries = useMemo(() => {
    return initialEntries.filter(e => e.date && e.date.startsWith(selectedMonth))
  }, [initialEntries, selectedMonth])

  const monthTotalLitersAll = useMemo(() => {
    return thisMonthEntries.reduce((sum, e) => sum + Number(e.total_liters || 0), 0)
  }, [thisMonthEntries])

  const monthTotalAmountAll = useMemo(() => {
    return thisMonthEntries.reduce((sum, e) => sum + Number(e.total_amount || 0), 0)
  }, [thisMonthEntries])

  // Filtered entries for the list below
  const filteredEntries = useMemo(() => {
    return initialEntries.filter(entry => {
      const matchesSeller = selectedSellerId === 'all' || entry.seller_id === selectedSellerId
      const matchesMonth = !selectedMonth || (entry.date && entry.date.startsWith(selectedMonth))
      return matchesSeller && matchesMonth
    })
  }, [initialEntries, selectedSellerId, selectedMonth])

  // Monthly Total for pinned bottom bar
  const filteredMonthTotalLiters = useMemo(() => {
    return filteredEntries.reduce((sum, e) => sum + Number(e.total_liters || 0), 0)
  }, [filteredEntries])

  const filteredMonthTotalAmount = useMemo(() => {
    return filteredEntries.reduce((sum, e) => sum + Number(e.total_amount || 0), 0)
  }, [filteredEntries])

  const handleOpenAdd = () => {
    setEditEntry(null)
    setIsModalOpen(true)
  }

  const handleOpenEdit = (entry: MilkSaleEntry) => {
    setEditEntry(entry)
    setIsModalOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this milk sale entry?')) {
      setDeletingId(id)
      try {
        await deleteMilkSaleEntry(id)
      } catch (err) {
        alert('Failed to delete entry')
      } finally {
        setDeletingId(null)
      }
    }
  }

  const handleExportExcel = () => {
    exportToExcel(filteredEntries, selectedMonth, activeSellerName)
  }

  const handleExportPDF = () => {
    exportToPDF(filteredEntries, selectedMonth, activeSellerName)
  }

  return (
    <div className="space-y-6 pb-20">
      {/* Page Title & Manage Sellers Bar */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Milk Sale Tracking 🥛</h1>
          <p className="text-xs text-gray-500 mt-0.5">Track daily milk sales & seller revenues</p>
        </div>

        <Link
          href="/dashboard/milk-sales/sellers"
          className="inline-flex items-center space-x-1.5 bg-[#1a2f5e] hover:bg-[#0f1d3d] text-white text-xs font-semibold px-3.5 py-2 rounded-xl shadow-sm transition-all"
        >
          <span>⚙️ Manage Sellers</span>
        </Link>
      </div>

      {/* Summary Cards Grid (4 stat cards) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Today's Total Liters */}
        <div className="bg-white rounded-2xl shadow-sm border-l-4 border-l-blue-600 p-4 flex flex-col justify-between gap-1">
          <div className="flex items-center gap-1.5 text-gray-500 text-xs font-medium">
            <span>🥛</span>
            <span>Today&apos;s Liters</span>
          </div>
          <div className="text-2xl font-extrabold text-gray-900">
            {todayTotalLiters.toFixed(1)} <span className="text-xs font-normal text-gray-500">L</span>
          </div>
        </div>

        {/* Today's Total Amount */}
        <div className="bg-white rounded-2xl shadow-sm border-l-4 border-l-green-600 p-4 flex flex-col justify-between gap-1">
          <div className="flex items-center gap-1.5 text-gray-500 text-xs font-medium">
            <span>💵</span>
            <span>Today&apos;s Revenue</span>
          </div>
          <div className="text-2xl font-extrabold text-gray-900">
            Rs. {todayTotalAmount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </div>
        </div>

        {/* This Month Liters */}
        <div className="bg-white rounded-2xl shadow-sm border-l-4 border-l-[#00BFA6] p-4 flex flex-col justify-between gap-1">
          <div className="flex items-center gap-1.5 text-gray-500 text-xs font-medium">
            <span>📊</span>
            <span>Month Liters</span>
          </div>
          <div className="text-2xl font-extrabold text-gray-900">
            {monthTotalLitersAll.toFixed(1)} <span className="text-xs font-normal text-gray-500">L</span>
          </div>
        </div>

        {/* This Month Amount */}
        <div className="bg-white rounded-2xl shadow-sm border-l-4 border-l-orange-500 p-4 flex flex-col justify-between gap-1">
          <div className="flex items-center gap-1.5 text-gray-500 text-xs font-medium">
            <span>💰</span>
            <span>Month Revenue</span>
          </div>
          <div className="text-2xl font-extrabold text-gray-900">
            Rs. {monthTotalAmountAll.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </div>
        </div>
      </div>

      {/* Filter & Export Bar */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 space-y-4">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Seller Dropdown */}
            <div>
              <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1">Filter Seller</label>
              <select
                value={selectedSellerId}
                onChange={e => setSelectedSellerId(e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#00BFA6] bg-gray-50 font-medium"
              >
                <option value="all">All Sellers ({sellers.length})</option>
                {sellers.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            {/* Month Picker */}
            <div>
              <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1">Select Month</label>
              <input
                type="month"
                value={selectedMonth}
                onChange={e => setSelectedMonth(e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#00BFA6] bg-gray-50 font-medium"
              />
            </div>
          </div>

          {/* Reset Filters button */}
          {(selectedSellerId !== 'all' || selectedMonth !== currentMonthStr) && (
            <button
              onClick={() => { setSelectedSellerId('all'); setSelectedMonth(currentMonthStr); }}
              className="text-xs text-teal-600 hover:text-teal-800 font-semibold self-end sm:self-center px-2.5 py-1.5 bg-teal-50 rounded-lg border border-teal-100"
            >
              Reset Filters
            </button>
          )}
        </div>

        {/* Export Buttons */}
        <div className="pt-3 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-gray-500 font-medium">
            Showing records for: <span className="font-bold text-gray-800">{activeSellerName}</span> ({selectedMonth})
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleExportExcel}
              className="inline-flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3.5 py-2 rounded-xl transition-all shadow-sm active:scale-95"
              title="Download Excel (.xlsx) Report"
            >
              <span>📊</span>
              <span>Export Excel</span>
            </button>

            <button
              onClick={handleExportPDF}
              className="inline-flex items-center space-x-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold px-3.5 py-2 rounded-xl transition-all shadow-sm active:scale-95"
              title="Download PDF (.pdf) Report"
            >
              <span>📄</span>
              <span>Export PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* Records List */}
      {filteredEntries.length > 0 ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredEntries.map(entry => (
              <MilkSaleCard
                key={entry.id}
                entry={entry}
                onEdit={handleOpenEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>

          {/* Monthly Total Row (Pinned / Highlighted at bottom) */}
          <div className="bg-[#1a2f5e] text-white rounded-2xl p-4 shadow-lg flex flex-col sm:flex-row justify-between items-center gap-3 border border-teal-500/30">
            <div className="flex items-center space-x-2">
              <span className="text-xl">📊</span>
              <div>
                <div className="text-xs text-teal-300 font-semibold uppercase tracking-wider">
                  Monthly Total Summary ({selectedMonth})
                </div>
                <div className="text-xs text-white/70">
                  {selectedSellerId === 'all' ? 'All Sellers combined' : `Filtered for ${sellers.find(s => s.id === selectedSellerId)?.name || 'Seller'}`}
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-6 bg-white/10 px-4 py-2 rounded-xl border border-white/10">
              <div>
                <div className="text-[10px] text-gray-300 uppercase tracking-wider">Total Liters</div>
                <div className="text-base font-extrabold text-[#00BFA6]">
                  {filteredMonthTotalLiters.toFixed(1)} L
                </div>
              </div>
              <div className="h-8 w-px bg-white/20" />
              <div>
                <div className="text-[10px] text-gray-300 uppercase tracking-wider">Total Revenue</div>
                <div className="text-base font-extrabold text-white">
                  Rs. {filteredMonthTotalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl p-8 text-center border border-gray-100 shadow-sm space-y-4 my-6">
          <div className="text-5xl">🥛</div>
          <h3 className="text-lg font-bold text-gray-800">No Milk Sale Entries Found</h3>
          <p className="text-sm text-gray-500 max-w-xs mx-auto">
            {selectedSellerId !== 'all' || selectedMonth !== currentMonthStr
              ? 'No sales recorded for the selected seller or month.'
              : 'Tap the + button to log your first daily milk sale entry.'}
          </p>
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center space-x-2 bg-[#00BFA6] hover:bg-[#00a892] text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-sm transition-all"
          >
            <span>+ Log Milk Sale</span>
          </button>
        </div>
      )}

      {/* Floating Action Button */}
      <button
        onClick={handleOpenAdd}
        className="fixed bottom-24 right-6 w-14 h-14 bg-[#00BFA6] hover:bg-[#00a892] text-white rounded-full flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all z-40"
        title="Log Milk Sale Entry"
      >
        <span className="text-3xl font-light leading-none mb-1">+</span>
      </button>

      {/* Modal */}
      <AddEditMilkSaleModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        sellers={sellers}
        editEntry={editEntry}
      />
    </div>
  )
}
