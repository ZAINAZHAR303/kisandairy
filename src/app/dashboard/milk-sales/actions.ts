'use server'

import { revalidatePath } from 'next/cache'
import { MilkSaleEntry, Seller, SellerPayment } from '@/lib/types'
import { dataAction, statusAction, fail, FormReader, writeWithOptionalColumns } from '@/lib/actions'

// Postgres "undefined_table" and PostgREST "table not found in schema cache"
const MISSING_TABLE_CODES = ['42P01', 'PGRST205']

function readSellerFields(form: FormReader) {
  const fields: Record<string, unknown> = {
    name: form.text('name'),
    contact_number: form.optionalText('contact_number'),
    rate_per_liter: form.number('rate_per_liter'),
  }
  const paymentTerms = form.raw('payment_terms')
  if (paymentTerms) fields.payment_terms = paymentTerms
  return fields
}

function readMilkSaleFields(form: FormReader) {
  const fields: Record<string, unknown> = {
    seller_id: form.raw('seller_id'),
    date: form.raw('date'),
    morning_liters: form.number('morning_liters'),
    evening_liters: form.number('evening_liters'),
    rate_per_liter: form.number('rate_per_liter'),
  }
  const notes = form.raw('notes')
  if (notes) fields.notes = notes.trim()
  return fields
}

export async function addSeller(formData: FormData) {
  return dataAction<Seller>(async ({ supabase, user }) => {
    const form = new FormReader(formData)
    if (!form.text('name')) return fail('Seller name is required')

    const { data, error } = await writeWithOptionalColumns<Seller>(
      { ...readSellerFields(form), user_id: user.id },
      ['payment_terms'],
      (payload) => supabase.from('sellers').insert(payload).select().single()
    )

    if (error) return fail(error.message || 'Failed to save buyer')

    revalidatePath('/dashboard/milk-sales')
    revalidatePath('/dashboard/milk-sales/sellers')

    return { data, error: null }
  })
}

export async function updateSeller(formData: FormData) {
  return dataAction<Seller>(async ({ supabase, user }) => {
    const form = new FormReader(formData)
    const id = form.raw('id')

    if (!id) return fail('Seller ID is required')
    if (!form.text('name')) return fail('Seller name is required')

    const { data, error } = await writeWithOptionalColumns<Seller>(
      readSellerFields(form),
      ['payment_terms'],
      (payload) =>
        supabase.from('sellers').update(payload).eq('id', id).eq('user_id', user.id).select().single()
    )

    if (error) return fail(error.message || 'Failed to save buyer')

    revalidatePath('/dashboard/milk-sales')
    revalidatePath('/dashboard/milk-sales/sellers')

    return { data, error: null }
  })
}

export async function bulkUpdateSellerRates(ratePerLiter: number) {
  return statusAction(async ({ supabase, user }) => {
    if (typeof ratePerLiter !== 'number' || !Number.isFinite(ratePerLiter) || ratePerLiter < 0) {
      return { error: 'Please enter a valid rate' }
    }

    const { error } = await supabase
      .from('sellers')
      .update({ rate_per_liter: ratePerLiter })
      .eq('user_id', user.id)

    if (error) return { error: error.message }

    revalidatePath('/dashboard/milk-sales')
    return { error: null }
  })
}

