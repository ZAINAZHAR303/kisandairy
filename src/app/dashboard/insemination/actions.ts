'use server'

import { revalidatePath } from 'next/cache'
import { InseminationRecord } from '@/lib/types'
import { FARM_TIME_ZONE, todayDateString, addDaysToDateString } from '@/lib/dateUtils'
import {
  dataAction,
  statusAction,
  fail,
  FormReader,
  writeWithOptionalColumns,
  type ActionContext,
} from '@/lib/actions'

const GESTATION_DAYS = { buffalo: 310, cow: 283 }

// Builds the row to save. The expected calving date is derived from the
// insemination date and the animal's species.
async function buildRecordPayload({ supabase, user }: ActionContext, form: FormReader) {
  const animal_id = form.raw('animal_id')
  const ai_date = form.raw('ai_date')
  const pregnancy_status = form.raw('pregnancy_status')

  let expected_calving_date: string | null = null

  if (animal_id && ai_date && /^\d{4}-\d{2}-\d{2}/.test(ai_date)) {
    const { data: animal } = await supabase
      .from('animals')
      .select('type')
      .eq('id', animal_id)
      .eq('user_id', user.id)
      .single()

    if (animal) {
      const days = animal.type === 'buffalo' ? GESTATION_DAYS.buffalo : GESTATION_DAYS.cow
      expected_calving_date = addDaysToDateString(ai_date, days)
    }
  }

  const payload: Record<string, unknown> = {
    animal_id,
    ai_date,
    method: form.raw('method'),
    semen_company: form.optionalText('semen_company'),
    bull_name: form.optionalText('bull_name'),
    lactation_no: form.optionalNumber('lactation_no'),
    pregnancy_status,
    expected_calving_date,
    user_id: user.id,
  }

  if (pregnancy_status?.toLowerCase() === 'calved') {
    payload.calving_date = form.raw('calving_date') || todayDateString(FARM_TIME_ZONE)
  }

  const notes = form.text('notes')
  if (notes) payload.notes = notes

  return payload
}

export async function addInseminationRecord(formData: FormData) {
  return dataAction<InseminationRecord>(async (ctx) => {
    const payload = await buildRecordPayload(ctx, new FormReader(formData))

    const { data, error } = await writeWithOptionalColumns<InseminationRecord>(
      payload,
      ['calving_date', 'notes'],
      (row) => ctx.supabase.from('insemination_records').insert(row).select().single()
    )

    if (error) return fail(error.message || 'Failed to save record')

    revalidatePath('/dashboard/insemination')
    revalidatePath('/dashboard')
    return { data, error: null }
  })
}

export async function updateInseminationRecord(formData: FormData) {
  return dataAction<InseminationRecord>(async (ctx) => {
    const form = new FormReader(formData)
    const id = form.raw('id')
    if (!id) return fail('Record ID is required')

    const payload = await buildRecordPayload(ctx, form)

    const { data, error } = await writeWithOptionalColumns<InseminationRecord>(
      payload,
      ['calving_date', 'notes'],
      (row) =>
        ctx.supabase
          .from('insemination_records')
          .update(row)
          .eq('id', id)
          .eq('user_id', ctx.user.id)
          .select()
          .single()
    )

    if (error) return fail(error.message || 'Failed to save record')

    revalidatePath('/dashboard/insemination')
    revalidatePath('/dashboard')
    return { data, error: null }
  })
}

export async function deleteInseminationRecord(id: string) {
  return statusAction(async ({ supabase, user }) => {
    const { error } = await supabase
      .from('insemination_records')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) return { error: error.message }

    revalidatePath('/dashboard/insemination')
    revalidatePath('/dashboard')
    return { error: null }
  })
}
