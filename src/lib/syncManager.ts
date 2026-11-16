import {
  getPendingMilkSales,
  getPendingPayments,
  getPendingExpenses,
  removePendingMilkSale,
  removePendingPayment,
  removePendingExpense,
} from './offlineDb'
import {
  addMilkSaleEntry,
  addSellerPayment,
} from '@/app/dashboard/milk-sales/actions'
import { addExpense } from '@/app/dashboard/expenses/actions'

// Must match SYNC_LOCK_NAME in public/sw.js. The page and the service worker
// both sync the same queue; this lock stops them from sending the same record
// at the same time (which would create duplicate sales or payments).
const SYNC_LOCK_NAME = 'kisan-dairy-offline-sync'

type SyncResult = { synced: number; failed: number }

let inFlightSync: Promise<SyncResult> | null = null

/**
 * Sync all pending offline records to Supabase.
 * Called when the app opens with queued records and when it comes back online.
 * Safe to call repeatedly: overlapping calls share one run.
 */
export function syncAllPendingRecords(): Promise<SyncResult> {
  if (inFlightSync) return inFlightSync

  const run = async (): Promise<SyncResult> => {
    if (typeof navigator !== 'undefined' && navigator.locks) {
      return navigator.locks.request(SYNC_LOCK_NAME, () => syncPendingRecordsUnlocked())
    }
    return syncPendingRecordsUnlocked()
  }

  inFlightSync = run().finally(() => {
    inFlightSync = null
  })
  return inFlightSync
}

// The queue is read only after the lock is held, so records the service
// worker has already synced (and removed) are not sent again.
async function syncPendingRecordsUnlocked(): Promise<SyncResult> {
  let synced = 0
  let failed = 0

  // 1. Sync pending milk sales
  try {
    const pendingSales = await getPendingMilkSales()
    for (const sale of pendingSales) {
      try {
        const formData = new FormData()
        formData.append('seller_id', sale.seller_id)
        formData.append('date', sale.date)
        formData.append('morning_liters', String(sale.morning_liters))
        formData.append('evening_liters', String(sale.evening_liters))
        formData.append('rate_per_liter', String(sale.rate_per_liter))
        if (sale.notes) formData.append('notes', sale.notes)

        const result = await addMilkSaleEntry(formData)
        if (result && !('error' in result && result.error)) {
          await removePendingMilkSale(sale.id)
          synced++
        } else {
          failed++
        }
      } catch {
        failed++
      }
    }
  } catch {
    // IndexedDB read failed
  }

  // 2. Sync pending payments
  try {
    const pendingPayments = await getPendingPayments()
    for (const payment of pendingPayments) {
      try {
        const formData = new FormData()
        formData.append('seller_id', payment.seller_id)
        formData.append('date', payment.date)
        formData.append('amount_paid', String(payment.amount_paid))
        if (payment.notes) formData.append('notes', payment.notes)

        const result = await addSellerPayment(formData)
        if (result && !('error' in result && result.error)) {
          await removePendingPayment(payment.id)
          synced++
        } else {
          failed++
        }
      } catch {
        failed++
      }
    }
  } catch {
    // IndexedDB read failed
  }

  // 3. Sync pending expenses
  try {
    const pendingExpenses = await getPendingExpenses()
    for (const expense of pendingExpenses) {
      try {
        const formData = new FormData()
        formData.append('category', expense.category)
        formData.append('amount', String(expense.amount))
        formData.append('date', expense.date)
        formData.append('description', expense.description)

        const result = await addExpense(formData)
        if (result && !('error' in result && result.error)) {
          await removePendingExpense(expense.id)
          synced++
        } else {
          failed++
        }
      } catch {
        failed++
      }
    }
  } catch {
    // IndexedDB read failed
  }

  // Dispatch event so OfflineIndicator updates pending count
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('offlineSync'))
  }

  if (synced > 0) {
    console.log(`[Sync] ✅ Synced ${synced} records, ${failed} failed`)
  }

  return { synced, failed }
}
