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

  if (!name || !name.trim()) {
    return { data: null, error: new Error('Seller name is required') }
  }

  const { data, error } = await supabase
    .from('sellers')
    .insert({
      name: name.trim(),
      contact_number: contact_number?.trim() || null,
      rate_per_liter: isNaN(rate_per_liter) ? 0 : rate_per_liter,
      user_id: user.id
    })
    .select()
    .single()

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

  if (!id) {
    return { data: null, error: new Error('Seller ID is required') }
  }

  if (!name || !name.trim()) {
    return { data: null, error: new Error('Seller name is required') }
  }

  const { data, error } = await supabase
    .from('sellers')
    .update({
      name: name.trim(),
      contact_number: contact_number?.trim() || null,
      rate_per_liter: isNaN(rate_per_liter) ? 0 : rate_per_liter,
    })
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single()

  if (!error) {
    revalidatePath('/dashboard/milk-sales')
    revalidatePath('/dashboard/milk-sales/sellers')
  }

  return { data, error }
}

export async function deleteSeller(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: new Error('Unauthorized') }
  }

  // Check if seller has entries linked
  const { count, error: countErr } = await supabase
    .from('milk_sale_entries')
    .select('*', { count: 'exact', head: true })
    .eq('seller_id', id)

  if (countErr) {
    return { error: countErr }
  }

  if (count && count > 0) {
    return { error: new Error(`Cannot delete seller because they have ${count} milk sale entries linked. Delete the entries first.`) }
  }

  const { error } = await supabase
    .from('sellers')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (!error) {
    revalidatePath('/dashboard/milk-sales')
    revalidatePath('/dashboard/milk-sales/sellers')
  }

  return { error }
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

  if (!seller_id) {
    return { data: null, error: new Error('Please select a seller') }
  }

  if (!date) {
    return { data: null, error: new Error('Date is required') }
  }

  const { data, error } = await supabase
    .from('milk_sale_entries')
    .insert({
      seller_id,
      date,
      morning_liters: isNaN(morning_liters) ? 0 : morning_liters,
      evening_liters: isNaN(evening_liters) ? 0 : evening_liters,
      rate_per_liter: isNaN(rate_per_liter) ? 0 : rate_per_liter,
      user_id: user.id
    })
    .select()
    .single()

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

  if (!id) {
    return { data: null, error: new Error('Entry ID is required') }
  }

  if (!seller_id) {
    return { data: null, error: new Error('Please select a seller') }
  }

  if (!date) {
    return { data: null, error: new Error('Date is required') }
  }

  const { data, error } = await supabase
    .from('milk_sale_entries')
    .update({
      seller_id,
      date,
      morning_liters: isNaN(morning_liters) ? 0 : morning_liters,
      evening_liters: isNaN(evening_liters) ? 0 : evening_liters,
      rate_per_liter: isNaN(rate_per_liter) ? 0 : rate_per_liter,
    })
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single()

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
