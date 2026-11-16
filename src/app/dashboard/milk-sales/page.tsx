import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { fetchAllRows } from '@/lib/supabase/fetchAll'
import MilkSalesList from '@/components/milk-sales/MilkSalesList'
import { MilkSaleEntry, Seller, SellerPayment } from '@/lib/types'

export const metadata: Metadata = {
  title: 'Milk Sales & Buyers | Kisan Dairy',
}

export default async function MilkSalesPage() {
  const supabase = await createClient()

  const [entries, sellers, payments] = await Promise.all([
    // Milk sale entries joined with sellers
    fetchAllRows<MilkSaleEntry>('milk sales', (from, to) =>
      supabase
        .from('milk_sale_entries')
        .select('*, sellers(*)', { count: 'exact' })
        .order('date', { ascending: false })
        .order('id')
        .range(from, to)
    ),
    // Sellers / buyers
    fetchAllRows<Seller>('buyers', (from, to) =>
      supabase
        .from('sellers')
        .select('*', { count: 'exact' })
        .order('name', { ascending: true })
        .order('id')
        .range(from, to)
    ),
    // Seller payments (safely fall back to empty if the table doesn't exist yet)
    fetchAllRows<SellerPayment>(
      'payments',
      (from, to) =>
        supabase
          .from('seller_payments')
          .select('*, sellers(*)', { count: 'exact' })
          .order('date', { ascending: false })
          .order('id')
          .range(from, to),
      { missingTableIsEmpty: true }
    ),
  ])

  return (
    <MilkSalesList
      initialEntries={entries}
      sellers={sellers}
      initialPayments={payments}
    />
  )
}
