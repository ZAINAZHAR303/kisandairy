'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/Toast'

export default function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(true)
  const { showToast } = useToast()
  const router = useRouter()
  const [pendingCount, setPendingCount] = useState(0)

  const checkPendingRecords = useCallback(async (): Promise<number> => {
    try {
      const { getPendingCount } = await import('@/lib/offlineDb')
      const count = await getPendingCount()
      setPendingCount(count)
      return count
    } catch {
      setPendingCount(0)
      return 0
    }
  }, [])

  // Sends queued offline records to the server and reports the outcome.
  const syncPending = useCallback(async () => {
    try {
      const { syncAllPendingRecords } = await import('@/lib/syncManager')
      const { synced, failed } = await syncAllPendingRecords()
      if (synced > 0) {
        showToast('success', `Synced ${synced} offline record${synced > 1 ? 's' : ''}`, 'آف لائن ریکارڈ محفوظ ہو گئے')
        router.refresh()
      }
      if (failed > 0) {
        showToast(
          'warning',
          `${failed} offline record${failed > 1 ? 's' : ''} not synced yet`,
          'کچھ ریکارڈ ابھی نہیں بھیجے جا سکے — آپ کے فون میں محفوظ ہیں'
        )
      }
    } catch (err) {
      console.error('[OfflineIndicator] Sync failed:', err)
    } finally {
      await checkPendingRecords()
    }
  }, [checkPendingRecords, router, showToast])

  useEffect(() => {
    setIsOnline(navigator.onLine)

    const handleOnline = () => {
      setIsOnline(true)
      showToast('success', 'Back Online — syncing data...', 'واپس آن لائن — ڈیٹا بھیجا جا رہا ہے')
      // Trigger sync when back online
      syncPending()
    }

    const handleOffline = () => {
      setIsOnline(false)
      showToast('offline', 'You are offline', 'آف لائن — تبدیلیاں مقامی طور پر محفوظ ہیں')
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // On mount: if records were saved offline in an earlier session and we are
    // online now, sync them. The 'online' event never fires in that case.
    checkPendingRecords().then((count) => {
      if (count > 0 && navigator.onLine) syncPending()
    })

    // Listen for custom sync events
    const handleSyncUpdate = () => checkPendingRecords()
    window.addEventListener('offlineSync', handleSyncUpdate)

    // Listen for Background Sync messages from Service Worker
    const handleSWMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'SYNC_COMPLETE') {
        if (event.data.synced === undefined || event.data.synced > 0) {
          showToast('success', 'Background Sync Complete', 'بیک گراؤنڈ میں ڈیٹا بھیج دیا گیا')
          router.refresh()
        }
        checkPendingRecords()
      }
    }
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', handleSWMessage)
    }

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener('offlineSync', handleSyncUpdate)
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.removeEventListener('message', handleSWMessage)
      }
    }
  }, [checkPendingRecords, syncPending, router, showToast])

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
    </>
  )
}
