'use client'

import React, { useState } from 'react'

export const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
export const MONTH_NAMES_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

interface MonthPickerProps {
  selectedMonth: number // 0-11
  selectedYear: number
  onChange: (month: number, year: number) => void
}

export default function MonthPicker({ selectedMonth, selectedYear, onChange }: MonthPickerProps) {
  const [showPicker, setShowPicker] = useState(false)
  
  const now = new Date()
  const isCurrentMonth = selectedMonth === now.getMonth() && selectedYear === now.getFullYear()

  const goToPrevMonth = () => {
    if (selectedMonth === 0) {
      onChange(11, selectedYear - 1)
    } else {
      onChange(selectedMonth - 1, selectedYear)
    }
  }

  const goToNextMonth = () => {
    if (selectedMonth === 11) {
      onChange(0, selectedYear + 1)
    } else {
      onChange(selectedMonth + 1, selectedYear)
    }
  }

  const goToCurrentMonth = () => {
    onChange(now.getMonth(), now.getFullYear())
  }

  return (
    <div className="relative">
      <div className="flex items-center justify-between bg-gray-50 rounded-2xl px-4 py-3 border border-gray-100">
        {/* Left arrow */}
        <button
          onClick={goToPrevMonth}
          className="p-2 hover:bg-white rounded-xl transition-colors border border-transparent hover:border-gray-200"
          title="Previous Month"
        >
          <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Center: Month/Year display — clickable to open month grid */}
        <button
          onClick={() => setShowPicker(!showPicker)}
          className="flex items-center space-x-2 px-4 py-1.5 rounded-xl hover:bg-white transition-colors border border-transparent hover:border-gray-200"
        >
          <span className="text-lg">📅</span>
          <span className="text-sm font-extrabold text-gray-900">
            {MONTH_NAMES[selectedMonth]} {selectedYear}
          </span>
          <svg className={`w-3.5 h-3.5 text-gray-400 transition-transform ${showPicker ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Right arrow */}
        <div className="flex items-center space-x-2">
          {!isCurrentMonth && (
            <button
              onClick={goToCurrentMonth}
              className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 hover:bg-emerald-100 transition-colors"
            >
              Today
            </button>
          )}
          <button
            onClick={goToNextMonth}
            className="p-2 hover:bg-white rounded-xl transition-colors border border-transparent hover:border-gray-200"
            title="Next Month"
          >
            <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Month Grid Popup */}
      {showPicker && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-lg border border-gray-200 p-4 z-50 animate-fade-in">
          {/* Year Selector */}
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={() => onChange(selectedMonth, selectedYear - 1)}
              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <span className="text-sm font-extrabold text-gray-900">{selectedYear}</span>
            <button
              onClick={() => onChange(selectedMonth, selectedYear + 1)}
              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Month Grid */}
          <div className="grid grid-cols-3 gap-2">
            {MONTH_NAMES_SHORT.map((name, idx) => {
              const isSelected = idx === selectedMonth
              const isCurrent = idx === now.getMonth() && selectedYear === now.getFullYear()
              return (
                <button
                  key={name}
                  onClick={() => {
                    onChange(idx, selectedYear)
                    setShowPicker(false)
                  }}
                  className={`px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    isSelected
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : isCurrent
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-transparent'
                  }`}
                >
                  {name}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
