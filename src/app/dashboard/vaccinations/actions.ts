'use server'

import { revalidatePath } from 'next/cache'
import { VaccinationRecord } from '@/lib/types'
import { calculateNextDueDate, computeVaccineStatus } from '@/lib/dateUtils'
import { dataAction, statusAction, fail, FormReader } from '@/lib/actions'

// Returns the validated fields, or a message describing what is wrong.
function readVaccinationFields(form: FormReader) {
  const animal_id = form.raw('animal_id')
  const vaccine_name = form.text('vaccine_name')
  const date_given = form.raw('date_given')

  if (!animal_id) return { error: 'Please select an animal' } as const
  if (!vaccine_name) return { error: 'Vaccine name is required' } as const
  if (!date_given) return { error: 'Date given is required' } as const

  const next_due_date = form.raw('next_due_date') || calculateNextDueDate(vaccine_name, date_given)

  return {
    error: null,
    fields: {
      animal_id,
      vaccine_name,
      date_given,
      given_by: form.optionalText('given_by'),
      notes: form.optionalText('notes'),
      next_due_date,
      status: computeVaccineStatus(next_due_date),
    },
  } as const
}

export async function addVaccinationRecord(formData: FormData) {
  return dataAction<VaccinationRecord>(async ({ supabase, user }) => {
    const parsed = readVaccinationFields(new FormReader(formData))
    if (parsed.error !== null) return fail(parsed.error)

    const { data, error } = await supabase
      .from('vaccination_records')
      .insert({ ...parsed.fields, user_id: user.id })
      .select('*, animals(*)')
      .single()

    if (error) return fail(error.message)

    revalidatePath('/dashboard/vaccinations')
    revalidatePath('/dashboard')

    return { data, error: null }
  })
}

export async function updateVaccinationRecord(formData: FormData) {
  return dataAction<VaccinationRecord>(async ({ supabase, user }) => {
    const form = new FormReader(formData)
    const id = form.raw('id')
    if (!id) return fail('Record ID is required')

    const parsed = readVaccinationFields(form)
    if (parsed.error !== null) return fail(parsed.error)

    const { data, error } = await supabase
      .from('vaccination_records')
      .update(parsed.fields)
      .eq('id', id)
      .eq('user_id', user.id)
      .select('*, animals(*)')
      .single()

    if (error) return fail(error.message)

    revalidatePath('/dashboard/vaccinations')
    revalidatePath('/dashboard')

    return { data, error: null }
  })
}

export async function deleteVaccinationRecord(id: string) {
  return statusAction(async ({ supabase, user }) => {
    const { error } = await supabase
      .from('vaccination_records')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) return { error: error.message }

    revalidatePath('/dashboard/vaccinations')
    revalidatePath('/dashboard')

    return { error: null }
  })
}
