'use client'

import React from 'react'
import { Animal } from '@/lib/types'
import Link from 'next/link'
import { calculateAge } from '@/lib/dateUtils'

const COLOR_THEMES = [
  { border: 'border-t-green-500', bg: 'bg-green-50/80', text: 'text-green-600', textDark: 'text-green-700', borderLight: 'border-green-100' },
  { border: 'border-t-blue-500', bg: 'bg-blue-50/80', text: 'text-blue-600', textDark: 'text-blue-700', borderLight: 'border-blue-100' },
  { border: 'border-t-purple-500', bg: 'bg-purple-50/80', text: 'text-purple-600', textDark: 'text-purple-700', borderLight: 'border-purple-100' },
  { border: 'border-t-amber-400', bg: 'bg-amber-50/80', text: 'text-amber-600', textDark: 'text-amber-700', borderLight: 'border-amber-100' },
  { border: 'border-t-teal-400', bg: 'bg-teal-50/80', text: 'text-teal-600', textDark: 'text-teal-700', borderLight: 'border-teal-100' },
  { border: 'border-t-rose-400', bg: 'bg-rose-50/80', text: 'text-rose-600', textDark: 'text-rose-700', borderLight: 'border-rose-100' },
]

interface AnimalCardProps {
  animal: Animal
  onEdit: (animal: Animal) => void
  onDelete: (id: string, name: string) => void
}

export default function AnimalCard({ animal, onEdit, onDelete }: AnimalCardProps) {
  const isBuffalo = animal.type?.toLowerCase() === 'buffalo'
  const isMale = animal.gender === 'male'
  const liveAge = calculateAge(animal.date_of_birth)

  // Deterministically assign a color theme based on animal ID
  const colorIndex = animal.id ? animal.id.charCodeAt(0) % COLOR_THEMES.length : 0
  const theme = COLOR_THEMES[colorIndex]

  // Status Badge Colors
  const getStatusBadge = (status: string | undefined | null) => {
    switch (status) {
      case 'Calf':
        return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-pink-100 text-pink-800 flex items-center gap-1">🍼 Calf</span>
      case 'Heifer':
        return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 flex items-center gap-1">🐄 Heifer</span>
      case 'Lactating':
        return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800 flex items-center gap-1">🥛 Lactating</span>
      case 'Dry':
        return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 flex items-center gap-1">💤 Dry</span>
      case 'Bull':
        return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 flex items-center gap-1">🐂 Bull</span>
      default:
        return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-800 flex items-center gap-1">🐮 Active</span>
    }
  }

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col hover:shadow-lg transition-all border-t-4 ${theme.border}`}>
      {/* Card Header */}
      <div className="px-4 pt-4 pb-2 flex justify-between items-start">
        <div className="flex items-center space-x-3 truncate flex-1 pr-2">
          <div className={`w-12 h-12 rounded-full ${theme.bg} flex items-center justify-center flex-shrink-0 border ${theme.borderLight}`}>
             <span className="text-2xl">{isBuffalo ? '🦬' : '🐮'}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-gray-900 font-bold truncate text-base">{animal.name}</span>
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full w-max mt-0.5 ${isMale ? 'bg-blue-100 text-blue-700' : 'bg-pink-100 text-pink-700'}`}>
              {isMale ? '♂ Male' : '♀ Female'}
            </span>
          </div>
        </div>
        <div className="flex flex-col items-end space-y-1">
          <div className="text-gray-500 text-[10px] bg-gray-50 px-2 py-1 rounded-md font-mono font-semibold uppercase border border-gray-100">
            {animal.tag_number ? `TAG: ${animal.tag_number}` : 'No Tag'}
          </div>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-4 space-y-4 flex-1 flex flex-col justify-between">
        {/* Live Age & Stage Highlight Row */}
        <div className={`${theme.bg} rounded-xl p-2.5 border ${theme.borderLight} flex items-center justify-between`}>
          <div>
            <div className={`text-[10px] ${theme.textDark} uppercase tracking-wider font-bold`}>Live Age</div>
            <div className="text-sm font-extrabold text-gray-900">{liveAge}</div>
          </div>
          <div>
            {getStatusBadge(animal.status)}
          </div>
        </div>

        {/* Breed & Weight Row */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <div className="text-gray-400 uppercase tracking-wider font-semibold">Breed</div>
            <div className="font-bold text-gray-700 truncate">{animal.breed || 'Not specified'}</div>
          </div>
          <div>
            <div className="text-gray-400 uppercase tracking-wider font-semibold">Father / Bull</div>
            <div className="font-bold text-gray-700 truncate" title={animal.bull_name || 'N/A'}>{animal.bull_name || 'N/A'}</div>
          </div>
        </div>

        {/* Genealogy (Mother) Info */}
        {animal.dam_info && (
          <div className="bg-gray-50 rounded-lg p-2 text-xs text-gray-600 border border-gray-100 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-gray-400 font-medium">Mother / Dam:</span>
              <span className="font-bold text-gray-800">{animal.dam_info}</span>
            </div>
          </div>
        )}

        {/* Notes if available */}
        {animal.notes && (
          <div className="text-xs text-gray-500 italic bg-gray-50 p-2 rounded border border-gray-100 truncate" title={animal.notes}>
            📝 {animal.notes}
          </div>
        )}

        {/* Action Buttons */}
        <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
          {!isMale && (
            <Link
              href="/dashboard/insemination"
              className={`flex-1 text-center py-2 px-3 ${theme.bg} hover:opacity-80 ${theme.text} rounded-lg text-xs font-bold transition-opacity`}
            >
              + Insemination
            </Link>
          )}

          <div className="flex items-center space-x-1">
            <button
              onClick={() => onEdit(animal)}
              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-transparent hover:border-blue-100"
              title="Edit Animal Details"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.379-8.379-2.828-2.828z" />
              </svg>
            </button>

            <button
              onClick={() => onDelete(animal.id, animal.name)}
              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100"
              title="Delete Animal"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

