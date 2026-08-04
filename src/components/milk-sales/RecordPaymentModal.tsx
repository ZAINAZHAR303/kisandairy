'use client'

import React, { useState, useEffect } from 'react'
import { Seller } from '@/lib/types'
import { addSellerPayment } from '@/app/dashboard/milk-sales/actions'
import { savePendingPayment } from '@/lib/offlineDb'
import { useToast } from '@/components/ui/Toast'

interface RecordPaymentModalProps {
  isOpen: boolean
  onClose: () => void
  sellers: Seller[]
  defaultSellerId?: string
}

export default function RecordPaymentModal({ isOpen, onClose, sellers, defaultSellerId }: RecordPaymentModalProps) {
  const { showToast } = useToast()
  const [sellerId, setSellerId] = useState<string>('')
  const [date, setDate] = useState<string>('')
  const [amountPaid, setAmountPaid] = useState<number | ''>('')
  const [notes, setNotes] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      setSellerId(defaultSellerId || (sellers[0]?.id || ''))
      setDate(new Date().toISOString().split('T')[0])
      setAmountPaid('')
      setNotes('')
      setError(null)
    }
  }, [isOpen, defaultSellerId, sellers])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!sellerId) {
      setError('Please select a buyer')
      return
    }

    if (!amountPaid || Number(amountPaid) <= 0) {
      setError('Please enter a valid payment amount')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      // ── OFFLINE MODE: save to IndexedDB ──
      if (!navigator.onLine) {
        await savePendingPayment({
          seller_id: sellerId,
          date,
          amount_paid: Number(amountPaid),
          notes: notes || '',
        })
        onClose()
        showToast('offline', 'Payment saved offline!', 'انٹرنیٹ آنے پر خود بخود sync ہو گا۔')
        return
      }

      const formData = new FormData()
      formData.append('seller_id', sellerId)
      formData.append('date', date)
      formData.append('amount_paid', amountPaid.toString())
      if (notes) formData.append('notes', notes)

      const result = await addSellerPayment(formData)

      if (result && 'error' in result && result.error) {
        const errObj = result.error as any
        setError(typeof errObj === 'string' ? errObj : errObj.message || 'Failed to record payment')
      } else {
        onClose()
      }
    } catch (err: any) {
      // Network failed mid-request — fallback to offline
      if (!navigator.onLine) {
        try {
          await savePendingPayment({
            seller_id: sellerId,
            date,
            amount_paid: Number(amountPaid),
            notes: notes || '',
          })
          onClose()
          showToast('offline', 'Payment saved offline!', 'انٹرنیٹ آنے پر خود بخود sync ہو گا۔')
          return
        } catch {
          setError('Could not save offline. Please try again.')
        }
      } else {
        setError(err?.message || 'An error occurred while saving payment')
      }
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
        role="dialog"
        aria-modal="true"
        aria-labelledby="payment-modal-title"
        className="fixed inset-x-0 bottom-0 sm:bottom-auto sm:inset-x-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 z-[100] w-full sm:w-full sm:max-w-md bg-white rounded-t-2xl sm:rounded-2xl max-h-[85vh] sm:max-h-[90vh] flex flex-col shadow-2xl animate-slide-up"
      >
        <div className="flex-none p-4 border-b border-gray-100 relative">
          <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-3 sm:hidden" />
          <h2 id="payment-modal-title" className="text-xl font-bold text-gray-800 text-center">
            Record Buyer Payment 💰
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

          <form id="paymentForm" onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Select Buyer / Customer <span className="text-red-500">*</span>
              </label>
              <select
                value={sellerId}
                onChange={e => setSellerId(e.target.value)}
                required
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#00BFA6] bg-white font-medium"
              >
                <option value="">-- Select Buyer --</option>
                {sellers.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Payment Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#00BFA6]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Amount Received (PKR) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                required
                min="1"
                step="any"
                value={amountPaid}
                onChange={e => setAmountPaid(e.target.value === '' ? '' : parseFloat(e.target.value))}
                placeholder="e.g. 5200"
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-base font-bold text-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Notes / Reference <span className="text-gray-400 font-normal">(Optional)</span>
              </label>
              <input
                type="text"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="e.g. Cash paid / JazzCash / Bank transfer"
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#00BFA6]"
              />
            </div>
          </form>
        </div>

        <div className="flex-none p-4 border-t border-gray-100 bg-white sm:rounded-b-2xl">
          <button
            type="submit"
            form="paymentForm"
            disabled={isSubmitting}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 px-4 rounded-xl transition-all disabled:opacity-70 flex items-center justify-center shadow-md text-sm"
          >
            {isSubmitting ? 'Recording Payment...' : '💰 Record Payment'}
          </button>
        </div>
      </div>
    </>
  )
}
