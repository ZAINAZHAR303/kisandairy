'use client'

import { useState, useEffect, useCallback, createContext, useContext } from 'react'

// Toast types
type ToastType = 'success' | 'error' | 'warning' | 'info' | 'offline'

interface ToastData {
  id: string
  type: ToastType
  message: string
  subtitle?: string
  duration?: number
}

interface ToastContextType {
  showToast: (type: ToastType, message: string, subtitle?: string, duration?: number) => void
}

const ToastContext = createContext<ToastContextType | null>(null)

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside ToastProvider')
  return ctx
}

// Icon configs per type
const TOAST_CONFIG: Record<ToastType, { icon: string; bg: string; border: string; text: string }> = {
  success: {
    icon: '✅',
    bg: 'bg-emerald-50',
    border: 'border-emerald-400',
    text: 'text-emerald-800',
  },
  error: {
    icon: '❌',
    bg: 'bg-red-50',
    border: 'border-red-400',
    text: 'text-red-800',
  },
  warning: {
    icon: '⚠️',
    bg: 'bg-amber-50',
    border: 'border-amber-400',
    text: 'text-amber-800',
  },
  info: {
    icon: 'ℹ️',
    bg: 'bg-blue-50',
    border: 'border-blue-400',
    text: 'text-blue-800',
  },
  offline: {
    icon: '📱',
    bg: 'bg-gradient-to-r from-emerald-50 to-blue-50',
    border: 'border-blue-400',
    text: 'text-blue-800',
  },
}

function ToastItem({ toast, onRemove }: { toast: ToastData; onRemove: (id: string) => void }) {
  const [isExiting, setIsExiting] = useState(false)
  const config = TOAST_CONFIG[toast.type]

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsExiting(true)
      setTimeout(() => onRemove(toast.id), 300)
    }, toast.duration || 4000)
    return () => clearTimeout(timer)
  }, [toast.id, toast.duration, onRemove])

  const handleDismiss = () => {
    setIsExiting(true)
    setTimeout(() => onRemove(toast.id), 300)
  }

  return (
    <div
      className={`w-full max-w-sm mx-auto px-4 py-3 rounded-xl border shadow-lg backdrop-blur-sm flex items-start gap-3 transition-all duration-300 ${config.bg} ${config.border} ${
        isExiting ? 'opacity-0 translate-y-[-20px] scale-95' : 'opacity-100 translate-y-0 scale-100'
      }`}
      style={{ animation: isExiting ? 'none' : 'toastSlideIn 0.35s ease-out' }}
      role="alert"
    >
      <span className="text-lg flex-shrink-0 mt-0.5">{config.icon}</span>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold ${config.text}`}>{toast.message}</p>
        {toast.subtitle && (
          <p className={`text-xs mt-0.5 ${config.text} opacity-75`}>{toast.subtitle}</p>
        )}
      </div>
      <button
        onClick={handleDismiss}
        className={`flex-shrink-0 ${config.text} opacity-50 hover:opacity-100 transition-opacity text-lg leading-none`}
        aria-label="Dismiss notification"
      >
        ×
      </button>
    </div>
  )
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastData[]>([])

  const showToast = useCallback((type: ToastType, message: string, subtitle?: string, duration?: number) => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
    setToasts(prev => [...prev.slice(-4), { id, type, message, subtitle, duration }])
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Toast Container */}
      <div className="fixed top-3 left-0 right-0 z-[9999] flex flex-col items-center gap-2 pointer-events-none">
        {toasts.map(toast => (
          <div key={toast.id} className="pointer-events-auto">
            <ToastItem toast={toast} onRemove={removeToast} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
