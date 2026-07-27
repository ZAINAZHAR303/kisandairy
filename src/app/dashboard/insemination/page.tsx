import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
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

  // Fetch insemination records with joined animal data
  const { data: records } = await supabase
    .from('insemination_records')
    .select('*, animals(*)')
    .order('ai_date', { ascending: false })

  // Fetch user's animals for the add form dropdown
  const { data: animals } = await supabase
    .from('animals')
    .select('*')
    .order('name', { ascending: true })

  return (
    <InseminationList
      initialRecords={(records as InseminationRecord[]) || []}
      animals={(animals as Animal[]) || []}
      initialFilter={initialStatus}
    />
  )
}
