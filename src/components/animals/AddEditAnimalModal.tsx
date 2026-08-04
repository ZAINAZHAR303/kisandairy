'use client'

import React, { useState, useEffect } from 'react'
import { Animal } from '@/lib/types'
import { addAnimal, updateAnimal } from '@/app/dashboard/animals/actions'
import { calculateAge } from '@/lib/dateUtils'

interface AddEditAnimalModalProps {
  isOpen: boolean
  onClose: () => void
  editAnimal: Animal | null
}

export default function AddEditAnimalModal({ isOpen, onClose, editAnimal }: AddEditAnimalModalProps) {
  const [name, setName] = useState('')
  const [tagNumber, setTagNumber] = useState('')
  const [type, setType] = useState<'cow' | 'buffalo'>('cow')
  const [breed, setBreed] = useState('')
  const [dateOfBirth, setDateOfBirth] = useState('')
  const [gender, setGender] = useState<'female' | 'male'>('female')
  const [status, setStatus] = useState<'Calf' | 'Heifer' | 'Lactating' | 'Dry' | 'Bull'>('Lactating')
  const [damInfo, setDamInfo] = useState('')
  const [bullName, setBullName] = useState('')
  const [notes, setNotes] = useState('')

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      if (editAnimal) {
        setName(editAnimal.name || '')
        setTagNumber(editAnimal.tag_number || '')
        setType(editAnimal.type || 'cow')
        setBreed(editAnimal.breed || '')
        setDateOfBirth(editAnimal.date_of_birth ? new Date(editAnimal.date_of_birth).toISOString().split('T')[0] : '')
        setGender(editAnimal.gender || 'female')
        setStatus(editAnimal.status || 'Lactating')
        setDamInfo(editAnimal.dam_info || '')
        setBullName(editAnimal.bull_name || '')
        setNotes(editAnimal.notes || '')
      } else {
        setName('')
        setTagNumber('')
        setType('cow')
        setBreed('')
        setDateOfBirth('')
        setGender('female')
        setStatus('Lactating')
        setDamInfo('')
        setBullName('')
        setNotes('')
      }
      setError(null)
    }
  }, [isOpen, editAnimal])

  // Live calculated age
  const calculatedAgeText = dateOfBirth ? calculateAge(dateOfBirth) : null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      setError('Animal name is required')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('name', name)
      formData.append('tag_number', tagNumber)
      formData.append('type', type)
      formData.append('breed', breed)
      formData.append('date_of_birth', dateOfBirth)
      formData.append('gender', gender)
      formData.append('status', status)
      formData.append('dam_info', damInfo)
      formData.append('bull_name', bullName)
      formData.append('notes', notes)

      let result
      if (editAnimal && editAnimal.id) {
        formData.append('id', editAnimal.id)
        result = await updateAnimal(formData)
      } else {
        result = await addAnimal(formData)
      }

      if (result?.error) {
        const errMessage = typeof result.error === 'string' 
          ? result.error 
          : (result.error as Error)?.message || 'Failed to save animal'
        setError(errMessage)
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
        role="dialog"
        aria-modal="true"
        aria-labelledby="animal-modal-title"
        className="fixed inset-x-0 bottom-0 sm:bottom-auto sm:inset-x-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 z-[100] w-full sm:w-full sm:max-w-lg bg-white rounded-t-2xl sm:rounded-2xl max-h-[85vh] sm:max-h-[92vh] flex flex-col shadow-2xl animate-slide-up"
      >
        {/* Header */}
        <div className="flex-none p-4 border-b border-gray-100 relative">
          <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-3 sm:hidden" />
          <h2 id="animal-modal-title" className="text-xl font-bold text-gray-800 text-center">
            {editAnimal ? 'Edit Animal Details 🐮' : 'Add New Animal 🐮'}
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

        {/* Form Body */}
        <div className="overflow-y-auto p-6 flex-1 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 text-red-700 text-sm rounded-xl border border-red-200">
              {error}
            </div>
          )}

          <form id="animalForm" onSubmit={handleSubmit} className="space-y-4">
            {/* Name & Tag */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Animal Name / ID <span className="text-red-500">*</span>
                </label>
                <input 
                  type="text" 
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Gauri / Cow 1"
                  required
                  className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-blue)] focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tag Number
                </label>
                <input 
                  type="text" 
                  value={tagNumber}
                  onChange={e => setTagNumber(e.target.value)}
                  placeholder="e.g. TAG-1024"
                  className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-blue)] focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Type & Gender */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Species Type
                </label>
                <div className="flex rounded-xl overflow-hidden border border-gray-200 p-1 bg-gray-50">
                  <button 
                    type="button"
                    onClick={() => setType('cow')}
                    className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center space-x-1 ${type === 'cow' ? 'bg-[var(--color-blue)] text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'}`}
                  >
                    <span>🐮 Cow</span>
                  </button>
                  <button 
                    type="button"
                    onClick={() => setType('buffalo')}
                    className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center space-x-1 ${type === 'buffalo' ? 'bg-[var(--color-blue)] text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'}`}
                  >
                    <span>🦬 Buffalo</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Gender
                </label>
                <div className="flex rounded-xl overflow-hidden border border-gray-200 p-1 bg-gray-50">
                  <button 
                    type="button"
                    onClick={() => setGender('female')}
                    className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center space-x-1 ${gender === 'female' ? 'bg-pink-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'}`}
                  >
                    <span>♀ Female</span>
                  </button>
                  <button 
                    type="button"
                    onClick={() => setGender('male')}
                    className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center space-x-1 ${gender === 'male' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'}`}
                  >
                    <span>♂ Male</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Date of Birth & Live Age Preview */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date of Birth (DOB)
              </label>
              <input 
                type="date" 
                value={dateOfBirth}
                onChange={e => setDateOfBirth(e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-blue)] focus:border-transparent transition-all"
              />

              {calculatedAgeText && (
                <div className="mt-2 bg-blue-50/80 border border-blue-100 rounded-xl p-3 flex justify-between items-center text-xs">
                  <span className="font-medium text-blue-800 uppercase tracking-wider">Live Calculated Age:</span>
                  <span className="font-extrabold text-blue-900 text-sm">{calculatedAgeText}</span>
                </div>
              )}
            </div>

            {/* Status Stage & Breed */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Animal Stage / Status
                </label>
                <select
                  value={status}
                  onChange={e => setStatus(e.target.value as any)}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-blue)] bg-white"
                >
                  <option value="Calf">Calf 🍼 (Newborn/Young)</option>
                  <option value="Heifer">Heifer 🐄 (Young Female)</option>
                  <option value="Lactating">Lactating 🥛 (Milking)</option>
                  <option value="Dry">Dry 💤 (Pregnant Rest)</option>
                  <option value="Bull">Bull 🐂 (Male)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Breed
                </label>
                <input 
                  type="text" 
                  value={breed}
                  onChange={e => setBreed(e.target.value)}
                  placeholder="e.g. Sahiwal / HF"
                  className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-blue)] focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Dam (Mother) Info & Father (Bull) Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mother / Dam Info
                </label>
                <input 
                  type="text" 
                  value={damInfo}
                  onChange={e => setDamInfo(e.target.value)}
                  placeholder="e.g. Dam: Cow 1"
                  className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-blue)] focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Father / Bull Info
                </label>
                <input 
                  type="text" 
                  value={bullName}
                  onChange={e => setBullName(e.target.value)}
                  placeholder="e.g. Bull: Sahiwal-101 / Straw #402"
                  className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-blue)] focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Notes / Remarks */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes / Health Remarks
              </label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Optional health marks, vaccination notes..."
                rows={2}
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-blue)] focus:border-transparent transition-all resize-none"
              />
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="flex-none p-4 border-t border-gray-100 bg-white sm:rounded-b-2xl">
          <button
            type="submit"
            form="animalForm"
            disabled={isSubmitting}
            className="w-full bg-[var(--color-blue)] hover:bg-blue-600 text-white font-medium py-3.5 px-4 rounded-xl transition-colors disabled:opacity-70 flex items-center justify-center shadow-sm"
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Saving Animal...
              </>
            ) : (
              editAnimal ? 'Update Animal Details' : 'Save Animal'
            )}
          </button>
        </div>
      </div>
    </>
  )
}
