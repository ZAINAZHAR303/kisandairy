'use client'

import React from 'react'
import { VaccinationRecord } from '@/lib/types'
import { formatNumericDate } from '@/lib/dateUtils'

interface VaccinationCardProps {
  record: VaccinationRecord
  onEdit: (record: VaccinationRecord) => void
  onDelete: (id: string) => void
  isUrgentView?: boolean
}

export default function VaccinationCard({ record, onEdit, onDelete, isUrgentView = false }: VaccinationCardProps) {
  const formatDate = (dateStr: string) => {
    return formatNumericDate(dateStr)
  }

  const animalName = record.animals?.name || 'Unknown Animal'
  const tagNumber = record.animals?.tag_number ? `TAG: ${record.animals.tag_number}` : 'No Tag'

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Overdue':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-200">🔴 Overdue</span>
      case 'Upcoming':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-800 border border-orange-200">🟠 Upcoming</span>
      default:
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800 border border-green-200">🟢 Up to Date</span>
    }
  }

  // Left border accent for urgent view
  const leftBorderClass = isUrgentView
    ? record.status === 'Overdue' ? 'border-l-4 border-l-red-600' : 'border-l-4 border-l-orange-500'
    : 'border-l-4 border-l-blue-900'

  return (
    <div className={`bg-white rounded-xl shadow-md overflow-hidden flex flex-col hover:shadow-lg transition-shadow ${leftBorderClass}`}>
      {/* Header Row: Dark Navy (#1a2f5e) */}
      <div className="bg-[#1a2f5e] px-4 py-3 flex justify-between items-center rounded-t-xl">
        <div className="text-white font-bold text-sm truncate flex-1 pr-2">
          🐮 {animalName}
        </div>
        <div className="text-white/80 text-xs bg-white/10 px-2.5 py-1 rounded-full whitespace-nowrap border border-white/10 font-mono">
          {tagNumber}
        </div>
      </div>

      {/* Body */}
      <div className="p-4 space-y-3">
        {/* Vaccine Name & Date Given */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="text-xs text-gray-400 uppercase tracking-wider font-medium mb-0.5">Vaccine Name</div>
            <div className="text-sm font-extrabold text-gray-900 truncate" title={record.vaccine_name}>
              💉 {record.vaccine_name}
            </div>
          </div>

          <div>
            <div className="text-xs text-gray-400 uppercase tracking-wider font-medium mb-0.5">Date Given</div>
            <div className="text-sm font-semibold text-gray-800">
              {formatDate(record.date_given)}
            </div>
          </div>
        </div>

        {/* Given By & Status / Next Due */}
        <div className="grid grid-cols-2 gap-3 items-center bg-gray-50/80 p-3 rounded-xl border border-gray-100">
          <div>
            <div className="text-[10px] text-gray-400 uppercase tracking-wider font-medium">Given By</div>
            <div className="text-xs font-semibold text-gray-800">
              {record.given_by || 'Self / Not specified'}
            </div>
          </div>

          <div className="text-right">
            <div className="text-[10px] text-gray-400 uppercase tracking-wider font-medium mb-1">Status & Next Due</div>
            <div className="flex flex-col items-end space-y-1">
              {getStatusBadge(record.status)}
              <span className="text-xs font-bold text-gray-700">Due: {formatDate(record.next_due_date)}</span>
            </div>
          </div>
        </div>

        {/* Notes if available */}
        {record.notes && (
          <p className="text-xs text-gray-500 italic bg-white p-2 rounded-lg border border-gray-100" title={record.notes}>
            📝 {record.notes}
          </p>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end space-x-2 pt-2 border-t border-gray-100">
          <button
            onClick={() => onEdit(record)}
            className="flex items-center space-x-1 px-3 py-1.5 text-teal-600 border border-teal-600 rounded-md hover:bg-teal-50 transition-colors text-xs font-medium"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.379-8.379-2.828-2.828z" />
            </svg>
            <span>Edit</span>
          </button>
          <button
            onClick={() => onDelete(record.id)}
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
