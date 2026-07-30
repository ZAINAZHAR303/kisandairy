import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import MilkSalesList from '@/components/milk-sales/MilkSalesList'
import { MilkSaleEntry, Seller, SellerPayment } from '@/lib/types'

export const metadata: Metadata = {
  title: 'Milk Sales & Buyers | Kisan Dairy',
}

export default async function MilkSalesPage() {
  const supabase = await createClient()

  // Fetch milk sale entries joined with sellers
  const { data: entries } = await supabase
    .from('milk_sale_entries')
    .select('*, sellers(*)')
    .order('date', { ascending: false })

  // Fetch sellers / buyers
  const { data: sellers } = await supabase
    .from('sellers')
    .select('*')
    .order('name', { ascending: true })

  // Fetch seller payments (safely fallback if table doesn't exist yet)
  const { data: payments } = await supabase
    .from('seller_payments')
    .select('*, sellers(*)')
    .order('date', { ascending: false })

  return (
    <MilkSalesList
      initialEntries={(entries as MilkSaleEntry[]) || []}
      sellers={(sellers as Seller[]) || []}
      initialPayments={(payments as SellerPayment[]) || []}
    />
  )
}
