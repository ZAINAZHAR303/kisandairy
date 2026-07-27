'use client'

import React from 'react'

interface LoaderProps {
  text?: string
  fullScreen?: boolean
}

export default function Loader({ text = 'Loading Kisan Dairy...', fullScreen = false }: LoaderProps) {
  const content = (
    <div className="flex flex-col items-center justify-center p-6 space-y-4 animate-fade-in">
      <div className="relative flex items-center justify-center">
        {/* Pulsing Outer Ring */}
        <div className="w-16 h-16 rounded-full border-4 border-[#00BFA6]/20 border-t-[#00BFA6] animate-spin" />
        
        {/* Centered Official Logo */}
        <div className="absolute inset-0 flex items-center justify-center p-2">
          <img src="/logo.png" alt="Kisan Dairy" className="w-8 h-8 object-contain animate-pulse" />
        </div>
      </div>

      {text && (
        <p className="text-sm font-semibold text-gray-700 tracking-wide animate-pulse">
          {text}
        </p>
      )}
    </div>
  )

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-[100] bg-[#f0f2f5]/90 backdrop-blur-sm flex items-center justify-center min-h-screen">
        {content}
      </div>
    )
  }

  return content
}
