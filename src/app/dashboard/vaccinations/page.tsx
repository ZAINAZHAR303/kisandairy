import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { fetchAllRows } from '@/lib/supabase/fetchAll'
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

  const [records, animals] = await Promise.all([
    // Vaccination records
    fetchAllRows<VaccinationRecord>('vaccination records', (from, to) =>
      supabase
        .from('vaccination_records')
        .select('*, animals(*)', { count: 'exact' })
        .order('next_due_date', { ascending: true })
        .order('id')
        .range(from, to)
    ),
    // Animals
    fetchAllRows<Animal>('animals', (from, to) =>
      supabase
        .from('animals')
        .select('*', { count: 'exact' })
        .order('name', { ascending: true })
        .order('id')
        .range(from, to)
    ),
  ])

  return (
    <VaccinationsList
      initialRecords={records}
      animals={animals}
      initialTab={initialTab}
    />
  )
}
