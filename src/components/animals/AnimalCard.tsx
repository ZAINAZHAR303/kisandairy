'use client'

import React from 'react'
import { Animal } from '@/lib/types'
import Link from 'next/link'
import { calculateAge } from '@/lib/dateUtils'

interface AnimalCardProps {
  animal: Animal
  onEdit: (animal: Animal) => void
  onDelete: (id: string, name: string) => void
}

export default function AnimalCard({ animal, onEdit, onDelete }: AnimalCardProps) {
  const isBuffalo = animal.type?.toLowerCase() === 'buffalo'
  const isMale = animal.gender === 'male'
  const liveAge = calculateAge(animal.date_of_birth)

  // Status Badge Colors
  const getStatusBadge = (status: string | undefined | null) => {
    switch (status) {
      case 'Calf':
        return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-pink-100 text-pink-800">🍼 Calf</span>
      case 'Heifer':
        return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800">🐄 Heifer</span>
      case 'Lactating':
        return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800">🥛 Lactating</span>
      case 'Dry':
        return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">💤 Dry</span>
      case 'Bull':
        return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">🐂 Bull</span>
      default:
        return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-800">🐮 Active</span>
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden flex flex-col hover:shadow-lg transition-shadow">
      {/* Card Header: Dark Navy (#1a2f5e) */}
      <div className="bg-white border-b border-gray-100 px-4 py-3 flex justify-between items-center rounded-t-xl">
        <div className="flex items-center space-x-2 truncate flex-1 pr-2">
          <span className="text-xl">{isBuffalo ? '🦬' : '🐮'}</span>
          <span className="text-gray-900 font-bold truncate text-base">{animal.name}</span>
          <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${isMale ? 'bg-blue-500 text-gray-900' : 'bg-pink-500 text-gray-900'}`}>
            {isMale ? '♂ Male' : '♀ Female'}
          </span>
        </div>
        <div className="text-gray-900/80 text-xs bg-white/10 px-2.5 py-1 rounded-full whitespace-nowrap border border-white/10 font-mono">
          {animal.tag_number ? `TAG: ${animal.tag_number}` : 'No Tag'}
        </div>
      </div>

      {/* Card Body */}
      <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
        {/* Live Age & Stage Highlight Row */}
        <div className="bg-blue-50/70 rounded-xl p-2.5 border border-blue-100 flex items-center justify-between">
          <div>
            <div className="text-[10px] text-blue-700 uppercase tracking-wider font-semibold">Live Age</div>
            <div className="text-sm font-extrabold text-blue-950">{liveAge}</div>
          </div>
          <div>
            {getStatusBadge(animal.status)}
          </div>
        </div>

        {/* Breed & Weight Row */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <div className="text-gray-400 uppercase tracking-wider font-medium">Breed</div>
            <div className="font-semibold text-gray-800 truncate">{animal.breed || 'Not specified'}</div>
          </div>
          <div>
            <div className="text-gray-400 uppercase tracking-wider font-medium">Father / Bull</div>
            <div className="font-semibold text-gray-800 truncate" title={animal.bull_name || 'N/A'}>{animal.bull_name || 'N/A'}</div>
          </div>
        </div>

        {/* Genealogy (Mother & Father) Info */}
        {(animal.dam_info || animal.bull_name) && (
          <div className="bg-gray-50 rounded-lg p-2 text-xs text-gray-600 border border-gray-100 space-y-1">
            {animal.dam_info && (
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Mother / Dam:</span>
                <span className="font-semibold text-gray-800">{animal.dam_info}</span>
              </div>
            )}
            {animal.bull_name && (
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Father / Bull:</span>
                <span className="font-semibold text-gray-800">{animal.bull_name}</span>
              </div>
            )}
          </div>
        )}

        {/* Notes if available */}
        {animal.notes && (
          <div className="text-xs text-gray-500 italic bg-gray-50 p-2 rounded border border-gray-100 truncate" title={animal.notes}>
            📝 {animal.notes}
          </div>
        )}

        {/* Action Buttons */}
        <div className="pt-2 border-t border-gray-100 flex items-center justify-between gap-2">
          {!isMale && (
            <Link
              href="/dashboard/insemination"
              className="flex-1 text-center py-1.5 px-3 bg-blue-50 hover:bg-blue-100 text-[var(--color-blue)] rounded-lg text-xs font-semibold transition-colors"
            >
              + Insemination
            </Link>
          )}

          <button
            onClick={() => onEdit(animal)}
            className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-gray-100 rounded-lg transition-colors"
            title="Edit Animal Details"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.379-8.379-2.828-2.828z" />
            </svg>
          </button>

          <button
            onClick={() => onDelete(animal.id, animal.name)}
            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Delete Animal"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
