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

/**
 * Sync all pending offline records to Supabase.
 * Called automatically when the app comes back online.
 */
export async function syncAllPendingRecords(): Promise<{
  synced: number
  failed: number
}> {
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
