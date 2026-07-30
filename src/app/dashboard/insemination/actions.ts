'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { Animal } from '@/lib/types'

export async function getAnimals() {
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
    revalidatePath('/dashboard/insemination')
    revalidatePath('/dashboard/animals')
    revalidatePath('/dashboard')
  }

  return { data, error }
}

export async function getInseminationRecords() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('insemination_records')
    .select('*, animals(*)')
    .order('ai_date', { ascending: false })

  return { data, error }
}

export async function addInseminationRecord(formData: FormData) {
  const supabase = await createClient()
  
  const animal_id = formData.get('animal_id') as string
  const ai_date = formData.get('ai_date') as string
  const method = formData.get('method') as 'AI' | 'Natural'
  const semen_company = formData.get('semen_company') as string | null
  const bull_name = formData.get('bull_name') as string | null
  const lactation_no = formData.get('lactation_no') ? Number(formData.get('lactation_no')) : null
  const pregnancy_status = formData.get('pregnancy_status') as string | null
  const calving_date = formData.get('calving_date') as string | null

  // calculate expected_calving_date
  let expected_calving_date = null

  if (animal_id && ai_date) {
    const { data: animal } = await supabase.from('animals').select('type').eq('id', animal_id).single()
    if (animal) {
      const aiDateObj = new Date(ai_date)
      const daysToAdd = animal.type === 'buffalo' ? 310 : 283
      aiDateObj.setDate(aiDateObj.getDate() + daysToAdd)
      expected_calving_date = aiDateObj.toISOString().split('T')[0]
    }
  }

  const { data, error } = await supabase
    .from('insemination_records')
    .insert({
      animal_id,
      ai_date,
      method,
      semen_company,
      bull_name,
      lactation_no,
      pregnancy_status,
      expected_calving_date,
      calving_date: pregnancy_status?.toLowerCase() === 'calved' ? (calving_date || new Date().toISOString().split('T')[0]) : null
    })
    .select()
    .single()

  if (!error) {
    revalidatePath('/dashboard/insemination')
  }

  return { data, error }
}

export async function updateInseminationRecord(formData: FormData) {
  const supabase = await createClient()
  
  const id = formData.get('id') as string
  const animal_id = formData.get('animal_id') as string
  const ai_date = formData.get('ai_date') as string
  const method = formData.get('method') as 'AI' | 'Natural'
  const semen_company = formData.get('semen_company') as string | null
  const bull_name = formData.get('bull_name') as string | null
  const lactation_no = formData.get('lactation_no') ? Number(formData.get('lactation_no')) : null
  const pregnancy_status = formData.get('pregnancy_status') as string | null
  const calving_date = formData.get('calving_date') as string | null

  // calculate expected_calving_date
  let expected_calving_date = null

  if (animal_id && ai_date) {
    const { data: animal } = await supabase.from('animals').select('type').eq('id', animal_id).single()
    if (animal) {
      const aiDateObj = new Date(ai_date)
      const daysToAdd = animal.type === 'buffalo' ? 310 : 283
      aiDateObj.setDate(aiDateObj.getDate() + daysToAdd)
      expected_calving_date = aiDateObj.toISOString().split('T')[0]
    }
  }

  const { data, error } = await supabase
    .from('insemination_records')
    .update({
      animal_id,
      ai_date,
      method,
      semen_company,
      bull_name,
      lactation_no,
      pregnancy_status,
      expected_calving_date,
      calving_date: pregnancy_status?.toLowerCase() === 'calved' ? (calving_date || new Date().toISOString().split('T')[0]) : null
    })
    .eq('id', id)
    .select()
    .single()

  if (!error) {
    revalidatePath('/dashboard/insemination')
  }

  return { data, error }
}

export async function deleteInseminationRecord(id: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('insemination_records')
    .delete()
    .eq('id', id)

  if (!error) {
    revalidatePath('/dashboard/insemination')
  }

  return { error }
}
