'use client'

import React, { useState, useEffect } from 'react'
import { Seller } from '@/lib/types'
import { addSeller, updateSeller } from '@/app/dashboard/milk-sales/actions'

interface AddEditSellerModalProps {
  isOpen: boolean
  onClose: () => void
  editSeller: Seller | null
}

export default function AddEditSellerModal({ isOpen, onClose, editSeller }: AddEditSellerModalProps) {
  const [name, setName] = useState('')
  const [contactNumber, setContactNumber] = useState('')
  const [ratePerLiter, setRatePerLiter] = useState<number | ''>('')

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      if (editSeller) {
        setName(editSeller.name || '')
        setContactNumber(editSeller.contact_number || '')
        setRatePerLiter(editSeller.rate_per_liter ?? '')
      } else {
        setName('')
        setContactNumber('')
        setRatePerLiter('')
      }
      setError(null)
    }
  }, [isOpen, editSeller])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      setError('Seller name is required')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('name', name)
      formData.append('contact_number', contactNumber)
      formData.append('rate_per_liter', (ratePerLiter || 0).toString())

      let result
      if (editSeller && editSeller.id) {
        formData.append('id', editSeller.id)
        result = await updateSeller(formData)
      } else {
        result = await addSeller(formData)
      }

      if (result?.error) {
        setError(typeof result.error === 'string' ? result.error : (result.error as Error)?.message || 'Failed to save seller')
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
        className="fixed inset-0 bg-black/50 z-50 transition-opacity duration-300 animate-fade-in" 
        onClick={onClose}
      />
      <div 
        className="fixed inset-x-0 bottom-0 sm:bottom-auto sm:inset-x-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 z-50 w-full sm:w-full sm:max-w-md bg-white rounded-t-2xl sm:rounded-2xl max-h-[90vh] flex flex-col shadow-2xl animate-slide-up"
      >
        <div className="flex-none p-4 border-b border-gray-100 relative">
          <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-3 sm:hidden" />
          <h2 className="text-xl font-bold text-gray-800 text-center">
            {editSeller ? 'Edit Seller Details 👤' : 'Add New Seller 👤'}
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

        <div className="overflow-y-auto p-6 flex-1 space-y-5">
          {error && (
            <div className="p-3 bg-red-50 text-red-700 text-sm rounded-xl border border-red-200">
              {error}
            </div>
          )}

          <form id="sellerForm" onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Seller Name / Dairy Name <span className="text-red-500">*</span>
              </label>
              <input 
                type="text" 
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. City Dairy / Ramesh"
                required
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#00BFA6] focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Contact Number
              </label>
              <input 
                type="text" 
                value={contactNumber}
                onChange={e => setContactNumber(e.target.value)}
                placeholder="e.g. +91 9876543210"
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#00BFA6] focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Default Rate per Liter (Rs.)
              </label>
              <input 
                type="number" 
                step="0.01"
                min="0"
                value={ratePerLiter}
                onChange={e => setRatePerLiter(e.target.value === '' ? '' : parseFloat(e.target.value))}
                placeholder="e.g. 75.00"
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#00BFA6] focus:border-transparent transition-all"
              />
            </div>
          </form>
        </div>

        <div className="flex-none p-4 border-t border-gray-100 bg-white sm:rounded-b-2xl">
          <button
            type="submit"
            form="sellerForm"
            disabled={isSubmitting}
            className="w-full bg-[#00BFA6] hover:bg-[#00a892] text-white font-medium py-3.5 px-4 rounded-xl transition-colors disabled:opacity-70 flex items-center justify-center shadow-sm"
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Saving...
              </>
            ) : (
              editSeller ? 'Update Seller Details' : 'Save Seller'
            )}
          </button>
        </div>
      </div>
    </>
  )
}
