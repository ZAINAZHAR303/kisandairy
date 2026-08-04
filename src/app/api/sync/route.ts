import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { addMilkSaleEntry, addSellerPayment } from '@/app/dashboard/milk-sales/actions'
import { addExpense } from '@/app/dashboard/expenses/actions'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { milkSales = [], payments = [], expenses = [] } = body

    let synced = 0
    let failed = 0

    // Sync Milk Sales
    for (const sale of milkSales) {
      try {
        const formData = new FormData()
        formData.append('seller_id', sale.seller_id)
        formData.append('date', sale.date)
        formData.append('morning_liters', String(sale.morning_liters))
        formData.append('evening_liters', String(sale.evening_liters))
        formData.append('rate_per_liter', String(sale.rate_per_liter))
        if (sale.notes) formData.append('notes', sale.notes)

        const result = await addMilkSaleEntry(formData)
        if (result && !result.error) {
          synced++
        } else {
          failed++
          console.error('[Sync API] Milk Sale error:', result?.error)
        }
      } catch (err) {
        failed++
        console.error('[Sync API] Milk Sale catch error:', err)
      }
    }

    // Sync Payments
    for (const payment of payments) {
      try {
        const formData = new FormData()
        formData.append('seller_id', payment.seller_id)
        formData.append('date', payment.date)
        formData.append('amount_paid', String(payment.amount_paid))
        if (payment.notes) formData.append('notes', payment.notes)

        const result = await addSellerPayment(formData)
        if (result && !result.error) {
          synced++
        } else {
          failed++
          console.error('[Sync API] Payment error:', result?.error)
        }
      } catch (err) {
        failed++
        console.error('[Sync API] Payment catch error:', err)
      }
    }

    // Sync Expenses
    for (const expense of expenses) {
      try {
        const formData = new FormData()
        formData.append('category', expense.category)
        formData.append('amount', String(expense.amount))
        formData.append('date', expense.date)
        formData.append('description', expense.description)

        const result = await addExpense(formData)
        if (result && !result.error) {
          synced++
        } else {
          failed++
          console.error('[Sync API] Expense error:', result?.error)
        }
      } catch (err) {
        failed++
        console.error('[Sync API] Expense catch error:', err)
      }
    }

    return NextResponse.json({ success: true, synced, failed })
  } catch (error: any) {
    console.error('[Sync API] Server error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
