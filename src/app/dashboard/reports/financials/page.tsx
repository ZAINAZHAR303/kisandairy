import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import FinancialsList from '@/components/reports/FinancialsList'
import { MilkSaleEntry, Expense } from '@/lib/types'

export const metadata: Metadata = {
  title: 'Monthly Financial Reports | Kisan Dairy',
}

export default async function FinancialsPage() {
  const supabase = await createClient()

  // Fetch milk sale entries
  const { data: milkEntries } = await supabase
    .from('milk_sale_entries')
    .select('date, total_liters, total_amount')

  // Fetch expenses
  const { data: expenses } = await supabase
    .from('expenses')
    .select('date, amount')

  return (
    <FinancialsList
      milkEntries={(milkEntries as MilkSaleEntry[]) || []}
      expenses={(expenses as Expense[]) || []}
    />
  )
}
