import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { fetchAllRows } from '@/lib/supabase/fetchAll'
import SellersList from '@/components/milk-sales/SellersList'
import { Seller } from '@/lib/types'

export const metadata: Metadata = {
  title: 'Manage Sellers | Kisan Dairy',
}

export default async function SellersPage() {
  const supabase = await createClient()

  const sellers = await fetchAllRows<Seller>('buyers', (from, to) =>
    supabase
      .from('sellers')
      .select('*', { count: 'exact' })
      .order('name', { ascending: true })
      .order('id')
      .range(from, to)
  )

  return (
    <SellersList
      initialSellers={sellers}
    />
  )
}
