'use client'

import React from 'react'
import { MilkSaleEntry } from '@/lib/types'

interface MilkSaleCardProps {
  entry: MilkSaleEntry
  onEdit: (entry: MilkSaleEntry) => void
  onDelete: (id: string) => void
}

export default function MilkSaleCard({ entry, onEdit, onDelete }: MilkSaleCardProps) {
  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'N/A'
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return 'N/A'
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  const sellerName = entry.sellers?.name || 'Unknown Seller'

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden flex flex-col hover:shadow-lg transition-shadow">
      {/* Header Row: Dark Navy (#1a2f5e) */}
      <div className="bg-white border-b border-gray-100 px-4 py-3 flex justify-between items-center rounded-t-xl">
        <div className="text-gray-900 font-bold text-sm tracking-wide">
          📅 {formatDate(entry.date)}
        </div>
        <div className="text-[var(--color-blue)] font-semibold text-sm bg-blue-950/60 px-3 py-1 rounded-full border border-blue-500/30 truncate max-w-[180px]">
          👤 {sellerName}
        </div>
      </div>

      {/* Body */}
      <div className="p-4 space-y-3">
        {/* Morning / Evening / Total Liters Row */}
        <div className="grid grid-cols-3 gap-2 bg-gray-50/90 rounded-lg p-2.5 border border-gray-100 text-center">
          <div>
            <div className="text-[10px] text-gray-400 uppercase tracking-wider font-medium mb-0.5">Morning</div>
            <div className="text-xs font-bold text-gray-800">{entry.morning_liters} L</div>
          </div>
          <div>
            <div className="text-[10px] text-gray-400 uppercase tracking-wider font-medium mb-0.5">Evening</div>
            <div className="text-xs font-bold text-gray-800">{entry.evening_liters} L</div>
          </div>
          <div className="border-l border-gray-200">
            <div className="text-[10px] text-[var(--color-blue)] uppercase tracking-wider font-semibold mb-0.5">Total Milk</div>
            <div className="text-xs font-extrabold text-[var(--color-blue)]">{entry.total_liters} L</div>
          </div>
        </div>

        {/* Rate & Total Amount Row */}
        <div className="flex justify-between items-center pt-1">
          <div>
            <div className="text-xs text-gray-400 uppercase tracking-wider font-medium">Rate / Liter</div>
            <div className="text-sm font-semibold text-gray-700">Rs. {entry.rate_per_liter}</div>
          </div>
          <div className="text-right">
            <div className="text-xs text-gray-400 uppercase tracking-wider font-medium">Total Amount</div>
            <div className="text-lg font-extrabold text-gray-900">
              Rs. {Number(entry.total_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
        </div>

        {/* Edit & Delete Action Buttons */}
        <div className="flex justify-end space-x-2 pt-2 border-t border-gray-100">
          <button
            onClick={() => onEdit(entry)}
            className="flex items-center space-x-1 px-3 py-1.5 text-blue-600 border border-blue-600 rounded-md hover:bg-blue-50 transition-colors text-xs font-medium"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.379-8.379-2.828-2.828z" />
            </svg>
            <span>Edit</span>
          </button>
          <button
            onClick={() => onDelete(entry.id)}
            className="flex items-center space-x-1 px-3 py-1.5 text-red-600 border border-red-600 rounded-md hover:bg-red-50 transition-colors text-xs font-medium"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span>Delete</span>
          </button>
        </div>
      </div>
    </div>
  )
}
