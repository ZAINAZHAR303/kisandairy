import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { fetchAllRows } from '@/lib/supabase/fetchAll'
import FinancialsList from '@/components/reports/FinancialsList'
import { MilkSaleEntry, Expense } from '@/lib/types'

export const metadata: Metadata = {
  title: 'Monthly Financial Reports | Kisan Dairy',
}

export default async function FinancialsPage() {
  const supabase = await createClient()

  const [milkEntries, expenses] = await Promise.all([
    fetchAllRows<MilkSaleEntry>('milk sales', (from, to) =>
      supabase
        .from('milk_sale_entries')
        .select('date, total_liters, total_amount', { count: 'exact' })
        .order('date', { ascending: false })
        .order('id')
        .range(from, to)
    ),
    fetchAllRows<Expense>('expenses', (from, to) =>
      supabase
        .from('expenses')
        .select('date, amount', { count: 'exact' })
        .order('date', { ascending: false })
        .order('id')
        .range(from, to)
    ),
  ])

  return (
    <FinancialsList
      milkEntries={milkEntries}
      expenses={expenses}
    />
  )
}
