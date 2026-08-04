'use client'

import React, { useState, useMemo } from 'react'
import { VaccinationRecord, Animal } from '@/lib/types'
import VaccinationCard from './VaccinationCard'
import AddEditVaccinationModal from './AddEditVaccinationModal'
import { deleteVaccinationRecord } from '@/app/dashboard/vaccinations/actions'
import { computeVaccineStatus } from '@/lib/dateUtils'

interface VaccinationsListProps {
  initialRecords: VaccinationRecord[]
  animals: Animal[]
  initialTab?: 'all' | 'overdue'
}

const vaccineOptions = [
  'All Vaccines',
  'FMD (Foot & Mouth Disease)',
  'HS (Hemorrhagic Septicemia)',
  'BQ (Black Quarter)',
  'Brucellosis',
  'LSD (Lumpy Skin Disease)',
  'Other'
]

export default function VaccinationsList({ initialRecords, animals, initialTab = 'all' }: VaccinationsListProps) {
  const [activeTab, setActiveTab] = useState<'all' | 'overdue'>(initialTab)
  const [selectedAnimalId, setSelectedAnimalId] = useState<string>('all')
  const [selectedVaccine, setSelectedVaccine] = useState<string>('All Vaccines')

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editRecord, setEditRecord] = useState<VaccinationRecord | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Compute status dynamically for all records based on today's date
  const processedRecords = useMemo(() => {
    return initialRecords.map(r => ({
      ...r,
      status: computeVaccineStatus(r.next_due_date)
    }))
  }, [initialRecords])

  // Summary counts
  const totalCount = processedRecords.length
  const overdueCount = useMemo(() => processedRecords.filter(r => r.status === 'Overdue').length, [processedRecords])
  const upcomingCount = useMemo(() => processedRecords.filter(r => r.status === 'Upcoming').length, [processedRecords])
  const upToDateCount = useMemo(() => processedRecords.filter(r => r.status === 'Given').length, [processedRecords])

  // Tab 1: Filtered All Records
  const tab1FilteredRecords = useMemo(() => {
    return processedRecords.filter(record => {
      const matchesAnimal = selectedAnimalId === 'all' || record.animal_id === selectedAnimalId
      const matchesVaccine = selectedVaccine === 'All Vaccines' || record.vaccine_name.toLowerCase().includes(selectedVaccine.toLowerCase().split(' ')[0])
      return matchesAnimal && matchesVaccine
    })
  }, [processedRecords, selectedAnimalId, selectedVaccine])

  // Tab 2: Urgent Overdue & Upcoming Records (sorted by next_due_date ascending)
  const urgentRecords = useMemo(() => {
    return processedRecords
      .filter(record => record.status === 'Overdue' || record.status === 'Upcoming')
      .sort((a, b) => new Date(a.next_due_date).getTime() - new Date(b.next_due_date).getTime())
  }, [processedRecords])

  const handleOpenAdd = () => {
    setEditRecord(null)
    setIsModalOpen(true)
  }

  const handleOpenEdit = (record: VaccinationRecord) => {
    setEditRecord(record)
    setIsModalOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this vaccination record?')) {
      setDeletingId(id)
      try {
        await deleteVaccinationRecord(id)
      } catch (err) {
        alert('Failed to delete record')
      } finally {
        setDeletingId(null)
      }
    }
  }

  return (
    <div className="space-y-6 pb-20">
      {/* Top Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Vaccination Tracker 💉</h1>
          <p className="text-xs text-gray-500 mt-0.5">Track vaccine schedules, due dates & health immunity</p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="bg-[var(--color-blue)] hover:bg-blue-600 text-white text-xs font-semibold px-3.5 py-2.5 rounded-xl shadow-sm transition-all flex items-center space-x-1"
        >
          <span>+ Log Vaccination</span>
        </button>
      </div>

      {/* Summary Cards Grid (4 stat cards) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Vaccinated */}
        <div className="bg-white rounded-2xl shadow-sm border-l-4 border-l-blue-600 p-4 flex flex-col justify-between gap-1">
          <div className="flex items-center gap-1.5 text-gray-500 text-xs font-medium">
            <span>💉</span>
            <span>Total Records</span>
          </div>
          <div className="text-2xl font-extrabold text-gray-900">
            {totalCount}
          </div>
        </div>

        {/* Overdue */}
        <div 
          onClick={() => setActiveTab('overdue')}
          className="bg-white rounded-2xl shadow-sm border-l-4 border-l-red-600 p-4 flex flex-col justify-between gap-1 cursor-pointer hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between text-gray-500 text-xs font-medium">
            <span className="flex items-center gap-1 text-red-600 font-bold">⚠️ Overdue</span>
            <span className="text-[10px] text-gray-400">View &rarr;</span>
          </div>
          <div className="text-2xl font-extrabold text-red-600">
            {overdueCount}
          </div>
        </div>

        {/* Due in 14 Days */}
        <div 
          onClick={() => setActiveTab('overdue')}
          className="bg-white rounded-2xl shadow-sm border-l-4 border-l-orange-500 p-4 flex flex-col justify-between gap-1 cursor-pointer hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between text-gray-500 text-xs font-medium">
            <span className="flex items-center gap-1 text-orange-600 font-bold">⏰ Due in 14 Days</span>
            <span className="text-[10px] text-gray-400">View &rarr;</span>
          </div>
          <div className="text-2xl font-extrabold text-orange-600">
            {upcomingCount}
          </div>
        </div>

        {/* Up to Date */}
        <div className="bg-white rounded-2xl shadow-sm border-l-4 border-l-green-600 p-4 flex flex-col justify-between gap-1">
          <div className="flex items-center gap-1.5 text-gray-500 text-xs font-medium">
            <span>✅ Up to Date</span>
          </div>
          <div className="text-2xl font-extrabold text-green-600">
            {upToDateCount}
          </div>
        </div>
      </div>

      {/* Two Sub-Tabs */}
      <div className="bg-gray-200/80 p-1 rounded-2xl flex border border-gray-200">
        <button
          onClick={() => setActiveTab('all')}
          className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center space-x-1.5 ${
            activeTab === 'all' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <span>📋 All Records</span>
          <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full text-[10px]">
            {processedRecords.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('overdue')}
          className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center space-x-1.5 ${
            activeTab === 'overdue' ? 'bg-white text-red-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <span>🚨 Overdue & Upcoming</span>
          {(overdueCount > 0 || upcomingCount > 0) && (
            <span className="bg-red-500 text-white px-2 py-0.5 rounded-full text-[10px]">
              {overdueCount + upcomingCount}
            </span>
          )}
        </button>
      </div>

      {/* Tab 1: All Records View */}
      {activeTab === 'all' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1">Filter Animal</label>
              <select
                value={selectedAnimalId}
                onChange={e => setSelectedAnimalId(e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-blue)] bg-gray-50 font-medium"
              >
                <option value="all">All Animals ({animals.length})</option>
                {animals.map(a => (
                  <option key={a.id} value={a.id}>{a.name} {a.tag_number ? `(TAG: ${a.tag_number})` : ''}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1">Filter Vaccine</label>
              <select
                value={selectedVaccine}
                onChange={e => setSelectedVaccine(e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-blue)] bg-gray-50 font-medium"
              >
                {vaccineOptions.map(v => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Cards List */}
          {tab1FilteredRecords.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {tab1FilteredRecords.map(record => (
                <VaccinationCard
                  key={record.id}
                  record={record}
                  onEdit={handleOpenEdit}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-8 text-center border border-gray-100 shadow-sm space-y-4 my-6">
              <div className="text-5xl">💉</div>
              <h3 className="text-lg font-bold text-gray-800">No Vaccination Records Found</h3>
              <p className="text-sm text-gray-500 max-w-xs mx-auto">
                {selectedAnimalId !== 'all' || selectedVaccine !== 'All Vaccines'
                  ? 'No vaccination records match your active filters.'
                  : 'Tap the + button to log your first animal vaccination.'}
              </p>
              <button
                onClick={handleOpenAdd}
                className="inline-flex items-center space-x-2 bg-[var(--color-blue)] hover:bg-blue-600 text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-sm transition-all"
              >
                <span>+ Log Vaccination</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Overdue & Upcoming View */}
      {activeTab === 'overdue' && (
        <div className="space-y-4">
          {urgentRecords.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {urgentRecords.map(record => (
                <VaccinationCard
                  key={record.id}
                  record={record}
                  onEdit={handleOpenEdit}
                  onDelete={handleDelete}
                  isUrgentView={true}
                />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-8 text-center border border-gray-100 shadow-sm space-y-3 my-6">
              <div className="text-6xl animate-bounce">🎉</div>
              <h3 className="text-xl font-extrabold text-green-700">All Vaccinations Up to Date!</h3>
              <p className="text-sm text-gray-500 max-w-xs mx-auto">
                Great job! No animals have overdue or upcoming vaccination deadlines in the next 14 days.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Floating Action Button */}
      <button
        onClick={handleOpenAdd}
        className="fixed bottom-24 right-6 w-14 h-14 bg-[var(--color-blue)] hover:bg-blue-600 text-white rounded-full flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all z-40"
        title="Log Vaccination"
      >
        <span className="text-3xl font-light leading-none mb-1">+</span>
      </button>

      {/* Add / Edit Modal */}
      <AddEditVaccinationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        animals={animals}
        editRecord={editRecord}
      />
    </div>
  )
}
