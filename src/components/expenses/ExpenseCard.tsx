'use client'

import React from 'react'
import { Expense, ExpenseCategory } from '@/lib/types'
import { formatNumericDate } from '@/lib/dateUtils'

interface ExpenseCardProps {
  expense: Expense
  onEdit: (expense: Expense) => void
  onDelete: (id: string) => void
}

const BORDER_THEMES = [
  'border-t-green-500',
  'border-t-blue-500',
  'border-t-purple-500',
  'border-t-amber-400',
  'border-t-teal-400',
  'border-t-rose-400',
]

export default function ExpenseCard({ expense, onEdit, onDelete }: ExpenseCardProps) {
  const formatDate = (dateStr: string) => {
    return formatNumericDate(dateStr)
  }

  const getCategoryTheme = (cat: ExpenseCategory) => {
    switch (cat) {
      case 'Feed':
        return { icon: '🌾', dotBg: 'bg-green-500', text: 'text-green-700', bgLight: 'bg-green-50' }
      case 'Veterinary / Medicine':
        return { icon: '🩺', dotBg: 'bg-red-500', text: 'text-red-700', bgLight: 'bg-red-50' }
      case 'Labor / Staff Salary':
        return { icon: '👷', dotBg: 'bg-blue-500', text: 'text-blue-700', bgLight: 'bg-blue-50' }
      case 'Equipment / Machinery':
        return { icon: '🚜', dotBg: 'bg-orange-500', text: 'text-orange-700', bgLight: 'bg-orange-50' }
      case 'Utilities':
        return { icon: '⚡', dotBg: 'bg-amber-500', text: 'text-amber-700', bgLight: 'bg-amber-50' }
      default:
        return { icon: '📦', dotBg: 'bg-gray-500', text: 'text-gray-700', bgLight: 'bg-gray-50' }
    }
  }

  const theme = getCategoryTheme(expense.category)
  const colorIndex = expense.id ? expense.id.charCodeAt(0) % BORDER_THEMES.length : 0
  const themeBorder = BORDER_THEMES[colorIndex]

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col p-4 space-y-3 hover:shadow-lg transition-all border-t-4 ${themeBorder}`}>
      {/* Top Row: Category Label & Date */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className={`w-3 h-3 rounded-full ${theme.dotBg}`} />
          <span className="text-sm font-bold text-gray-900 flex items-center gap-1">
            <span>{theme.icon}</span>
            <span>{expense.category}</span>
          </span>
        </div>
        <span className="text-xs text-gray-500 font-medium">
          📅 {formatDate(expense.date)}
        </span>
      </div>

      {/* Description if present */}
      {expense.description && (
        <p className="text-xs text-gray-600 bg-gray-50 p-2 rounded-lg border border-gray-100 italic">
          {expense.description}
        </p>
      )}

      {/* Amount & Actions Row */}
      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onEdit(expense)}
            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors text-xs font-semibold flex items-center space-x-1"
            title="Edit Expense"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.379-8.379-2.828-2.828z" />
            </svg>
            <span>Edit</span>
          </button>
          <button
            onClick={() => onDelete(expense.id)}
            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors text-xs font-semibold flex items-center space-x-1"
            title="Delete Expense"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span>Delete</span>
          </button>
        </div>

        <div className="text-right">
          <div className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Amount</div>
          <div className="text-lg font-extrabold text-[#1a2f5e]">
            Rs. {Number(expense.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>
      </div>
    </div>
  )
}
