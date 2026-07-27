'use client'

import React, { useState, useEffect } from 'react'
import { InseminationRecord, Animal } from '@/lib/types'
import { addInseminationRecord, updateInseminationRecord, addAnimal } from '@/app/dashboard/insemination/actions'

interface AddRecordModalProps {
  isOpen: boolean
  onClose: () => void
  animals: Animal[]
  editRecord: InseminationRecord | null
}

export default function AddRecordModal({ isOpen, onClose, animals, editRecord }: AddRecordModalProps) {
  const [localAnimals, setLocalAnimals] = useState<Animal[]>(animals)
  
  const [selectedAnimalId, setSelectedAnimalId] = useState<string>('')
  const [aiDate, setAiDate] = useState<string>('')
  const [method, setMethod] = useState<'AI' | 'Natural'>('AI')
  const [semenCompany, setSemenCompany] = useState<string>('')
  const [bullName, setBullName] = useState<string>('')
  const [lactationNo, setLactationNo] = useState<number>(1)
  const [pregnancyStatus, setPregnancyStatus] = useState<string>('AI')

  const [showAddAnimal, setShowAddAnimal] = useState(false)
  const [newAnimalName, setNewAnimalName] = useState('')
  const [newAnimalTag, setNewAnimalTag] = useState('')
  const [newAnimalType, setNewAnimalType] = useState<'cow' | 'buffalo'>('cow')
  const [newAnimalBreed, setNewAnimalBreed] = useState('')

  const [estimatedCalvingDate, setEstimatedCalvingDate] = useState<string | null>(null)

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isAddingAnimal, setIsAddingAnimal] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [animalError, setAnimalError] = useState<string | null>(null)

  // Sync animals prop to local state when it changes
  useEffect(() => {
    setLocalAnimals(animals)
  }, [animals])

  useEffect(() => {
    if (isOpen) {
      if (editRecord) {
        setSelectedAnimalId(editRecord.animal_id || '')
        setAiDate(editRecord.ai_date ? new Date(editRecord.ai_date).toISOString().split('T')[0] : '')
        setMethod((editRecord.method as 'AI' | 'Natural') || 'AI')
        setSemenCompany(editRecord.semen_company || '')
        setBullName(editRecord.bull_name || '')
        setLactationNo(editRecord.lactation_no || 1)
        setPregnancyStatus(editRecord.pregnancy_status || (editRecord.method || 'AI'))
      } else {
        setSelectedAnimalId('')
        setAiDate(new Date().toISOString().split('T')[0])
        setMethod('AI')
        setSemenCompany('')
        setBullName('')
        setLactationNo(1)
        setPregnancyStatus('AI')
      }
      setShowAddAnimal(false)
      setError(null)
      setAnimalError(null)
    }
  }, [isOpen, editRecord])

  useEffect(() => {
    if (!selectedAnimalId || !aiDate || selectedAnimalId === 'new') {
      setEstimatedCalvingDate(null)
      return
    }

    const animal = localAnimals.find(a => a.id === selectedAnimalId)
    if (!animal) {
      setEstimatedCalvingDate(null)
      return
    }

    const date = new Date(aiDate)
    if (isNaN(date.getTime())) {
      setEstimatedCalvingDate(null)
      return
    }

    const daysToAdd = animal.type === 'buffalo' ? 310 : 283
    date.setDate(date.getDate() + daysToAdd)
    
    setEstimatedCalvingDate(date.toLocaleDateString(undefined, { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    }))
  }, [selectedAnimalId, aiDate, localAnimals])

  useEffect(() => {
    if (!editRecord && (method === 'AI' || method === 'Natural')) {
      setPregnancyStatus(method)
    }
  }, [method, editRecord])

  const handleAnimalSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value
    if (value === 'new') {
      setShowAddAnimal(true)
      setSelectedAnimalId('')
    } else {
      setShowAddAnimal(false)
      setSelectedAnimalId(value)
    }
  }

  const handleAddAnimal = async () => {
    if (!newAnimalName.trim()) {
      setAnimalError('Name is required')
      return
    }

    setIsAddingAnimal(true)
    setAnimalError(null)

    try {
      const formData = new FormData()
      formData.append('name', newAnimalName)
      formData.append('tag_number', newAnimalTag)
      formData.append('type', newAnimalType)
      formData.append('breed', newAnimalBreed)

      const result = await addAnimal(formData)
      
      if (result?.error) {
        setAnimalError(typeof result.error === 'string' ? result.error : (result.error as Error)?.message || 'Failed to add animal')
      } else if (result?.data) {
        const newAnimal = result.data as Animal
        setLocalAnimals(prev => [...prev, newAnimal])
        setSelectedAnimalId(newAnimal.id || '')
        setShowAddAnimal(false)
        setNewAnimalName('')
        setNewAnimalTag('')
        setNewAnimalType('cow')
        setNewAnimalBreed('')
      }
    } catch (err) {
      setAnimalError('Failed to add animal')
    } finally {
      setIsAddingAnimal(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedAnimalId || selectedAnimalId === 'new') {
      setError('Please select an animal')
      return
    }

    if (!aiDate) {
      setError('A.I. Date is required')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('animal_id', selectedAnimalId)
      formData.append('ai_date', aiDate)
      formData.append('method', method)
      if (semenCompany) formData.append('semen_company', semenCompany)
      if (bullName) formData.append('bull_name', bullName)
      formData.append('lactation_no', lactationNo.toString())
      formData.append('pregnancy_status', pregnancyStatus)

      let result
      if (editRecord && editRecord.id) {
        formData.append('id', editRecord.id)
        result = await updateInseminationRecord(formData)
      } else {
        result = await addInseminationRecord(formData)
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

  if (!isOpen && !isSubmitting) return null

  return (
    <>
      <div 
        className={`fixed inset-0 bg-black/50 z-50 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} 
        onClick={onClose}
      />
      <div 
        className={`fixed inset-x-0 bottom-0 sm:bottom-auto sm:inset-x-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 z-50 w-full sm:w-full sm:max-w-md bg-white rounded-t-2xl sm:rounded-2xl max-h-[90vh] flex flex-col shadow-2xl transition-transform duration-300 ease-out transform ${isOpen ? 'translate-y-0 sm:scale-100' : 'translate-y-full sm:translate-y-0 sm:scale-95 sm:opacity-0'}`}
      >
        <div className="flex-none p-4 border-b border-gray-100 relative">
          <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-4 sm:hidden" />
          <h2 className="text-xl font-bold text-gray-800 text-center">
            {editRecord ? 'Edit Record' : 'Add New Record'}
          </h2>
          <button 
            onClick={onClose}
            className="absolute right-4 top-4 sm:top-5 p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="overflow-y-auto p-6 flex-1">
          {error && (
            <div className="mb-5 p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200">
              {error}
            </div>
          )}

          <form id="recordForm" onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Select Animal <span className="text-red-500">*</span></label>
              <select 
                value={showAddAnimal ? 'new' : selectedAnimalId}
                onChange={handleAnimalSelectChange}
                disabled={!!editRecord}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#00BFA6] focus:border-transparent transition-all disabled:bg-gray-50 disabled:text-gray-500 appearance-none bg-white"
              >
                <option value="">-- Select Animal --</option>
                {localAnimals.map(animal => (
                  <option key={animal.id} value={animal.id}>
                    {animal.name} {animal.tag_number ? `(${animal.tag_number})` : ''}
                  </option>
                ))}
                {!editRecord && <option value="new">+ Add New Animal</option>}
              </select>
            </div>

            {showAddAnimal && !editRecord && (
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-4">
                <h3 className="text-sm font-semibold text-gray-800 border-b border-gray-200 pb-2">New Animal Details</h3>
                
                {animalError && (
                  <div className="text-red-600 text-xs">{animalError}</div>
                )}
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Name *</label>
                    <input type="text" value={newAnimalName} onChange={e => setNewAnimalName(e.target.value)} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:ring-[#00BFA6] focus:border-[#00BFA6]" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Tag Number</label>
                    <input type="text" value={newAnimalTag} onChange={e => setNewAnimalTag(e.target.value)} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:ring-[#00BFA6] focus:border-[#00BFA6]" />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Type</label>
                    <select value={newAnimalType} onChange={e => setNewAnimalType(e.target.value as 'cow' | 'buffalo')} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:ring-[#00BFA6] focus:border-[#00BFA6] bg-white">
                      <option value="cow">Cow</option>
                      <option value="buffalo">Buffalo</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Breed</label>
                    <input type="text" value={newAnimalBreed} onChange={e => setNewAnimalBreed(e.target.value)} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:ring-[#00BFA6] focus:border-[#00BFA6]" />
                  </div>
                </div>

                <div className="flex justify-end gap-2 mt-2">
                  <button type="button" onClick={() => { setShowAddAnimal(false); setSelectedAnimalId(''); setAnimalError(null); }} className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
                  <button type="button" onClick={handleAddAnimal} disabled={isAddingAnimal} className="px-3 py-1.5 text-xs font-medium text-white bg-[#00BFA6] rounded-lg hover:bg-[#00a892] disabled:opacity-70 flex items-center">
                    {isAddingAnimal ? <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></span> : null}
                    Save Animal
                  </button>
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">A.I. Date <span className="text-red-500">*</span></label>
              <input 
                type="date" 
                value={aiDate}
                onChange={e => setAiDate(e.target.value)}
                required
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#00BFA6] focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Method</label>
              <div className="flex rounded-xl overflow-hidden border border-gray-200 p-1 bg-gray-50">
                <button 
                  type="button"
                  onClick={() => setMethod('AI')}
                  className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${method === 'AI' ? 'bg-[#00BFA6] text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'}`}
                >
                  AI
                </button>
                <button 
                  type="button"
                  onClick={() => setMethod('Natural')}
                  className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${method === 'Natural' ? 'bg-[#00BFA6] text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'}`}
                >
                  Natural
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Semen Company</label>
                <input 
                  type="text" 
                  value={semenCompany}
                  onChange={e => setSemenCompany(e.target.value)}
                  placeholder="Optional"
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#00BFA6] focus:border-transparent transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Bull Name</label>
                <input 
                  type="text" 
                  value={bullName}
                  onChange={e => setBullName(e.target.value)}
                  placeholder="Optional"
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#00BFA6] focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Lactation No</label>
                <input 
                  type="number" 
                  min="1"
                  value={lactationNo}
                  onChange={e => setLactationNo(parseInt(e.target.value) || 1)}
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#00BFA6] focus:border-transparent transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Pregnancy Status</label>
                <select 
                  value={pregnancyStatus}
                  onChange={e => setPregnancyStatus(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#00BFA6] focus:border-transparent transition-all appearance-none bg-white"
                >
                  <option value="AI">AI</option>
                  <option value="Natural">Natural</option>
                  <option value="Confirmed">Confirmed</option>
                  <option value="Failed">Failed</option>
                </select>
              </div>
            </div>

            <div className="bg-teal-50 border border-teal-100 rounded-xl p-4 mt-2">
              <label className="block text-xs font-semibold text-teal-800 uppercase tracking-wider mb-1">Estimated Calving Date</label>
              <div className="text-teal-900 font-medium">
                {estimatedCalvingDate ? estimatedCalvingDate : <span className="text-teal-700/60 text-sm">Select animal and date to calculate</span>}
              </div>
            </div>
          </form>
        </div>

        <div className="flex-none p-4 border-t border-gray-100 bg-white sm:rounded-b-2xl">
          <button
            type="submit"
            form="recordForm"
            disabled={isSubmitting}
            className="w-full bg-[#00BFA6] hover:bg-[#00a892] text-white font-medium py-3.5 px-4 rounded-xl transition-colors disabled:opacity-70 flex items-center justify-center shadow-sm"
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
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
