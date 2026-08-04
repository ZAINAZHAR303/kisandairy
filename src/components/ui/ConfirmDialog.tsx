'use client'

import { useState, useEffect, useRef } from 'react'

interface ConfirmDialogProps {
  isOpen: boolean
  title: string
  message: string
  subtitle?: string
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'warning' | 'info'
  onConfirm: () => void | Promise<void>
  onCancel: () => void
}

const VARIANT_CONFIG = {
  danger: {
    icon: '🗑️',
    confirmBg: 'bg-red-600 hover:bg-red-700 focus-visible:ring-red-500',
    iconBg: 'bg-red-100',
    border: 'border-red-200',
  },
  warning: {
    icon: '⚠️',
    confirmBg: 'bg-amber-600 hover:bg-amber-700 focus-visible:ring-amber-500',
    iconBg: 'bg-amber-100',
    border: 'border-amber-200',
  },
  info: {
    icon: 'ℹ️',
    confirmBg: 'bg-blue-600 hover:bg-blue-700 focus-visible:ring-blue-500',
    iconBg: 'bg-blue-100',
    border: 'border-blue-200',
  },
}

export default function ConfirmDialog({
  isOpen,
  title,
  message,
  subtitle,
  confirmText = 'Delete',
  cancelText = 'Cancel',
  variant = 'danger',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const cancelRef = useRef<HTMLButtonElement>(null)
  const config = VARIANT_CONFIG[variant]

  useEffect(() => {
    if (isOpen) {
      // Focus the cancel button for safety
      setTimeout(() => cancelRef.current?.focus(), 100)
    }
  }, [isOpen])

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel()
    }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [isOpen, onCancel])

  const handleConfirm = async () => {
    setIsLoading(true)
    try {
      await onConfirm()
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[200] animate-fade-in"
        onClick={onCancel}
      />

      {/* Dialog */}
      <div
        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[200] w-[calc(100%-2rem)] max-w-sm"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        aria-describedby="confirm-message"
      >
        <div className={`bg-white rounded-2xl shadow-2xl border ${config.border} overflow-hidden`}
          style={{ animation: 'confirmBounceIn 0.3s ease-out' }}
        >
          {/* Content */}
          <div className="p-5 text-center">
            <div className={`w-14 h-14 rounded-full ${config.iconBg} flex items-center justify-center mx-auto mb-3`}>
              <span className="text-2xl">{config.icon}</span>
            </div>
            <h3 id="confirm-title" className="text-lg font-bold text-gray-900">
              {title}
            </h3>
            <p id="confirm-message" className="text-sm text-gray-600 mt-1.5 leading-relaxed">
              {message}
            </p>
            {subtitle && (
              <p className="text-xs text-gray-400 mt-1">{subtitle}</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex border-t border-gray-100">
            <button
              ref={cancelRef}
              onClick={onCancel}
              disabled={isLoading}
              className="flex-1 py-3.5 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-gray-400"
            >
              {cancelText}
            </button>
            <div className="w-px bg-gray-100" />
            <button
              onClick={handleConfirm}
              disabled={isLoading}
              className={`flex-1 py-3.5 text-sm font-bold text-white transition-all focus-visible:ring-2 focus-visible:ring-inset ${config.confirmBg} disabled:opacity-60`}
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Deleting...
                </span>
              ) : confirmText}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
