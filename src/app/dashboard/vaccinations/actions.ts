'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { calculateNextDueDate, computeVaccineStatus } from '@/lib/dateUtils'

export async function getVaccinationRecords() {
  const supabase = await createClient()
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { data: null, error: 'Unauthorized' }

    const { data, error } = await supabase
      .from('vaccination_records')
      .select('*, animals(*)')
      .eq('user_id', user.id)
      .order('next_due_date', { ascending: true })

    if (error) return { data: null, error: error.message }
    return { data, error: null }
  } catch (err: any) {
    return { data: null, error: err.message || 'An unexpected error occurred' }
  }
}

export async function addVaccinationRecord(formData: FormData) {
  const supabase = await createClient()
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { data: null, error: 'Unauthorized' }

    const animal_id = formData.get('animal_id') as string
    const vaccine_name = formData.get('vaccine_name') as string
    const date_given = formData.get('date_given') as string
    const given_by = formData.get('given_by') as string | null
    const notes = formData.get('notes') as string | null
    let next_due_date = formData.get('next_due_date') as string | null

    if (!animal_id) return { data: null, error: 'Please select an animal' }
    if (!vaccine_name || !vaccine_name.trim()) return { data: null, error: 'Vaccine name is required' }
    if (!date_given) return { data: null, error: 'Date given is required' }

    if (!next_due_date) {
      next_due_date = calculateNextDueDate(vaccine_name, date_given)
    }

    const status = computeVaccineStatus(next_due_date)

    const { data, error } = await supabase
      .from('vaccination_records')
      .insert({
        animal_id,
        vaccine_name: vaccine_name.trim(),
        date_given,
        given_by: given_by?.trim() || null,
        notes: notes?.trim() || null,
        next_due_date,
        status,
        user_id: user.id
      })
      .select('*, animals(*)')
      .single()

    if (error) return { data: null, error: error.message }

    revalidatePath('/dashboard/vaccinations')
    revalidatePath('/dashboard')

    return { data, error: null }
  } catch (err: any) {
    return { data: null, error: err.message || 'An unexpected error occurred' }
  }
}

export async function updateVaccinationRecord(formData: FormData) {
  const supabase = await createClient()
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { data: null, error: 'Unauthorized' }

    const id = formData.get('id') as string
    const animal_id = formData.get('animal_id') as string
    const vaccine_name = formData.get('vaccine_name') as string
    const date_given = formData.get('date_given') as string
    const given_by = formData.get('given_by') as string | null
    const notes = formData.get('notes') as string | null
    let next_due_date = formData.get('next_due_date') as string | null

    if (!id) return { data: null, error: 'Record ID is required' }
    if (!animal_id) return { data: null, error: 'Please select an animal' }
    if (!vaccine_name || !vaccine_name.trim()) return { data: null, error: 'Vaccine name is required' }
    if (!date_given) return { data: null, error: 'Date given is required' }

    if (!next_due_date) {
      next_due_date = calculateNextDueDate(vaccine_name, date_given)
    }

    const status = computeVaccineStatus(next_due_date)

    const { data, error } = await supabase
      .from('vaccination_records')
      .update({
        animal_id,
        vaccine_name: vaccine_name.trim(),
        date_given,
        given_by: given_by?.trim() || null,
        notes: notes?.trim() || null,
        next_due_date,
        status,
      })
      .eq('id', id)
      .eq('user_id', user.id)
      .select('*, animals(*)')
      .single()

    if (error) return { data: null, error: error.message }

    revalidatePath('/dashboard/vaccinations')
    revalidatePath('/dashboard')

    return { data, error: null }
  } catch (err: any) {
    return { data: null, error: err.message || 'An unexpected error occurred' }
  }
}

export async function deleteVaccinationRecord(id: string) {
  const supabase = await createClient()
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const { error } = await supabase
      .from('vaccination_records')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) return { error: error.message }

    revalidatePath('/dashboard/vaccinations')
    revalidatePath('/dashboard')

    return { error: null }
  } catch (err: any) {
    return { error: err.message || 'An unexpected error occurred' }
  }
}
