'use client'

import React, { useState } from 'react'
import { InseminationRecord, Animal, PregnancyFilter } from '@/lib/types'
import InseminationCard from './InseminationCard'
import AddRecordModal from './AddRecordModal'
import { deleteInseminationRecord } from '@/app/dashboard/insemination/actions'

interface InseminationListProps {
  initialRecords: InseminationRecord[]
  animals: Animal[]
  initialFilter?: PregnancyFilter
}

const filterOptions: PregnancyFilter[] = ['All', 'Inseminated', 'Confirmed', 'Calved', 'Aborted', 'Failed']

export default function InseminationList({ initialRecords, animals, initialFilter = 'All' }: InseminationListProps) {
  const [filter, setFilter] = useState<PregnancyFilter>(initialFilter)
  const [searchQuery, setSearchQuery] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editRecord, setEditRecord] = useState<InseminationRecord | null>(null)

  const filteredRecords = initialRecords.filter((record) => {
    const matchesFilter = filter === 'All' || record.pregnancy_status === filter
    const matchesSearch =
      !searchQuery ||
      record.animals?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.animals?.tag_number?.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesFilter && matchesSearch
  })

  const getFilterCount = (f: PregnancyFilter) => {
    if (f === 'All') return initialRecords.length
    return initialRecords.filter((r) => r.pregnancy_status === f).length
  }

  const handleEdit = (record: InseminationRecord) => {
    setEditRecord(record)
    setIsModalOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this record?')) {
      await deleteInseminationRecord(id)
    }
  }

  const openAddModal = () => {
    setEditRecord(null)
    setIsModalOpen(true)
  }

  return (
    <div className="flex flex-col h-full bg-gray-50 pb-32">
      {/* Page Header */}
      <div className="sticky top-0 z-40 bg-white shadow-sm">
        <div className="flex justify-between items-center px-4 py-3">
          <h1 className="text-lg font-bold text-gray-800">Insemination Tracker</h1>
          <button
            onClick={() => setShowSearch(!showSearch)}
            className="p-2 text-gray-600 hover:text-gray-900 focus:outline-none"
            aria-label="Toggle search"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </button>
        </div>

        {/* Search Input */}
        <div
          className={`overflow-hidden transition-all duration-300 ease-in-out ${
            showSearch ? 'max-h-16 opacity-100 border-t border-gray-100' : 'max-h-0 opacity-0'
          }`}
        >
          <div className="px-4 py-2">
            <input
              type="text"
              placeholder="Search by animal name or tag..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#00BFA6] focus:border-[#00BFA6]"
            />
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex overflow-x-auto px-4 py-2 space-x-2 no-scrollbar">
          {filterOptions.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                filter === f
                  ? 'bg-[#00BFA6] text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {f} ({getFilterCount(f)})
            </button>
          ))}
        </div>
      </div>

      {/* Records List */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {filteredRecords.length > 0 ? (
          filteredRecords.map((record) => (
            <InseminationCard
              key={record.id}
              record={record}
              onEdit={() => handleEdit(record)}
              onDelete={() => handleDelete(record.id)}
            />
          ))
        ) : (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <span className="text-6xl mb-4">🐄</span>
            <h3 className="text-lg font-semibold text-gray-800">No Records Yet</h3>
            <p className="text-gray-500 mt-2 max-w-xs">
              Tap the + button to add your first insemination record
            </p>
          </div>
        )}
      </div>

      {/* Floating Action Button */}
      <button
        onClick={openAddModal}
        className="fixed bottom-24 right-6 z-50 flex items-center justify-center w-14 h-14 bg-[#00BFA6] text-white rounded-full shadow-lg hover:scale-105 transition-transform duration-200 focus:outline-none"
        aria-label="Add record"
      >
        <span className="text-2xl font-light leading-none">+</span>
      </button>

      {/* Add/Edit Modal */}
      <AddRecordModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        animals={animals}
        editRecord={editRecord}
      />
    </div>
  )
}
