'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getSellers() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { data: null, error: new Error('Unauthorized') }
  }

  const { data, error } = await supabase
    .from('sellers')
    .select('*')
    .eq('user_id', user.id)
    .order('name', { ascending: true })

  return { data, error }
}

export async function addSeller(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { data: null, error: new Error('Unauthorized') }
  }

  const name = formData.get('name') as string
  const contact_number = formData.get('contact_number') as string | null
  const rate_per_liter = formData.get('rate_per_liter') ? Number(formData.get('rate_per_liter')) : 0
  const payment_terms = formData.get('payment_terms') as string | null

  if (!name || !name.trim()) {
    return { data: null, error: new Error('Seller name is required') }
  }

  const insertData: any = {
    name: name.trim(),
    contact_number: contact_number?.trim() || null,
    rate_per_liter: isNaN(rate_per_liter) ? 0 : rate_per_liter,
    user_id: user.id
  }

  if (payment_terms) {
    insertData.payment_terms = payment_terms
  }

  let { data, error } = await supabase
    .from('sellers')
    .insert(insertData)
    .select()
    .single()

  // Fallback if payment_terms column isn't created in SQL yet
  if (error && error.message?.includes('schema cache')) {
    delete insertData.payment_terms
    const retry = await supabase.from('sellers').insert(insertData).select().single()
    data = retry.data
    error = retry.error
  }

  if (!error) {
    revalidatePath('/dashboard/milk-sales')
    revalidatePath('/dashboard/milk-sales/sellers')
  }

  return { data, error }
}

export async function updateSeller(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { data: null, error: new Error('Unauthorized') }
  }

  const id = formData.get('id') as string
  const name = formData.get('name') as string
  const contact_number = formData.get('contact_number') as string | null
  const rate_per_liter = formData.get('rate_per_liter') ? Number(formData.get('rate_per_liter')) : 0
  const payment_terms = formData.get('payment_terms') as string | null

  if (!id) {
    return { data: null, error: new Error('Seller ID is required') }
  }

  if (!name || !name.trim()) {
    return { data: null, error: new Error('Seller name is required') }
  }

  const updateData: any = {
    name: name.trim(),
    contact_number: contact_number?.trim() || null,
    rate_per_liter: isNaN(rate_per_liter) ? 0 : rate_per_liter,
  }

  if (payment_terms) {
    updateData.payment_terms = payment_terms
  }

  let { data, error } = await supabase
    .from('sellers')
    .update(updateData)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error && error.message?.includes('schema cache')) {
    delete updateData.payment_terms
    const retry = await supabase.from('sellers').update(updateData).eq('id', id).eq('user_id', user.id).select().single()
    data = retry.data
    error = retry.error
  }

  if (!error) {
    revalidatePath('/dashboard/milk-sales')
    revalidatePath('/dashboard/milk-sales/sellers')
  }

  return { data, error }
}

export async function bulkUpdateSellerRates(ratePerLiter: number) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: new Error('Unauthorized') }
  }

  const { error } = await supabase
    .from('sellers')
    .update({ rate_per_liter: ratePerLiter })
    .eq('user_id', user.id)

  if (!error) {
    revalidatePath('/dashboard/milk-sales')
  }

  return { error }
}

export async function deleteSeller(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Unauthorized' }
  }

  try {
    // Delete linked payments first (if any)
    await supabase
      .from('seller_payments')
      .delete()
      .eq('seller_id', id)
      .eq('user_id', user.id)

    // Delete linked milk sale entries
    await supabase
      .from('milk_sale_entries')
      .delete()
      .eq('seller_id', id)
      .eq('user_id', user.id)

    // Delete the seller
    const { error } = await supabase
      .from('sellers')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      return { error: error.message || 'Failed to delete buyer' }
    }

    revalidatePath('/dashboard/milk-sales')
    revalidatePath('/dashboard/milk-sales/sellers')
    revalidatePath('/dashboard')

    return { error: null }
  } catch (err: any) {
    return { error: err?.message || 'An unexpected error occurred while deleting buyer' }
  }
}

