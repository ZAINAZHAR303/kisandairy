import { MilkSaleEntry, SellerPayment } from '@/lib/types'
import { todayDateString } from '@/lib/dateUtils'

export type BuyerSort = 'outstanding' | 'name'

/** All-time totals for one buyer. */
export interface BuyerLedger {
  totalSales: number
  totalPaid: number
  outstanding: number
  entriesCount: number
}

interface TransactionBase {
  id: string
  date: string
  litres: number
  rate: number
  total: number
  paid: number
  notes: string
}

/** One row of a buyer statement: either a milk sale or a payment received. */
export type BuyerTransaction =
  | (TransactionBase & { type: 'sale'; raw: MilkSaleEntry })
  | (TransactionBase & { type: 'payment'; raw: SellerPayment })

// When an outstanding balance falls due, based on the buyer's payment terms.
// "End of Month" (the default) counts the days left in the current month.
// Weekly terms have no fixed weekday stored, so no day count is invented.
export function getDueLabel(paymentTerms: string | null | undefined): string {
  const terms = (paymentTerms || 'End of Month').toLowerCase()
  if (terms.includes('daily')) return 'Due today'
  if (terms.includes('week')) return 'Due weekly'

  const [year, month, day] = todayDateString().split('-').map(Number)
  const lastDayOfMonth = new Date(Date.UTC(year, month, 0)).getUTCDate()
  const daysLeft = lastDayOfMonth - day
  if (daysLeft <= 0) return 'Due today'
  return `Due in ${daysLeft} day${daysLeft === 1 ? '' : 's'}`
}
