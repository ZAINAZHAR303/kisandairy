import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import ExpensesList from '@/components/expenses/ExpensesList'
import { Expense, MilkSaleEntry } from '@/lib/types'

export const metadata: Metadata = {
  title: 'Expense Tracker | Kisan Dairy',
}

export default async function ExpensesPage() {
  const supabase = await createClient()

  // Fetch expenses
  const { data: expenses } = await supabase
    .from('expenses')
    .select('*')
    .order('date', { ascending: false })

  // Fetch milk sale entries for profit calculation
  const { data: milkEntries } = await supabase
    .from('milk_sale_entries')
    .select('date, total_amount')

  return (
    <ExpensesList
      initialExpenses={(expenses as Expense[]) || []}
      milkEntries={(milkEntries as MilkSaleEntry[]) || []}
    />
  )
}