export async function addMilkSaleEntry(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { data: null, error: new Error('Unauthorized') }
  }

  const seller_id = formData.get('seller_id') as string
  const date = formData.get('date') as string
  const morning_liters = formData.get('morning_liters') ? Number(formData.get('morning_liters')) : 0
  const evening_liters = formData.get('evening_liters') ? Number(formData.get('evening_liters')) : 0
  const rate_per_liter = formData.get('rate_per_liter') ? Number(formData.get('rate_per_liter')) : 0
  const notes = formData.get('notes') as string | null

  if (!seller_id) {
    return { data: null, error: new Error('Please select a buyer') }
  }

  if (!date) {
    return { data: null, error: new Error('Date is required') }
  }

  const insertData: any = {
    seller_id,
    date,
    morning_liters: isNaN(morning_liters) ? 0 : morning_liters,
    evening_liters: isNaN(evening_liters) ? 0 : evening_liters,
    rate_per_liter: isNaN(rate_per_liter) ? 0 : rate_per_liter,
    user_id: user.id
  }

  if (notes) insertData.notes = notes.trim()

  let { data, error } = await supabase
    .from('milk_sale_entries')
    .insert(insertData)
    .select()
    .single()

  if (error && error.message?.includes('schema cache')) {
    delete insertData.notes
    const retry = await supabase.from('milk_sale_entries').insert(insertData).select().single()
    data = retry.data
    error = retry.error
  }

  if (!error) {
    revalidatePath('/dashboard/milk-sales')
    revalidatePath('/dashboard')
  }

  return { data, error }
}

export async function updateMilkSaleEntry(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { data: null, error: new Error('Unauthorized') }
  }

  const id = formData.get('id') as string
  const seller_id = formData.get('seller_id') as string
  const date = formData.get('date') as string
  const morning_liters = formData.get('morning_liters') ? Number(formData.get('morning_liters')) : 0
  const evening_liters = formData.get('evening_liters') ? Number(formData.get('evening_liters')) : 0
  const rate_per_liter = formData.get('rate_per_liter') ? Number(formData.get('rate_per_liter')) : 0
  const notes = formData.get('notes') as string | null

  if (!id) {
    return { data: null, error: new Error('Entry ID is required') }
  }

  if (!seller_id) {
    return { data: null, error: new Error('Please select a buyer') }
  }

  if (!date) {
    return { data: null, error: new Error('Date is required') }
  }

  const updateData: any = {
    seller_id,
    date,
    morning_liters: isNaN(morning_liters) ? 0 : morning_liters,
    evening_liters: isNaN(evening_liters) ? 0 : evening_liters,
    rate_per_liter: isNaN(rate_per_liter) ? 0 : rate_per_liter,
  }

  if (notes) updateData.notes = notes.trim()

  let { data, error } = await supabase
    .from('milk_sale_entries')
    .update(updateData)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error && error.message?.includes('schema cache')) {
    delete updateData.notes
    const retry = await supabase.from('milk_sale_entries').update(updateData).eq('id', id).eq('user_id', user.id).select().single()
    data = retry.data
    error = retry.error
  }

  if (!error) {
    revalidatePath('/dashboard/milk-sales')
    revalidatePath('/dashboard')
  }

  return { data, error }
}

export async function deleteMilkSaleEntry(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: new Error('Unauthorized') }
  }

  const { error } = await supabase
    .from('milk_sale_entries')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (!error) {
    revalidatePath('/dashboard/milk-sales')
    revalidatePath('/dashboard')
  }

  return { error }
}

export async function addSellerPayment(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { data: null, error: 'Unauthorized' }
  }

  const seller_id = formData.get('seller_id') as string
  const date = formData.get('date') as string
  const amount_paid = formData.get('amount_paid') ? Number(formData.get('amount_paid')) : 0
  const notes = formData.get('notes') as string | null

  if (!seller_id || !date || isNaN(amount_paid) || amount_paid <= 0) {
    return { data: null, error: 'Valid seller, date and payment amount are required' }
  }

  const insertData = {
    seller_id,
    date,
    amount_paid,
    notes: notes?.trim() || null,
    user_id: user.id
  }

  const { data, error } = await supabase
    .from('seller_payments')
    .insert(insertData)
    .select()
    .single()

  if (error) {
    return { data: null, error: error.message || 'Failed to record payment' }
  }

  revalidatePath('/dashboard/milk-sales')
  return { data, error: null }
}

export async function getSellerPayments() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { data: null, error: new Error('Unauthorized') }
  }

  const { data, error } = await supabase
    .from('seller_payments')
    .select('*, sellers(*)')
    .eq('user_id', user.id)
    .order('date', { ascending: false })

  return { data: data || [], error }
}

export async function deleteSellerPayment(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: new Error('Unauthorized') }
  }

  const { error } = await supabase
    .from('seller_payments')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (!error) {
    revalidatePath('/dashboard/milk-sales')
  }

  return { error }
}
