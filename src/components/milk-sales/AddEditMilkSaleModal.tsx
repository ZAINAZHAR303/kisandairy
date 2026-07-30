'use client'

import React, { useState, useEffect } from 'react'
import { MilkSaleEntry, Seller } from '@/lib/types'
import { addMilkSaleEntry, updateMilkSaleEntry, addSeller } from '@/app/dashboard/milk-sales/actions'

interface AddEditMilkSaleModalProps {
  isOpen: boolean
  onClose: () => void
  sellers: Seller[]
  editEntry: MilkSaleEntry | null
}

export default function AddEditMilkSaleModal({ isOpen, onClose, sellers, editEntry }: AddEditMilkSaleModalProps) {
  const [localSellers, setLocalSellers] = useState<Seller[]>(sellers)

  const [selectedSellerId, setSelectedSellerId] = useState<string>('')
  const [date, setDate] = useState<string>('')
  const [morningLiters, setMorningLiters] = useState<number | ''>('')
  const [eveningLiters, setEveningLiters] = useState<number | ''>('')
  const [ratePerLiter, setRatePerLiter] = useState<number | ''>('')

  // Inline mini-form for new seller
  const [showAddSeller, setShowAddSeller] = useState(false)
  const [newSellerName, setNewSellerName] = useState('')
  const [newSellerContact, setNewSellerContact] = useState('')
  const [newSellerRate, setNewSellerRate] = useState<number | ''>('')
  const [isAddingSeller, setIsAddingSeller] = useState(false)
  const [sellerError, setSellerError] = useState<string | null>(null)

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLocalSellers(sellers)
  }, [sellers])

  useEffect(() => {
    if (isOpen) {
      if (editEntry) {
        setSelectedSellerId(editEntry.seller_id || '')
        setDate(editEntry.date ? new Date(editEntry.date).toISOString().split('T')[0] : '')
        setMorningLiters(editEntry.morning_liters ?? 0)
        setEveningLiters(editEntry.evening_liters ?? 0)
        setRatePerLiter(editEntry.rate_per_liter ?? 0)
      } else {
        setSelectedSellerId('')
        setDate(new Date().toISOString().split('T')[0])
        setMorningLiters('')
        setEveningLiters('')
        setRatePerLiter('')
      }
      setShowAddSeller(false)
      setError(null)
      setSellerError(null)
    }
  }, [isOpen, editEntry])

  // When seller changes in add mode, pre-fill default rate
  const handleSellerChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value
    if (val === 'new') {
      setShowAddSeller(true)
      setSelectedSellerId('')
      setRatePerLiter('')
    } else {
      setShowAddSeller(false)
      setSelectedSellerId(val)
      if (!editEntry) {
        const found = localSellers.find(s => s.id === val)
        if (found) {
          setRatePerLiter(found.rate_per_liter ?? '')
        }
      }
    }
  }

  const handleAddSeller = async () => {
    if (!newSellerName.trim()) {
      setSellerError('Seller name is required')
      return
    }

    setIsAddingSeller(true)
    setSellerError(null)

    try {
      const formData = new FormData()
      formData.append('name', newSellerName)
      formData.append('contact_number', newSellerContact)
      formData.append('rate_per_liter', (newSellerRate || 0).toString())

      const result = await addSeller(formData)

      if (result?.error) {
        setSellerError(typeof result.error === 'string' ? result.error : (result.error as Error)?.message || 'Failed to add seller')
      } else if (result?.data) {
        const newSeller = result.data as Seller
        setLocalSellers(prev => [...prev, newSeller])
        setSelectedSellerId(newSeller.id)
        setRatePerLiter(newSeller.rate_per_liter ?? 0)
        setShowAddSeller(false)
        setNewSellerName('')
        setNewSellerContact('')
        setNewSellerRate('')
      }
    } catch (err) {
      setSellerError('Failed to add seller')
    } finally {
      setIsAddingSeller(false)
    }
  }

  // Calculated values
  const mNum = typeof morningLiters === 'number' ? morningLiters : 0
  const eNum = typeof eveningLiters === 'number' ? eveningLiters : 0
  const rNum = typeof ratePerLiter === 'number' ? ratePerLiter : 0

  const totalLitersCalculated = mNum + eNum
  const totalAmountCalculated = totalLitersCalculated * rNum

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedSellerId || selectedSellerId === 'new') {
      setError('Please select a seller')
      return
    }

    if (!date) {
      setError('Date is required')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('seller_id', selectedSellerId)
      formData.append('date', date)
      formData.append('morning_liters', mNum.toString())
      formData.append('evening_liters', eNum.toString())
      formData.append('rate_per_liter', rNum.toString())

      let result
      if (editEntry && editEntry.id) {
        formData.append('id', editEntry.id)
        result = await updateMilkSaleEntry(formData)
      } else {
        result = await addMilkSaleEntry(formData)
      }

      if (result?.error) {
        setError(typeof result.error === 'string' ? result.error : (result.error as Error)?.message || 'An error occurred')
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
            {editEntry ? 'Edit Milk Sale Entry 🥛' : 'Log Milk Sale Entry 🥛'}
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
        <div className="overflow-y-auto p-6 flex-1 space-y-5">
          {error && (
            <div className="p-3 bg-red-50 text-red-700 text-sm rounded-xl border border-red-200">
              {error}
            </div>
          )}

          <form id="milkEntryForm" onSubmit={handleSubmit} className="space-y-4">
            {/* Select Seller */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Select Seller / Buyer <span className="text-red-500">*</span>
              </label>
              <select
                value={showAddSeller ? 'new' : selectedSellerId}
                onChange={handleSellerChange}
                required
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#00BFA6] focus:border-transparent transition-all bg-white"
              >
                <option value="">-- Select Seller --</option>
                {localSellers.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name} {s.rate_per_liter ? `(Rs. ${s.rate_per_liter}/L)` : ''}
                  </option>
                ))}
                <option value="new">+ Add New Seller</option>
              </select>
            </div>

            {/* Inline Mini-Form for New Seller */}
            {showAddSeller && (
              <div className="p-4 bg-teal-50/50 rounded-xl border border-teal-100 space-y-3">
                <h3 className="text-xs font-semibold text-teal-800 uppercase tracking-wider">New Seller Details</h3>
                {sellerError && <div className="text-red-600 text-xs">{sellerError}</div>}
                
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Name *</label>
                  <input
                    type="text"
                    value={newSellerName}
                    onChange={e => setNewSellerName(e.target.value)}
                    placeholder="e.g. City Dairy / Ramesh"
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:ring-[#00BFA6] focus:border-[#00BFA6]"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Contact No.</label>
                    <input
                      type="text"
                      value={newSellerContact}
                      onChange={e => setNewSellerContact(e.target.value)}
                      placeholder="Optional"
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:ring-[#00BFA6] focus:border-[#00BFA6]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Default Rate (Rs./L)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={newSellerRate}
                      onChange={e => setNewSellerRate(e.target.value === '' ? '' : parseFloat(e.target.value))}
                      placeholder="e.g. 75"
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:ring-[#00BFA6] focus:border-[#00BFA6]"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => { setShowAddSeller(false); setSelectedSellerId(''); }}
                    className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleAddSeller}
                    disabled={isAddingSeller}
                    className="px-3 py-1.5 text-xs font-medium text-white bg-[#00BFA6] rounded-lg hover:bg-[#00a892] disabled:opacity-70 flex items-center"
                  >
                    {isAddingSeller && <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin mr-1.5" />}
                    Save Seller
                  </button>
                </div>
              </div>
            )}

            {/* Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                required
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#00BFA6] focus:border-transparent transition-all"
              />
            </div>

            {/* Morning & Evening Liters Inputs */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Morning (Liters)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={morningLiters}
                  onChange={e => setMorningLiters(e.target.value === '' ? '' : parseFloat(e.target.value))}
                  placeholder="0.0"
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#00BFA6] focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Evening (Liters)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={eveningLiters}
                  onChange={e => setEveningLiters(e.target.value === '' ? '' : parseFloat(e.target.value))}
                  placeholder="0.0"
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#00BFA6] focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Total Liters Read-Only Preview */}
            <div className="bg-blue-50/70 border border-blue-100 rounded-xl p-3 flex justify-between items-center">
              <span className="text-xs font-semibold text-blue-800 uppercase tracking-wider">Total Liters Preview</span>
              <span className="text-base font-bold text-blue-900">{totalLitersCalculated.toFixed(2)} L</span>
            </div>

            {/* Rate Per Liter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Rate per Liter (Rs.) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={ratePerLiter}
                onChange={e => setRatePerLiter(e.target.value === '' ? '' : parseFloat(e.target.value))}
                placeholder="e.g. 80.00"
                required
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#00BFA6] focus:border-transparent transition-all"
              />
            </div>

            {/* Total Amount Read-Only Preview */}
            <div className="bg-teal-50 border border-teal-100 rounded-xl p-4 flex justify-between items-center">
              <div>
                <span className="block text-xs font-semibold text-teal-800 uppercase tracking-wider">Total Amount</span>
                <span className="text-xs text-teal-600 font-normal">({totalLitersCalculated.toFixed(2)} L × Rs. {rNum})</span>
              </div>
              <span className="text-xl font-extrabold text-[#00BFA6]">
                Rs. {totalAmountCalculated.toFixed(2)}
              </span>
            </div>
          </form>
        </div>

        {/* Footer Submit Button */}
        <div className="flex-none p-4 border-t border-gray-100 bg-white sm:rounded-b-2xl">
          <button
            type="submit"
            form="milkEntryForm"
            disabled={isSubmitting}
            className="w-full bg-[#00BFA6] hover:bg-[#00a892] text-white font-medium py-3.5 px-4 rounded-xl transition-colors disabled:opacity-70 flex items-center justify-center shadow-sm"
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Saving Entry...
              </>
            ) : (
              editEntry ? 'Update Entry' : 'Save Entry'
            )}
          </button>
        </div>
      </div>
    </>
  )
}
