import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { fetchAllRows } from '@/lib/supabase/fetchAll'
import InseminationList from '@/components/insemination/InseminationList'
import { InseminationRecord, Animal, PregnancyFilter } from '@/lib/types'

export const metadata: Metadata = {
  title: 'Insemination Tracker | Kisan Dairy',
}

export default async function InseminationPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const params = await searchParams
  const initialStatus = (params?.status as PregnancyFilter) || 'All'
  const supabase = await createClient()

  const [records, animals] = await Promise.all([
    // Insemination records with joined animal data
    fetchAllRows<InseminationRecord>('breeding records', (from, to) =>
      supabase
        .from('insemination_records')
        .select('*, animals(*)', { count: 'exact' })
        .order('ai_date', { ascending: false })
        .order('id')
        .range(from, to)
    ),
    // User's animals for the add form dropdown
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
    <InseminationList
      initialRecords={records}
      animals={animals}
      initialFilter={initialStatus}
    />
  )
}
