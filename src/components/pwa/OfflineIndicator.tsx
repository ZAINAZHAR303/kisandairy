'use client'

import { useState, useEffect, useCallback } from 'react'
import { useToast } from '@/components/ui/Toast'

export default function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(true)
  const { showToast } = useToast()
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
      showToast('success', 'Back Online — syncing data...', 'واپس آن لائن — ڈیٹا بھیجا جا رہا ہے')
      // Trigger sync when back online
      import('@/lib/syncManager').then(({ syncAllPendingRecords }) => {
        syncAllPendingRecords().then(() => checkPendingRecords())
      })
    }

    const handleOffline = () => {
      setIsOnline(false)
      showToast('offline', 'You are offline', 'آف لائن — تبدیلیاں مقامی طور پر محفوظ ہیں')
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

      </div>
    </>
  )
}
