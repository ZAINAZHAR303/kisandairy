'use server'

import { revalidatePath } from 'next/cache'
import { Animal } from '@/lib/types'
import { dataAction, statusAction, fail, FormReader, writeWithOptionalColumns } from '@/lib/actions'

function revalidateAnimalPages() {
  revalidatePath('/dashboard/animals')
  revalidatePath('/dashboard/insemination')
  revalidatePath('/dashboard')
}

export async function addAnimal(formData: FormData) {
  return dataAction<Animal>(async ({ supabase, user }) => {
    const form = new FormReader(formData)
    const name = form.text('name')
    if (!name) return fail('Name is required')

    // Optional fields are only sent when filled in, so database defaults apply.
    const insertData: Record<string, unknown> = {
      name,
      tag_number: form.optionalText('tag_number'),
      type: form.raw('type') || 'cow',
      breed: form.optionalText('breed'),
      gender: form.raw('gender') || 'female',
      status: form.raw('status') || 'Lactating',
      user_id: user.id,
    }

    const dateOfBirth = form.raw('date_of_birth')
    const damInfo = form.raw('dam_info')
    const bullName = form.raw('bull_name')
    const weightKg = form.optionalNumber('weight_kg')
    const notes = form.raw('notes')

    if (dateOfBirth) insertData.date_of_birth = dateOfBirth
    if (damInfo) insertData.dam_info = damInfo.trim()
    if (bullName) insertData.bull_name = bullName.trim()
    if (weightKg) insertData.weight_kg = weightKg
    if (notes) insertData.notes = notes.trim()

    const { data, error } = await writeWithOptionalColumns<Animal>(
      insertData,
      ['bull_name'],
      (payload) => supabase.from('animals').insert(payload).select().single()
    )

    if (error) return fail(error.message || 'Failed to save animal')

    revalidateAnimalPages()

    return { data, error: null }
  })
}

export async function updateAnimal(formData: FormData) {
  return dataAction<Animal>(async ({ supabase, user }) => {
    const form = new FormReader(formData)
    const id = form.raw('id')
    const name = form.text('name')

    if (!id) return fail('Animal ID is required')
    if (!name) return fail('Name is required')

    const updateData: Record<string, unknown> = {
      name,
      tag_number: form.optionalText('tag_number'),
      type: form.raw('type') || 'cow',
      breed: form.optionalText('breed'),
      date_of_birth: form.raw('date_of_birth') || null,
      gender: form.raw('gender') || 'female',
      status: form.raw('status') || 'Lactating',
      dam_info: form.optionalText('dam_info'),
      bull_name: form.optionalText('bull_name'),
      weight_kg: form.optionalNumber('weight_kg') || null,
      notes: form.optionalText('notes'),
    }

    const { data, error } = await writeWithOptionalColumns<Animal>(
      updateData,
      ['bull_name'],
      (payload) =>
        supabase.from('animals').update(payload).eq('id', id).eq('user_id', user.id).select().single()
    )

    if (error) return fail(error.message || 'Failed to save animal')

    revalidateAnimalPages()

    return { data, error: null }
  })
}

export async function deleteAnimal(id: string) {
  return statusAction(async ({ supabase, user }) => {
    const { error } = await supabase
      .from('animals')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) return { error: error.message }

    revalidateAnimalPages()

    return { error: null }
  })
}
