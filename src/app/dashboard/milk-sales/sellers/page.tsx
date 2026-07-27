import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import SellersList from '@/components/milk-sales/SellersList'
import { Seller } from '@/lib/types'

export const metadata: Metadata = {
  title: 'Manage Sellers | Kisan Dairy',
}

export default async function SellersPage() {
  const supabase = await createClient()

  const { data: sellers } = await supabase
    .from('sellers')
    .select('*')
    .order('name', { ascending: true })

  return (
    <SellersList
      initialSellers={(sellers as Seller[]) || []}
    />
  )
}
