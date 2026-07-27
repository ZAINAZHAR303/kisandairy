'use client'

import React, { useState, useEffect } from 'react'
import { VaccinationRecord, Animal } from '@/lib/types'
import { addVaccinationRecord, updateVaccinationRecord } from '@/app/dashboard/vaccinations/actions'
import { calculateNextDueDate } from '@/lib/dateUtils'

interface AddEditVaccinationModalProps {
  isOpen: boolean
  onClose: () => void
  animals: Animal[]
  editRecord: VaccinationRecord | null
}

const standardVaccines = [
  { name: 'FMD (Foot & Mouth Disease)', intervalMonths: 6 },
  { name: 'HS (Hemorrhagic Septicemia)', intervalMonths: 6 },
  { name: 'BQ (Black Quarter)', intervalMonths: 12 },
  { name: 'Brucellosis', intervalMonths: 12 },
  { name: 'LSD (Lumpy Skin Disease)', intervalMonths: 12 },
  { name: 'Other', intervalMonths: 0 },
]

export default function AddEditVaccinationModal({ isOpen, onClose, animals, editRecord }: AddEditVaccinationModalProps) {
  const [selectedAnimalId, setSelectedAnimalId] = useState('')
  const [vaccineSelect, setVaccineSelect] = useState('FMD (Foot & Mouth Disease)')
  const [customVaccineName, setCustomVaccineName] = useState('')
  const [dateGiven, setDateGiven] = useState('')
  const [givenBy, setGivenBy] = useState('')
  const [nextDueDate, setNextDueDate] = useState('')
  const [notes, setNotes] = useState('')

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      if (editRecord) {
        setSelectedAnimalId(editRecord.animal_id || '')
        
        const isStandard = standardVaccines.some(v => v.name === editRecord.vaccine_name)
        if (isStandard) {
          setVaccineSelect(editRecord.vaccine_name)
          setCustomVaccineName('')
        } else {
          setVaccineSelect('Other')
          setCustomVaccineName(editRecord.vaccine_name)
        }

        setDateGiven(editRecord.date_given ? new Date(editRecord.date_given).toISOString().split('T')[0] : '')
        setGivenBy(editRecord.given_by || '')
        setNextDueDate(editRecord.next_due_date ? new Date(editRecord.next_due_date).toISOString().split('T')[0] : '')
        setNotes(editRecord.notes || '')
      } else {
        setSelectedAnimalId(animals[0]?.id || '')
        setVaccineSelect('FMD (Foot & Mouth Disease)')
        setCustomVaccineName('')
        const todayStr = new Date().toISOString().split('T')[0]
        setDateGiven(todayStr)
        setGivenBy('')
        setNextDueDate(calculateNextDueDate('FMD (Foot & Mouth Disease)', todayStr))
        setNotes('')
      }
      setError(null)
    }
  }, [isOpen, editRecord, animals])

  // Recalculate Next Due Date when vaccine or dateGiven changes
  useEffect(() => {
    if (!editRecord && dateGiven) {
      if (vaccineSelect !== 'Other') {
        const calculated = calculateNextDueDate(vaccineSelect, dateGiven)
        setNextDueDate(calculated)
      }
    }
  }, [vaccineSelect, dateGiven, editRecord])

  const actualVaccineName = vaccineSelect === 'Other' ? customVaccineName : vaccineSelect

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedAnimalId) {
      setError('Please select an animal')
      return
    }

    if (!actualVaccineName.trim()) {
      setError('Vaccine name is required')
      return
    }

    if (!dateGiven) {
      setError('Date given is required')
      return
    }

    if (!nextDueDate) {
      setError('Next due date is required')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('animal_id', selectedAnimalId)
      formData.append('vaccine_name', actualVaccineName)
      formData.append('date_given', dateGiven)
      formData.append('given_by', givenBy)
      formData.append('next_due_date', nextDueDate)
      formData.append('notes', notes)

      let result
      if (editRecord && editRecord.id) {
        formData.append('id', editRecord.id)
        result = await updateVaccinationRecord(formData)
      } else {
        result = await addVaccinationRecord(formData)
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
        className="fixed inset-0 bg-black/50 z-50 transition-opacity duration-300 animate-fade-in" 
        onClick={onClose}
      />
      <div 
        className="fixed inset-x-0 bottom-0 sm:bottom-auto sm:inset-x-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 z-50 w-full sm:w-full sm:max-w-md bg-white rounded-t-2xl sm:rounded-2xl max-h-[90vh] flex flex-col shadow-2xl animate-slide-up"
      >
        {/* Header */}
        <div className="flex-none p-4 border-b border-gray-100 relative">
          <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-3 sm:hidden" />
          <h2 className="text-xl font-bold text-gray-800 text-center">
            {editRecord ? 'Edit Vaccination Record 💉' : 'Log Vaccination 💉'}
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

          <form id="vaccineForm" onSubmit={handleSubmit} className="space-y-4">
            {/* Select Animal */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Select Animal <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedAnimalId}
                onChange={e => setSelectedAnimalId(e.target.value)}
                required
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#00BFA6] focus:border-transparent transition-all bg-white font-medium"
              >
                <option value="">-- Select Animal --</option>
                {animals.map(a => (
                  <option key={a.id} value={a.id}>
                    {a.name} {a.tag_number ? `(TAG: ${a.tag_number})` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Vaccine Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Vaccine Name <span className="text-red-500">*</span>
              </label>
              <select
                value={vaccineSelect}
                onChange={e => setVaccineSelect(e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#00BFA6] focus:border-transparent transition-all bg-white font-medium mb-2"
              >
                {standardVaccines.map(v => (
                  <option key={v.name} value={v.name}>
                    {v.name} {v.intervalMonths ? `(Due every ${v.intervalMonths} mon)` : ''}
                  </option>
                ))}
              </select>

              {vaccineSelect === 'Other' && (
                <input
                  type="text"
                  value={customVaccineName}
                  onChange={e => setCustomVaccineName(e.target.value)}
                  placeholder="Enter custom vaccine name..."
                  required
                  className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#00BFA6]"
                />
              )}
            </div>

            {/* Date Given & Given By */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Date Given <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={dateGiven}
                  onChange={e => setDateGiven(e.target.value)}
                  required
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#00BFA6] focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Given By (Vet/Self)
                </label>
                <input
                  type="text"
                  value={givenBy}
                  onChange={e => setGivenBy(e.target.value)}
                  placeholder="e.g. Dr. Ahmed / Self"
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#00BFA6] focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Next Due Date Preview / Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Next Due Date <span className="text-red-500">*</span>
              </label>
              {vaccineSelect !== 'Other' ? (
                <div className="bg-teal-50 border border-teal-100 rounded-xl p-3 flex justify-between items-center">
                  <div>
                    <span className="block text-xs font-semibold text-teal-800 uppercase tracking-wider">Auto-Calculated Next Due</span>
                    <span className="text-xs text-teal-600">Based on vaccine schedule</span>
                  </div>
                  <span className="text-base font-extrabold text-[#00BFA6]">
                    {nextDueDate || 'N/A'}
                  </span>
                </div>
              ) : (
                <input
                  type="date"
                  value={nextDueDate}
                  onChange={e => setNextDueDate(e.target.value)}
                  required
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#00BFA6] focus:border-transparent transition-all"
                />
              )}
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Notes / Health Remarks
              </label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Optional notes or reaction observations..."
                rows={2}
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#00BFA6] resize-none"
              />
            </div>
          </form>
        </div>

        {/* Footer Submit */}
        <div className="flex-none p-4 border-t border-gray-100 bg-white sm:rounded-b-2xl">
          <button
            type="submit"
            form="vaccineForm"
            disabled={isSubmitting}
            className="w-full bg-[#00BFA6] hover:bg-[#00a892] text-white font-medium py-3.5 px-4 rounded-xl transition-colors disabled:opacity-70 flex items-center justify-center shadow-sm"
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Saving Record...
              </>
            ) : (
              editRecord ? 'Update Record' : 'Save Record'
            )}
          </button>
        </div>
      </div>
    </>
  )
}
