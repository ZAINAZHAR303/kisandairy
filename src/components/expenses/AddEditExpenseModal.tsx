'use client'

import React, { useState, useEffect } from 'react'
import { Expense, ExpenseCategory } from '@/lib/types'
import { addExpense, updateExpense } from '@/app/dashboard/expenses/actions'

interface AddEditExpenseModalProps {
  isOpen: boolean
  onClose: () => void
  editExpense: Expense | null
}

export default function AddEditExpenseModal({ isOpen, onClose, editExpense }: AddEditExpenseModalProps) {
  const [category, setCategory] = useState<ExpenseCategory>('Feed')
  const [date, setDate] = useState('')
  const [amount, setAmount] = useState<number | ''>('')
  const [description, setDescription] = useState('')

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      if (editExpense) {
        setCategory(editExpense.category || 'Feed')
        setDate(editExpense.date ? new Date(editExpense.date).toISOString().split('T')[0] : '')
        setAmount(editExpense.amount ?? '')
        setDescription(editExpense.description || '')
      } else {
        setCategory('Feed')
        setDate(new Date().toISOString().split('T')[0])
        setAmount('')
        setDescription('')
      }
      setError(null)
    }
  }, [isOpen, editExpense])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!date) {
      setError('Date is required')
      return
    }

    if (!amount || typeof amount !== 'number' || amount <= 0) {
      setError('Please enter a valid amount')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('date', date)
      formData.append('category', category)
      formData.append('amount', amount.toString())
      formData.append('description', description)

      let result
      if (editExpense && editExpense.id) {
        formData.append('id', editExpense.id)
        result = await updateExpense(formData)
      } else {
        result = await addExpense(formData)
      }

      if (result?.error) {
        setError(typeof result.error === 'string' ? result.error : (result.error as Error)?.message || 'Failed to save expense')
      } else {
        onClose()
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/60 z-[100] transition-opacity duration-300 animate-fade-in" 
        onClick={onClose}
      />
      <div 
        className="fixed inset-x-0 bottom-0 sm:bottom-auto sm:inset-x-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 z-[100] w-full sm:w-full sm:max-w-md bg-white rounded-t-2xl sm:rounded-2xl max-h-[85vh] sm:max-h-[90vh] flex flex-col shadow-2xl animate-slide-up"
      >
        {/* Header */}
        <div className="flex-none p-4 border-b border-gray-100 relative">
          <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-3 sm:hidden" />
          <h2 className="text-xl font-bold text-gray-800 text-center">
            {editExpense ? 'Edit Expense 🧾' : 'Log New Expense 🧾'}
          </h2>
          <button 
            onClick={onClose}
            type="button"
            className="absolute right-4 top-4 sm:top-5 p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div className="overflow-y-auto p-6 flex-1 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 text-red-700 text-sm rounded-xl border border-red-200">
              {error}
            </div>
          )}

          <form id="expenseForm" onSubmit={handleSubmit} className="space-y-4">
            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Expense Category <span className="text-red-500">*</span>
              </label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value as ExpenseCategory)}
                required
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-blue)] focus:border-transparent transition-all bg-white font-medium"
              >
                <option value="Feed">🌾 Feed (wanda, fodder, silage)</option>
                <option value="Veterinary / Medicine">🩺 Veterinary & Medicine</option>
                <option value="Labor / Staff Salary">👷 Labor & Staff Salary</option>
                <option value="Equipment / Machinery">🚜 Equipment & Machinery</option>
                <option value="Utilities">⚡ Utilities (electricity, diesel)</option>
                <option value="Other">📦 Other Expenses</option>
              </select>
            </div>

            {/* Date & Amount */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  required
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-blue)] focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Amount (Rs.) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={amount}
                  onChange={e => setAmount(e.target.value === '' ? '' : parseFloat(e.target.value))}
                  placeholder="e.g. 5000"
                  required
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-blue)] focus:border-transparent transition-all font-bold text-gray-900"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Description / Details
              </label>
              <input
                type="text"
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="e.g. 50kg wanda from store, Dr. visit fee"
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-blue)] focus:border-transparent transition-all"
              />
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="flex-none p-4 border-t border-gray-100 bg-white sm:rounded-b-2xl">
          <button
            type="submit"
            form="expenseForm"
            disabled={isSubmitting}
            className="w-full bg-[var(--color-blue)] hover:bg-blue-600 text-white font-medium py-3.5 px-4 rounded-xl transition-colors disabled:opacity-70 flex items-center justify-center shadow-sm"
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Saving Expense...
              </>
            ) : (
              editExpense ? 'Update Expense' : 'Save Expense'
            )}
          </button>
        </div>
      </div>
    </>
  )
}
