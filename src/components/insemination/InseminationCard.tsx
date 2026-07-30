'use client'

import { InseminationRecord } from '@/lib/types'

interface InseminationCardProps {
  record: InseminationRecord
  onEdit: (record: InseminationRecord) => void
  onDelete: (id: string) => void
}

export default function InseminationCard({ record, onEdit, onDelete }: InseminationCardProps) {
  // Helpers
  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return 'N/A'
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return 'N/A'
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  // Pregnancy Days
  const aiDate = record.ai_date ? new Date(record.ai_date) : null
  const today = new Date()
  let pregnancyDaysDisplay = 'N/A'
  
  if (aiDate && !isNaN(aiDate.getTime())) {
    const diffMs = today.getTime() - aiDate.getTime()
    const totalDays = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)))
    const months = Math.floor(totalDays / 30)
    const days = totalDays % 30
    pregnancyDaysDisplay = `${months > 0 ? months + ' Mon ' : ''}${days} Days`
  }

  // Status Badge
  const getStatusBadge = (status: string | undefined | null) => {
    switch (status?.toLowerCase()) {
      case 'inseminated':
      case 'ai':
      case 'natural':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">⏳ Inseminated</span>
      case 'confirmed':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800 border border-green-200">🤰 Confirmed</span>
      case 'calved':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-teal-100 text-teal-800 border border-teal-200">🍼 Calved</span>
      case 'aborted':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">🚨 Aborted</span>
      case 'failed':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-200">❌ Failed</span>
      default:
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-800">{status || 'Unknown'}</span>
    }
  }

  // Est Calving Date
  let expectedCalvingDate = record.expected_calving_date ? new Date(record.expected_calving_date) : null
  if (!expectedCalvingDate && aiDate && !isNaN(aiDate.getTime())) {
    const isBuffalo = (record as any).animals?.species?.toLowerCase() === 'buffalo' || (record as any).animals?.type?.toLowerCase() === 'buffalo'
    const daysToAdd = isBuffalo ? 310 : 283
    expectedCalvingDate = new Date(aiDate.getTime() + daysToAdd * 24 * 60 * 60 * 1000)
  }

  // Calving Due / Days Since Calving Display
  const isCalved = record.pregnancy_status?.toLowerCase() === 'calved'
  let calvingDueDisplay = <span className="text-gray-400 font-semibold">N/A</span>

  if (isCalved) {
    const cDate = record.calving_date 
      ? new Date(record.calving_date) 
      : (expectedCalvingDate || aiDate)
    
    if (cDate && !isNaN(cDate.getTime())) {
      const diffMs = today.getTime() - cDate.getTime()
      const daysSince = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)))

      if (daysSince < 45) {
        calvingDueDisplay = <span className="text-teal-700 font-bold">🍼 {daysSince} Days In Milk (سُوئے کو {daysSince} دن)</span>
      } else if (daysSince <= 90) {
        calvingDueDisplay = <span className="text-emerald-700 font-bold animate-pulse">🎯 {daysSince} Days — Naye Teke ka Taim! (نئے ٹیکے کا ٹائم)</span>
      } else {
        calvingDueDisplay = <span className="text-orange-700 font-bold">⚠️ {daysSince} Days — Teka Lagwein (ٹیکا لگوائیں)</span>
      }
    }
  } else if (record.pregnancy_status?.toLowerCase() === 'failed' || record.pregnancy_status?.toLowerCase() === 'aborted') {
    calvingDueDisplay = <span className="text-gray-400 font-semibold">N/A</span>
  } else if (expectedCalvingDate && !isNaN(expectedCalvingDate.getTime())) {
    const diffDays = Math.ceil((expectedCalvingDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    if (diffDays >= 0) {
      calvingDueDisplay = <span className="text-teal-600 font-semibold">{diffDays} days remaining (بچہ دینے میں {diffDays} دن)</span>
    } else {
      calvingDueDisplay = <span className="text-red-600 font-semibold">Overdue by {Math.abs(diffDays)} days (ٹائم اوپر)</span>
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden flex flex-col">
      {/* Header Row */}
      <div className="bg-[#1a2f5e] px-4 py-3 flex justify-between items-center rounded-t-xl">
        <div className="text-white font-semibold truncate flex-1 pr-2">
          {(record as any).animals?.name || 'Unknown Animal'}
        </div>
        <div className="text-white/70 text-sm whitespace-nowrap">
          <span className="text-xs mr-1 uppercase">Tag:</span>
          {(record as any).animals?.tag_number || 'No Tag'}
        </div>
      </div>

      {/* Body */}
      <div className="p-4 space-y-3">
        {/* Row 1 */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">A.I. Date</div>
            <div className="text-sm font-semibold text-gray-800">{formatDate(record.ai_date)}</div>
          </div>
          <div>
            <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">Pregnancy Days</div>
            <div className="text-sm font-semibold text-gray-800">{pregnancyDaysDisplay}</div>
          </div>
        </div>

        {/* Row 2 */}
        <div className="grid grid-cols-2 gap-4 items-center">
          <div>
            <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">Pregnancy Status</div>
            <div className="mt-0.5">{getStatusBadge(record.pregnancy_status)}</div>
          </div>
          <div>
            <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">Est. Calving Date</div>
            <div className="text-sm font-semibold text-gray-800">
              {expectedCalvingDate && !isNaN(expectedCalvingDate.getTime()) 
                ? expectedCalvingDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) 
                : 'N/A'}
            </div>
          </div>
        </div>

        {/* Row 3 */}
        <div className="bg-teal-50/50 rounded-lg p-3 flex justify-between items-center border border-teal-100">
          <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold">
            {isCalved ? 'Days Since Calving' : 'Calving Due Days'}
          </span>
          <div className="text-xs sm:text-sm">{calvingDueDisplay}</div>
        </div>

        {/* Row 4 */}
        <div className="grid grid-cols-3 gap-2 border-t border-gray-100 pt-3">
          <div>
            <div className="text-[10px] text-gray-400 uppercase tracking-wider mb-0.5">Lactation No</div>
            <div className="text-xs font-semibold text-gray-800">{record.lactation_no ?? 'N/A'}</div>
          </div>
          <div>
            <div className="text-[10px] text-gray-400 uppercase tracking-wider mb-0.5">Semen Company</div>
            <div className="text-xs font-semibold text-gray-800 truncate" title={record.semen_company || ''}>
              {record.semen_company || 'N/A'}
            </div>
          </div>
          <div>
            <div className="text-[10px] text-gray-400 uppercase tracking-wider mb-0.5">Bull Name</div>
            <div className="text-xs font-semibold text-gray-800 truncate" title={record.bull_name || ''}>
              {record.bull_name || 'N/A'}
            </div>
          </div>
        </div>

        {/* Optional Notes Row */}
        {record.notes && (
          <div className="bg-gray-50 border border-gray-100 rounded-lg p-2.5 text-xs text-gray-600 flex items-start space-x-1.5">
            <span className="text-sm">📝</span>
            <span className="flex-1 italic leading-relaxed text-gray-700 font-medium">{record.notes}</span>
          </div>
        )}

        {/* Row 5 */}
        <div className="flex justify-end space-x-2 pt-2">
          <button 
            onClick={() => onEdit(record)}
            className="flex items-center space-x-1 px-3 py-1.5 text-teal-600 border border-teal-600 rounded-md hover:bg-teal-50 transition-colors text-sm font-medium"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.379-8.379-2.828-2.828z" />
            </svg>
            <span>Edit</span>
          </button>
          <button 
            onClick={() => onDelete(record.id)}
            className="flex items-center space-x-1 px-3 py-1.5 text-red-600 border border-red-600 rounded-md hover:bg-red-50 transition-colors text-sm font-medium"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span>Delete</span>
          </button>
        </div>
      </div>
    </div>
  )
}