export async function deleteSeller(id: string) {
  return statusAction(async ({ supabase, user }) => {
    // These three deletes are not one database transaction, so every step is
    // checked: if one fails we stop and report it instead of silently leaving
    // a buyer with half of their history. Running the delete again finishes it.

    // Delete linked payments first (if any)
    const { error: paymentsError } = await supabase
      .from('seller_payments')
      .delete()
      .eq('seller_id', id)
      .eq('user_id', user.id)

    // A missing payments table just means there is nothing to delete
    if (paymentsError && !MISSING_TABLE_CODES.includes(paymentsError.code)) {
      return { error: `Buyer was not deleted. Could not delete their payments: ${paymentsError.message}` }
    }

    // Delete linked milk sale entries
    const { error: entriesError } = await supabase
      .from('milk_sale_entries')
      .delete()
      .eq('seller_id', id)
      .eq('user_id', user.id)

    if (entriesError) {
      revalidatePath('/dashboard/milk-sales')
      revalidatePath('/dashboard')
      return { error: `Buyer was only partly deleted (payments removed, sales remain). Please delete again. ${entriesError.message}` }
    }

    // Delete the seller
    const { error } = await supabase
      .from('sellers')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      revalidatePath('/dashboard/milk-sales')
      revalidatePath('/dashboard')
      return { error: `Buyer's sales and payments were removed but the buyer could not be deleted. Please delete again. ${error.message || ''}`.trim() }
    }

    revalidatePath('/dashboard/milk-sales')
    revalidatePath('/dashboard/milk-sales/sellers')
    revalidatePath('/dashboard')

    return { error: null }
  })
}

export async function addMilkSaleEntry(formData: FormData) {
  return dataAction<MilkSaleEntry>(async ({ supabase, user }) => {
    const form = new FormReader(formData)

    if (!form.raw('seller_id')) return fail('Please select a buyer')
    if (!form.raw('date')) return fail('Date is required')

    const { data, error } = await writeWithOptionalColumns<MilkSaleEntry>(
      { ...readMilkSaleFields(form), user_id: user.id },
      ['notes'],
      (payload) => supabase.from('milk_sale_entries').insert(payload).select().single()
    )

    if (error) return fail(error.message || 'Failed to save milk sale entry')

    revalidatePath('/dashboard/milk-sales')
    revalidatePath('/dashboard')

    return { data, error: null }
  })
}

export async function updateMilkSaleEntry(formData: FormData) {
  return dataAction<MilkSaleEntry>(async ({ supabase, user }) => {
    const form = new FormReader(formData)
    const id = form.raw('id')

    if (!id) return fail('Entry ID is required')
    if (!form.raw('seller_id')) return fail('Please select a buyer')
    if (!form.raw('date')) return fail('Date is required')

    const { data, error } = await writeWithOptionalColumns<MilkSaleEntry>(
      readMilkSaleFields(form),
      ['notes'],
      (payload) =>
        supabase.from('milk_sale_entries').update(payload).eq('id', id).eq('user_id', user.id).select().single()
    )

    if (error) return fail(error.message || 'Failed to save milk sale entry')

    revalidatePath('/dashboard/milk-sales')
    revalidatePath('/dashboard')

    return { data, error: null }
  })
}

export async function deleteMilkSaleEntry(id: string) {
  return statusAction(async ({ supabase, user }) => {
    const { error } = await supabase
      .from('milk_sale_entries')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) return { error: error.message }

    revalidatePath('/dashboard/milk-sales')
    revalidatePath('/dashboard')

    return { error: null }
  })
}

export async function addSellerPayment(formData: FormData) {
  return dataAction<SellerPayment>(async ({ supabase, user }) => {
    const form = new FormReader(formData)
    const seller_id = form.raw('seller_id')
    const date = form.raw('date')
    const amount_paid = form.number('amount_paid')

    if (!seller_id || !date || amount_paid <= 0) {
      return fail('Valid seller, date and payment amount are required')
    }

    const { data, error } = await supabase
      .from('seller_payments')
      .insert({
        seller_id,
        date,
        amount_paid,
        notes: form.optionalText('notes'),
        user_id: user.id,
      })
      .select()
      .single()

    if (error) return fail(error.message || 'Failed to record payment')

    revalidatePath('/dashboard/milk-sales')
    return { data, error: null }
  })
}

export async function deleteSellerPayment(id: string) {
  return statusAction(async ({ supabase, user }) => {
    const { error } = await supabase
      .from('seller_payments')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) return { error: error.message }

    revalidatePath('/dashboard/milk-sales')
    return { error: null }
  })
}
