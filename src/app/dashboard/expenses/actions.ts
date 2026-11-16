'use server'

import { revalidatePath } from 'next/cache'
import { Expense } from '@/lib/types'
import { dataAction, statusAction, fail, FormReader } from '@/lib/actions'

// Returns the validated fields, or a message describing what is wrong.
function readExpenseFields(form: FormReader) {
  const date = form.raw('date')
  const category = form.raw('category')
  const amount = form.number('amount')

  if (!date) return { error: 'Date is required' } as const
  if (!category) return { error: 'Category is required' } as const
  if (amount <= 0) return { error: 'Please enter a valid amount' } as const

  return {
    error: null,
    fields: {
      date,
      category,
      description: form.optionalText('description'),
      amount,
    },
  } as const
}

export async function addExpense(formData: FormData) {
  return dataAction<Expense>(async ({ supabase, user }) => {
    const parsed = readExpenseFields(new FormReader(formData))
    if (parsed.error !== null) return fail(parsed.error)

    const { data, error } = await supabase
      .from('expenses')
      .insert({ ...parsed.fields, user_id: user.id })
      .select()
      .single()

    if (error) return fail(error.message)

    revalidatePath('/dashboard/expenses')
    revalidatePath('/dashboard')

    return { data, error: null }
  })
}

export async function updateExpense(formData: FormData) {
  return dataAction<Expense>(async ({ supabase, user }) => {
    const form = new FormReader(formData)
    const id = form.raw('id')
    if (!id) return fail('Expense ID is required')

    const parsed = readExpenseFields(form)
    if (parsed.error !== null) return fail(parsed.error)

    const { data, error } = await supabase
      .from('expenses')
      .update(parsed.fields)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) return fail(error.message)

    revalidatePath('/dashboard/expenses')
    revalidatePath('/dashboard')

    return { data, error: null }
  })
}

export async function deleteExpense(id: string) {
  return statusAction(async ({ supabase, user }) => {
    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) return { error: error.message }

    revalidatePath('/dashboard/expenses')
    revalidatePath('/dashboard')

    return { error: null }
  })
}
