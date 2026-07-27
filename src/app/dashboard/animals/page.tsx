import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import AnimalsList from '@/components/animals/AnimalsList'
import { Animal } from '@/lib/types'

export const metadata: Metadata = {
  title: 'My Animals | Kisan Dairy',
}

export default async function AnimalsPage() {
  const supabase = await createClient()

  // Fetch all user animals
  const { data: animals } = await supabase
    .from('animals')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <AnimalsList
      initialAnimals={(animals as Animal[]) || []}
    />
  )
}
