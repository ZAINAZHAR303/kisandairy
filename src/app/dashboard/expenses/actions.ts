'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { ExpenseCategory } from '@/lib/types'

export async function getExpenses() {
  const supabase = await createClient()
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { data: null, error: 'Unauthorized' }

    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false })

    if (error) return { data: null, error: error.message }
    return { data, error: null }
  } catch (err: any) {
    return { data: null, error: err.message || 'An unexpected error occurred' }
  }
}

export async function addExpense(formData: FormData) {
  const supabase = await createClient()
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { data: null, error: 'Unauthorized' }

    const date = formData.get('date') as string
    const category = formData.get('category') as ExpenseCategory
    const description = formData.get('description') as string | null
    const amount = formData.get('amount') ? Number(formData.get('amount')) : 0

    if (!date) return { data: null, error: 'Date is required' }
    if (!category) return { data: null, error: 'Category is required' }
    if (isNaN(amount) || amount <= 0) return { data: null, error: 'Please enter a valid amount' }

    const { data, error } = await supabase
      .from('expenses')
      .insert({
        date,
        category,
        description: description?.trim() || null,
        amount,
        user_id: user.id
      })
      .select()
      .single()

    if (error) return { data: null, error: error.message }

    revalidatePath('/dashboard/expenses')
    revalidatePath('/dashboard')

    return { data, error: null }
  } catch (err: any) {
    return { data: null, error: err.message || 'An unexpected error occurred' }
  }
}

export async function updateExpense(formData: FormData) {
  const supabase = await createClient()
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { data: null, error: 'Unauthorized' }

    const id = formData.get('id') as string
    const date = formData.get('date') as string
    const category = formData.get('category') as ExpenseCategory
    const description = formData.get('description') as string | null
    const amount = formData.get('amount') ? Number(formData.get('amount')) : 0

    if (!id) return { data: null, error: 'Expense ID is required' }
    if (!date) return { data: null, error: 'Date is required' }
    if (!category) return { data: null, error: 'Category is required' }
    if (isNaN(amount) || amount <= 0) return { data: null, error: 'Please enter a valid amount' }

    const { data, error } = await supabase
      .from('expenses')
      .update({
        date,
        category,
        description: description?.trim() || null,
        amount,
      })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) return { data: null, error: error.message }

    revalidatePath('/dashboard/expenses')
    revalidatePath('/dashboard')

    return { data, error: null }
  } catch (err: any) {
    return { data: null, error: err.message || 'An unexpected error occurred' }
  }
}

export async function deleteExpense(id: string) {
  const supabase = await createClient()
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) return { error: error.message }

    revalidatePath('/dashboard/expenses')
    revalidatePath('/dashboard')

    return { error: null }
  } catch (err: any) {
    return { error: err.message || 'An unexpected error occurred' }
  }
}
