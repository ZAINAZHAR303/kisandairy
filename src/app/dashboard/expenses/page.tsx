import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { fetchAllRows } from '@/lib/supabase/fetchAll'
import ExpensesList from '@/components/expenses/ExpensesList'
import { Expense, MilkSaleEntry } from '@/lib/types'

export const metadata: Metadata = {
  title: 'Expense Tracker | Kisan Dairy',
}

export default async function ExpensesPage() {
  const supabase = await createClient()

  const [expenses, milkEntries] = await Promise.all([
    fetchAllRows<Expense>('expenses', (from, to) =>
      supabase
        .from('expenses')
        .select('*', { count: 'exact' })
        .order('date', { ascending: false })
        .order('id')
        .range(from, to)
    ),
    // Milk sale entries for profit calculation
    fetchAllRows<MilkSaleEntry>('milk sales', (from, to) =>
      supabase
        .from('milk_sale_entries')
        .select('date, total_amount', { count: 'exact' })
        .order('date', { ascending: false })
        .order('id')
        .range(from, to)
    ),
  ])

  return (
    <ExpensesList
      initialExpenses={expenses}
      milkEntries={milkEntries}
    />
  )
}
