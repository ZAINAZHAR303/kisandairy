'use client'

import React, { useState, useMemo } from 'react'
import { Expense, ExpenseCategory, MilkSaleEntry } from '@/lib/types'
import ExpenseCard from './ExpenseCard'
import AddEditExpenseModal from './AddEditExpenseModal'
import { deleteExpense } from '@/app/dashboard/expenses/actions'

interface ExpensesListProps {
  initialExpenses: Expense[]
  milkEntries: MilkSaleEntry[]
}

export default function ExpensesList({ initialExpenses, milkEntries }: ExpensesListProps) {
  // Current month string YYYY-MM
  const currentMonthStr = useMemo(() => {
    const now = new Date()
    const y = now.getFullYear()
    const m = String(now.getMonth() + 1).padStart(2, '0')
    return `${y}-${m}`
  }, [])

  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthStr)

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editExpense, setEditExpense] = useState<Expense | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // This Month Expenses (for current selected month)
  const monthExpenses = useMemo(() => {
    return initialExpenses.filter(e => e.date && e.date.startsWith(selectedMonth))
  }, [initialExpenses, selectedMonth])

  // Summary Card 1: This Month Total (Rs.)
  const thisMonthTotal = useMemo(() => {
    return monthExpenses.reduce((sum, e) => sum + Number(e.amount || 0), 0)
  }, [monthExpenses])

  // Summary Card 2: Feed Cost (Rs.)
  const feedCostTotal = useMemo(() => {
    return monthExpenses
      .filter(e => e.category === 'Feed')
      .reduce((sum, e) => sum + Number(e.amount || 0), 0)
  }, [monthExpenses])

  // Summary Card 3: Vet / Medicine (Rs.)
  const vetCostTotal = useMemo(() => {
    return monthExpenses
      .filter(e => e.category === 'Veterinary / Medicine')
      .reduce((sum, e) => sum + Number(e.amount || 0), 0)
  }, [monthExpenses])

  // Summary Card 4: Other Costs (Rs.) (all other categories except Feed and Vet)
  const otherCostTotal = useMemo(() => {
    return monthExpenses
      .filter(e => e.category !== 'Feed' && e.category !== 'Veterinary / Medicine')
      .reduce((sum, e) => sum + Number(e.amount || 0), 0)
  }, [monthExpenses])

  // Filtered expenses list (category + month filters)
  const filteredExpenses = useMemo(() => {
    return initialExpenses
      .filter(entry => {
        const matchesCategory = selectedCategory === 'all' || entry.category === selectedCategory
        const matchesMonth = !selectedMonth || (entry.date && entry.date.startsWith(selectedMonth))
        return matchesCategory && matchesMonth
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [initialExpenses, selectedCategory, selectedMonth])

  // Monthly Total for pinned row (respects active category + month filters)
  const filteredMonthlyTotal = useMemo(() => {
    return filteredExpenses.reduce((sum, e) => sum + Number(e.amount || 0), 0)
  }, [filteredExpenses])

  // Profit Summary Block (Selected Month Total Milk Revenue vs Total Month Expenses)
  const monthMilkRevenue = useMemo(() => {
    return milkEntries
      .filter(m => m.date && m.date.startsWith(selectedMonth))
      .reduce((sum, m) => sum + Number(m.total_amount || 0), 0)
  }, [milkEntries, selectedMonth])

  const netProfitLoss = monthMilkRevenue - thisMonthTotal
  const isProfitable = netProfitLoss >= 0

  const handleOpenAdd = () => {
    setEditExpense(null)
    setIsModalOpen(true)
  }

  const handleOpenEdit = (expense: Expense) => {
    setEditExpense(expense)
    setIsModalOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this expense record?')) {
      setDeletingId(id)
      try {
        await deleteExpense(id)
      } catch (err) {
        alert('Failed to delete expense')
      } finally {
        setDeletingId(null)
      }
    }
  }

  return (
    <div className="space-y-6 pb-20">
      {/* Page Title Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Expense Tracker 🧾</h1>
          <p className="text-xs text-gray-500 mt-0.5">Track farm operating costs & profits</p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="bg-[#00BFA6] hover:bg-[#00a892] text-white text-xs font-semibold px-3.5 py-2.5 rounded-xl shadow-sm transition-all flex items-center space-x-1"
        >
          <span>+ Log Expense</span>
        </button>
      </div>

      {/* Summary Cards Grid (4 stat cards) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* This Month Total */}
        <div className="bg-white rounded-2xl shadow-sm border-l-4 border-l-orange-600 p-4 flex flex-col justify-between gap-1">
          <div className="flex items-center gap-1.5 text-gray-500 text-xs font-medium">
            <span>🧾</span>
            <span>This Month Total</span>
          </div>
          <div className="text-2xl font-extrabold text-gray-900">
            Rs. {thisMonthTotal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </div>
        </div>

        {/* Feed Cost */}
        <div className="bg-white rounded-2xl shadow-sm border-l-4 border-l-blue-600 p-4 flex flex-col justify-between gap-1">
          <div className="flex items-center gap-1.5 text-gray-500 text-xs font-medium">
            <span>🌾</span>
            <span>Feed Cost</span>
          </div>
          <div className="text-2xl font-extrabold text-gray-900">
            Rs. {feedCostTotal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </div>
        </div>

        {/* Vet / Medicine */}
        <div className="bg-white rounded-2xl shadow-sm border-l-4 border-l-green-600 p-4 flex flex-col justify-between gap-1">
          <div className="flex items-center gap-1.5 text-gray-500 text-xs font-medium">
            <span>🩺</span>
            <span>Vet / Medicine</span>
          </div>
          <div className="text-2xl font-extrabold text-gray-900">
            Rs. {vetCostTotal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </div>
        </div>

        {/* Other Costs */}
        <div className="bg-white rounded-2xl shadow-sm border-l-4 border-l-[#00BFA6] p-4 flex flex-col justify-between gap-1">
          <div className="flex items-center gap-1.5 text-gray-500 text-xs font-medium">
            <span>🛠️</span>
            <span>Other Costs</span>
          </div>
          <div className="text-2xl font-extrabold text-gray-900">
            Rs. {otherCostTotal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Category Dropdown */}
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1">Filter Category</label>
            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#00BFA6] bg-gray-50 font-medium"
            >
              <option value="all">All Categories</option>
              <option value="Feed">🌾 Feed (wanda, fodder, silage)</option>
              <option value="Veterinary / Medicine">🩺 Veterinary & Medicine</option>
              <option value="Labor / Staff Salary">👷 Labor & Staff Salary</option>
              <option value="Equipment / Machinery">🚜 Equipment & Machinery</option>
              <option value="Utilities">⚡ Utilities</option>
              <option value="Other">📦 Other</option>
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

        {/* Reset button */}
        {(selectedCategory !== 'all' || selectedMonth !== currentMonthStr) && (
          <button
            onClick={() => { setSelectedCategory('all'); setSelectedMonth(currentMonthStr); }}
            className="text-xs text-teal-600 hover:text-teal-800 font-semibold self-end sm:self-center px-2.5 py-1.5 bg-teal-50 rounded-lg border border-teal-100"
          >
            Reset Filters
          </button>
        )}
      </div>

      {/* Expenses List */}
      {filteredExpenses.length > 0 ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredExpenses.map(expense => (
              <ExpenseCard
                key={expense.id}
                expense={expense}
                onEdit={handleOpenEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>

          {/* Monthly Total Row (Pinned) */}
          <div className="bg-[#1a2f5e] text-white rounded-2xl p-4 shadow-lg flex flex-col sm:flex-row justify-between items-center gap-3 border border-orange-500/30">
            <div className="flex items-center space-x-2">
              <span className="text-xl">🧾</span>
              <div>
                <div className="text-xs text-teal-300 font-semibold uppercase tracking-wider">
                  Total Filtered Expenses ({selectedMonth})
                </div>
                <div className="text-xs text-white/70">
                  {selectedCategory === 'all' ? 'All expense categories' : `Category: ${selectedCategory}`}
                </div>
              </div>
            </div>

            <div className="text-right">
              <div className="text-[10px] text-gray-300 uppercase tracking-wider font-semibold">Total Expenses</div>
              <div className="text-xl font-extrabold text-orange-400">
                Rs. {filteredMonthlyTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl p-8 text-center border border-gray-100 shadow-sm space-y-4 my-6">
          <div className="text-5xl">🧾</div>
          <h3 className="text-lg font-bold text-gray-800">No Expenses Logged</h3>
          <p className="text-sm text-gray-500 max-w-xs mx-auto">
            {selectedCategory !== 'all' || selectedMonth !== currentMonthStr
              ? 'No expense records found for the selected category or month.'
              : 'Tap the + button to log your first farm expense.'}
          </p>
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center space-x-2 bg-[#00BFA6] hover:bg-[#00a892] text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-sm transition-all"
          >
            <span>+ Log Expense</span>
          </button>
        </div>
      )}

      {/* PROFIT SUMMARY BLOCK (This Month Summary Section) */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div className="flex items-center space-x-2">
            <span className="text-xl">📈</span>
            <div>
              <h3 className="font-bold text-gray-900 text-base">Monthly Financial Summary</h3>
              <p className="text-xs text-gray-500">Real-time bottom line calculation for {selectedMonth}</p>
            </div>
          </div>
          <span className={`text-xs font-extrabold px-3 py-1 rounded-full ${isProfitable ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {isProfitable ? 'PROFITABLE 🟢' : 'LOSS 🔴'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
          {/* Milk Revenue */}
          <div className="bg-teal-50/50 p-3.5 rounded-xl border border-teal-100">
            <div className="text-xs font-semibold text-teal-800 uppercase tracking-wider mb-1">Total Milk Revenue</div>
            <div className="text-lg font-extrabold text-teal-900">
              Rs. {monthMilkRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>

          {/* Total Expenses */}
          <div className="bg-orange-50/50 p-3.5 rounded-xl border border-orange-100">
            <div className="text-xs font-semibold text-orange-800 uppercase tracking-wider mb-1">Total Expenses</div>
            <div className="text-lg font-extrabold text-orange-900">
              Rs. {thisMonthTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>

          {/* Net Profit / Loss */}
          <div className={`p-3.5 rounded-xl border ${isProfitable ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
            <div className={`text-xs font-semibold uppercase tracking-wider mb-1 ${isProfitable ? 'text-green-800' : 'text-red-800'}`}>
              {isProfitable ? 'Net Profit' : 'Net Loss'}
            </div>
            <div className={`text-xl font-extrabold ${isProfitable ? 'text-green-700' : 'text-red-700'}`}>
              Rs. {Math.abs(netProfitLoss).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
        </div>
      </div>

      {/* Floating Action Button */}
      <button
        onClick={handleOpenAdd}
        className="fixed bottom-24 right-6 w-14 h-14 bg-[#00BFA6] hover:bg-[#00a892] text-white rounded-full flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all z-40"
        title="Log Expense"
      >
        <span className="text-3xl font-light leading-none mb-1">+</span>
      </button>

      {/* Modal */}
      <AddEditExpenseModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        editExpense={editExpense}
      />
    </div>
  )
}
