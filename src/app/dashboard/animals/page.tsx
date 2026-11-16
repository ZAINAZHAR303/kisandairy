import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { fetchAllRows } from '@/lib/supabase/fetchAll'
import AnimalsList from '@/components/animals/AnimalsList'
import { Animal } from '@/lib/types'

export const metadata: Metadata = {
  title: 'My Animals | Kisan Dairy',
}

export default async function AnimalsPage() {
  const supabase = await createClient()

  // Fetch all user animals
  const animals = await fetchAllRows<Animal>('animals', (from, to) =>
    supabase
      .from('animals')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .order('id')
      .range(from, to)
  )

  return (
    <AnimalsList
      initialAnimals={animals}
    />
  )
}
