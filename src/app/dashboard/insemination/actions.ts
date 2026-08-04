'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { Animal } from '@/lib/types'
import { getAnimalsList } from '@/app/dashboard/animals/actions'

export async function getInseminationRecords() {
  const supabase = await createClient()
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { data: null, error: 'Unauthorized' }

    const { data, error } = await supabase
      .from('insemination_records')
      .select('*, animals(*)')
      .eq('user_id', user.id)
      .order('ai_date', { ascending: false })

    if (error) return { data: null, error: error.message }
    return { data, error: null }
  } catch (err: any) {
    return { data: null, error: err.message || 'An unexpected error occurred' }
  }
}

export async function addInseminationRecord(formData: FormData) {
  const supabase = await createClient()
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { data: null, error: 'Unauthorized' }
    
    const animal_id = formData.get('animal_id') as string
    const ai_date = formData.get('ai_date') as string
    const method = formData.get('method') as 'AI' | 'Natural'
    const semen_company = formData.get('semen_company') as string | null
    const bull_name = formData.get('bull_name') as string | null
    const lactation_no = formData.get('lactation_no') ? Number(formData.get('lactation_no')) : null
    const pregnancy_status = formData.get('pregnancy_status') as string | null
    const calving_date = formData.get('calving_date') as string | null
    const notes = formData.get('notes') as string | null

    let expected_calving_date = null

    if (animal_id && ai_date) {
      const { data: animal } = await supabase.from('animals').select('type').eq('id', animal_id).eq('user_id', user.id).single()
      if (animal) {
        const aiDateObj = new Date(ai_date)
        const daysToAdd = animal.type === 'buffalo' ? 310 : 283
        aiDateObj.setDate(aiDateObj.getDate() + daysToAdd)
        expected_calving_date = aiDateObj.toISOString().split('T')[0]
      }
    }

    const recordPayload: any = {
      animal_id,
      ai_date,
      method,
      semen_company: semen_company?.trim() || null,
      bull_name: bull_name?.trim() || null,
      lactation_no,
      pregnancy_status,
      expected_calving_date,
      user_id: user.id
    }

    if (pregnancy_status?.toLowerCase() === 'calved') {
      recordPayload.calving_date = calving_date || new Date().toISOString().split('T')[0]
    }
    if (notes?.trim()) {
      recordPayload.notes = notes.trim()
    }

    let { data, error } = await supabase
      .from('insemination_records')
      .insert(recordPayload)
      .select()
      .single()

    if (error && error.message?.includes('schema cache')) {
      delete recordPayload.calving_date
      delete recordPayload.notes
      const retry = await supabase
        .from('insemination_records')
        .insert(recordPayload)
        .select()
        .single()
      data = retry.data
      error = retry.error
    }

    if (error) return { data: null, error: error.message }

    revalidatePath('/dashboard/insemination')
    return { data, error: null }
  } catch (err: any) {
    return { data: null, error: err.message || 'An unexpected error occurred' }
  }
}

export async function updateInseminationRecord(formData: FormData) {
  const supabase = await createClient()
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { data: null, error: 'Unauthorized' }
    
    const id = formData.get('id') as string
    const animal_id = formData.get('animal_id') as string
    const ai_date = formData.get('ai_date') as string
    const method = formData.get('method') as 'AI' | 'Natural'
    const semen_company = formData.get('semen_company') as string | null
    const bull_name = formData.get('bull_name') as string | null
    const lactation_no = formData.get('lactation_no') ? Number(formData.get('lactation_no')) : null
    const pregnancy_status = formData.get('pregnancy_status') as string | null
    const calving_date = formData.get('calving_date') as string | null
    const notes = formData.get('notes') as string | null

    let expected_calving_date = null

    if (animal_id && ai_date) {
      const { data: animal } = await supabase.from('animals').select('type').eq('id', animal_id).eq('user_id', user.id).single()
      if (animal) {
        const aiDateObj = new Date(ai_date)
        const daysToAdd = animal.type === 'buffalo' ? 310 : 283
        aiDateObj.setDate(aiDateObj.getDate() + daysToAdd)
        expected_calving_date = aiDateObj.toISOString().split('T')[0]
      }
    }

    const recordPayload: any = {
      animal_id,
      ai_date,
      method,
      semen_company: semen_company?.trim() || null,
      bull_name: bull_name?.trim() || null,
      lactation_no,
      pregnancy_status,
      expected_calving_date
    }

    if (pregnancy_status?.toLowerCase() === 'calved') {
      recordPayload.calving_date = calving_date || new Date().toISOString().split('T')[0]
    }
    if (notes?.trim()) {
      recordPayload.notes = notes.trim()
    }

    let { data, error } = await supabase
      .from('insemination_records')
      .update(recordPayload)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error && error.message?.includes('schema cache')) {
      delete recordPayload.calving_date
      delete recordPayload.notes
      const retry = await supabase
        .from('insemination_records')
        .update(recordPayload)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single()
      data = retry.data
      error = retry.error
    }

    if (error) return { data: null, error: error.message }

    revalidatePath('/dashboard/insemination')
    return { data, error: null }
  } catch (err: any) {
    return { data: null, error: err.message || 'An unexpected error occurred' }
  }
}

export async function deleteInseminationRecord(id: string) {
  const supabase = await createClient()
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const { error } = await supabase
      .from('insemination_records')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) return { error: error.message }

    revalidatePath('/dashboard/insemination')
    return { error: null }
  } catch (err: any) {
    return { error: err.message || 'An unexpected error occurred' }
  }
}
