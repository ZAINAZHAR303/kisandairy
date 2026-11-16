import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { addMilkSaleEntry, addSellerPayment } from '@/app/dashboard/milk-sales/actions'
import { addExpense } from '@/app/dashboard/expenses/actions'

type ActionResult = { error?: unknown } | undefined | null

interface PendingRecord {
  id?: unknown
  [key: string]: unknown
}

/**
 * Saves each record with the given action and returns the offline ids of the
 * ones that were stored. The service worker deletes ONLY those ids from the
 * device, so a record that failed stays queued instead of being lost.
 */
async function syncRecords(
  label: string,
  records: unknown,
  toFormData: (record: PendingRecord) => FormData,
  save: (formData: FormData) => Promise<ActionResult>
): Promise<{ syncedIds: string[]; failed: number }> {
  const syncedIds: string[] = []
  let failed = 0

  if (!Array.isArray(records)) return { syncedIds, failed }

  for (const record of records as PendingRecord[]) {
    try {
      const result = await save(toFormData(record))
      if (result && !result.error && typeof record?.id === 'string') {
        syncedIds.push(record.id)
      } else {
        failed++
        console.error(`[Sync API] ${label} error:`, result?.error)
      }
    } catch (err) {
      failed++
      console.error(`[Sync API] ${label} catch error:`, err)
    }
  }

  return { syncedIds, failed }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { milkSales = [], payments = [], expenses = [] } = body ?? {}

    const milkResult = await syncRecords('Milk Sale', milkSales, (sale) => {
      const formData = new FormData()
      formData.append('seller_id', String(sale.seller_id ?? ''))
      formData.append('date', String(sale.date ?? ''))
      formData.append('morning_liters', String(sale.morning_liters))
      formData.append('evening_liters', String(sale.evening_liters))
      formData.append('rate_per_liter', String(sale.rate_per_liter))
      if (sale.notes) formData.append('notes', String(sale.notes))
      return formData
    }, addMilkSaleEntry)

    const paymentResult = await syncRecords('Payment', payments, (payment) => {
      const formData = new FormData()
      formData.append('seller_id', String(payment.seller_id ?? ''))
      formData.append('date', String(payment.date ?? ''))
      formData.append('amount_paid', String(payment.amount_paid))
      if (payment.notes) formData.append('notes', String(payment.notes))
      return formData
    }, addSellerPayment)

    const expenseResult = await syncRecords('Expense', expenses, (expense) => {
      const formData = new FormData()
      formData.append('category', String(expense.category ?? ''))
      formData.append('amount', String(expense.amount))
      formData.append('date', String(expense.date ?? ''))
      formData.append('description', String(expense.description ?? ''))
      return formData
    }, addExpense)

    const syncedIds = {
      milkSales: milkResult.syncedIds,
      payments: paymentResult.syncedIds,
      expenses: expenseResult.syncedIds,
    }
    const synced = syncedIds.milkSales.length + syncedIds.payments.length + syncedIds.expenses.length
    const failed = milkResult.failed + paymentResult.failed + expenseResult.failed

    return NextResponse.json({ success: true, synced, failed, syncedIds })
  } catch (error) {
    console.error('[Sync API] Server error:', error)
    const message = error instanceof Error ? error.message : 'Sync failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
