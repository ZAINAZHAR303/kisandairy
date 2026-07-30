'use client'

import React, { useState } from 'react'
import { bulkUpdateSellerRates } from '@/app/dashboard/milk-sales/actions'

interface BulkPriceUpdateModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function BulkPriceUpdateModal({ isOpen, onClose }: BulkPriceUpdateModalProps) {
  const [newRate, setNewRate] = useState<number | ''>('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!newRate || Number(newRate) <= 0) {
      setError('Please enter a valid rate per liter')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const result = await bulkUpdateSellerRates(Number(newRate))
      if (result?.error) {
        setError((result.error as Error)?.message || 'Failed to bulk update price')
      } else {
        onClose()
      }
    } catch (err) {
      setError('Failed to update price')
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
        <div className="flex-none p-4 border-b border-gray-100 relative">
          <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-3 sm:hidden" />
          <h2 className="text-xl font-bold text-gray-800 text-center">
            Bulk Price Update 💰
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

        <div className="overflow-y-auto p-6 flex-1 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 text-red-700 text-sm rounded-xl border border-red-200">
              {error}
            </div>
          )}

          <p className="text-xs text-gray-500 leading-relaxed">
            Update the default rate per liter for <strong>all buyers</strong> at once. This rate will apply to future milk sale entries.
          </p>

          <form id="bulkPriceForm" onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                New Milk Rate (PKR / Liter) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                required
                min="1"
                step="any"
                value={newRate}
                onChange={e => setNewRate(e.target.value === '' ? '' : parseFloat(e.target.value))}
                placeholder="e.g. 200"
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-lg font-bold text-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </form>
        </div>

        <div className="flex-none p-4 border-t border-gray-100 bg-white sm:rounded-b-2xl">
          <button
            type="submit"
            form="bulkPriceForm"
            disabled={isSubmitting}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3.5 px-4 rounded-xl transition-all disabled:opacity-70 flex items-center justify-center shadow-md text-sm"
          >
            {isSubmitting ? 'Updating Prices...' : '💰 Update All Buyer Prices'}
          </button>
        </div>
      </div>
    </>
  )
}
