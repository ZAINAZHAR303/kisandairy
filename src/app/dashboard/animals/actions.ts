'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getAnimalsList() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { data: null, error: new Error('Unauthorized') }
  }

  const { data, error } = await supabase
    .from('animals')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return { data, error }
}

export async function addAnimal(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { data: null, error: new Error('Unauthorized') }
  }

  const name = formData.get('name') as string
  const tag_number = formData.get('tag_number') as string | null
  const type = (formData.get('type') as 'cow' | 'buffalo') || 'cow'
  const breed = formData.get('breed') as string | null
  const date_of_birth = formData.get('date_of_birth') as string | null
  const gender = (formData.get('gender') as 'female' | 'male') || 'female'
  const status = (formData.get('status') as string) || 'Lactating'
  const dam_info = formData.get('dam_info') as string | null
  const weight_kg = formData.get('weight_kg') ? Number(formData.get('weight_kg')) : null
  const notes = formData.get('notes') as string | null

  if (!name || !name.trim()) {
    return { data: null, error: new Error('Name is required') }
  }

  const insertData: any = {
    name: name.trim(),
    tag_number: tag_number?.trim() || null,
    type,
    breed: breed?.trim() || null,
    user_id: user.id
  }

  if (date_of_birth) insertData.date_of_birth = date_of_birth
  if (gender) insertData.gender = gender
  if (status) insertData.status = status
  if (dam_info) insertData.dam_info = dam_info.trim()
  if (weight_kg && !isNaN(weight_kg)) insertData.weight_kg = weight_kg
  if (notes) insertData.notes = notes.trim()

  const { data, error } = await supabase
    .from('animals')
    .insert(insertData)
    .select()
    .single()

  if (!error) {
    revalidatePath('/dashboard/animals')
    revalidatePath('/dashboard/insemination')
    revalidatePath('/dashboard')
  }

  return { data, error }
}

export async function updateAnimal(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { data: null, error: new Error('Unauthorized') }
  }

  const id = formData.get('id') as string
  const name = formData.get('name') as string
  const tag_number = formData.get('tag_number') as string | null
  const type = (formData.get('type') as 'cow' | 'buffalo') || 'cow'
  const breed = formData.get('breed') as string | null
  const date_of_birth = formData.get('date_of_birth') as string | null
  const gender = (formData.get('gender') as 'female' | 'male') || 'female'
  const status = (formData.get('status') as string) || 'Lactating'
  const dam_info = formData.get('dam_info') as string | null
  const weight_kg = formData.get('weight_kg') ? Number(formData.get('weight_kg')) : null
  const notes = formData.get('notes') as string | null

  if (!id) {
    return { data: null, error: new Error('Animal ID is required') }
  }

  if (!name || !name.trim()) {
    return { data: null, error: new Error('Name is required') }
  }

  const updateData: any = {
    name: name.trim(),
    tag_number: tag_number?.trim() || null,
    type,
    breed: breed?.trim() || null,
    date_of_birth: date_of_birth || null,
    gender: gender || 'female',
    status: status || 'Lactating',
    dam_info: dam_info?.trim() || null,
    weight_kg: weight_kg && !isNaN(weight_kg) ? weight_kg : null,
    notes: notes?.trim() || null,
  }

  const { data, error } = await supabase
    .from('animals')
    .update(updateData)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single()

  if (!error) {
    revalidatePath('/dashboard/animals')
    revalidatePath('/dashboard/insemination')
    revalidatePath('/dashboard')
  }

  return { data, error }
}

export async function deleteAnimal(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: new Error('Unauthorized') }
  }

  const { error } = await supabase
    .from('animals')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (!error) {
    revalidatePath('/dashboard/animals')
    revalidatePath('/dashboard/insemination')
    revalidatePath('/dashboard')
  }

  return { error }
}
