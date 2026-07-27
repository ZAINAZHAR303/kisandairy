import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import VaccinationsList from '@/components/vaccinations/VaccinationsList'
import { VaccinationRecord, Animal } from '@/lib/types'

export const metadata: Metadata = {
  title: 'Vaccination Tracker | Kisan Dairy',
}

export default async function VaccinationsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const params = await searchParams
  const initialTab = params?.tab === 'overdue' ? 'overdue' : 'all'

  const supabase = await createClient()

  // Fetch vaccination records
  const { data: records } = await supabase
    .from('vaccination_records')
    .select('*, animals(*)')
    .order('next_due_date', { ascending: true })

  // Fetch animals
  const { data: animals } = await supabase
    .from('animals')
    .select('*')
    .order('name', { ascending: true })

  return (
    <VaccinationsList
      initialRecords={(records as VaccinationRecord[]) || []}
      animals={(animals as Animal[]) || []}
      initialTab={initialTab}
    />
  )
}
