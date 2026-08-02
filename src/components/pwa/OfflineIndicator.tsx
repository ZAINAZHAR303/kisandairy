'use client'

import { useState, useEffect, useCallback } from 'react'

export default function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(true)
  const [showToast, setShowToast] = useState(false)
  const [pendingCount, setPendingCount] = useState(0)

  const checkPendingRecords = useCallback(async () => {
    try {
      const { getPendingCount } = await import('@/lib/offlineDb')
      const count = await getPendingCount()
      setPendingCount(count)
    } catch {
      setPendingCount(0)
    }
  }, [])

  useEffect(() => {
    setIsOnline(navigator.onLine)

    const handleOnline = () => {
      setIsOnline(true)
      setShowToast(true)
      setTimeout(() => setShowToast(false), 4000)
      // Trigger sync when back online
      import('@/lib/syncManager').then(({ syncAllPendingRecords }) => {
        syncAllPendingRecords().then(() => checkPendingRecords())
      })
    }

    const handleOffline = () => {
      setIsOnline(false)
      setShowToast(true)
      setTimeout(() => setShowToast(false), 5000)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Check pending records on mount
    checkPendingRecords()

    // Listen for custom sync events
    const handleSyncUpdate = () => checkPendingRecords()
    window.addEventListener('offlineSync', handleSyncUpdate)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener('offlineSync', handleSyncUpdate)
    }
  }, [checkPendingRecords])

  return (
    <>
      {/* Status Dot in Navbar */}
      <div className="flex items-center gap-1.5" title={isOnline ? 'Online' : 'Offline — changes saved locally'}>
        <span
          className={`inline-block w-2 h-2 rounded-full transition-colors ${
            isOnline ? 'bg-emerald-400 shadow-[0_0_6px_rgba(16,185,129,0.6)]' : 'bg-amber-400 shadow-[0_0_6px_rgba(245,158,11,0.6)] animate-pulse'
          }`}
        />
        {!isOnline && (
          <span className="text-amber-300 text-[10px] font-medium hidden sm:inline">Offline</span>
        )}
        {pendingCount > 0 && (
          <span className="bg-amber-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full leading-none">
            {pendingCount}
          </span>
        )}
      </div>

      {/* Toast Notification */}
      {showToast && (
        <div
          className={`fixed top-4 left-1/2 -translate-x-1/2 z-[9999] px-5 py-3 rounded-xl shadow-2xl text-sm font-semibold flex items-center gap-2 animate-[slideDown_0.3s_ease-out] ${
            isOnline
              ? 'bg-emerald-600 text-white'
              : 'bg-amber-500 text-white'
          }`}
        >
          <span className="text-lg">{isOnline ? '🟢' : '🟡'}</span>
          <div>
            <p>{isOnline ? 'Back Online — syncing data...' : 'You are offline'}</p>
            <p className="text-[10px] opacity-80 font-normal">
              {isOnline ? 'واپس آن لائن — ڈیٹا بھیجا جا رہا ہے' : 'آف لائن — تبدیلیاں مقامی طور پر محفوظ ہیں'}
            </p>
          </div>
          <button onClick={() => setShowToast(false)} className="ml-2 text-white/70 hover:text-white">✕</button>
        </div>
      )}
    </>
  )
}
