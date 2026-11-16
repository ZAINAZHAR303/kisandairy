'use client'

import { useMemo, useState } from 'react'
import { MilkSaleEntry, SellerPayment } from '@/lib/types'
import { formatNumericDate } from '@/lib/dateUtils'
import { MONTH_NAMES } from '@/components/ui/MonthPicker'

interface BuyerPaymentHistoryProps {
  /** Every milk sale to this buyer, all time. */
  entries: MilkSaleEntry[]
  /** Every payment received from this buyer, all time. */
  payments: SellerPayment[]
  selectedMonth: number
  selectedYear: number
  onViewMonth: (month: number, year: number) => void
  onAddPayment: () => void
  onEditPayment: (payment: SellerPayment) => void
  onDeletePayment: (id: string) => void
}

interface MonthRow {
  key: string // "YYYY-MM"
  year: number
  month: number // 0-11
  sales: number
  paid: number
  /** Sales minus payments within this month only. */
  monthBalance: number
  /** What the buyer owed in total at the end of this month. */
  balanceAfter: number
  payments: SellerPayment[]
}

const money = (value: number) =>
  `PKR ${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}`

// Red when the buyer owes money, green when settled or paid in advance.
const balanceColor = (value: number) => (value > 0.005 ? 'text-red-600' : 'text-emerald-600')

function buildMonthRows(entries: MilkSaleEntry[], payments: SellerPayment[]): MonthRow[] {
  const byMonth = new Map<string, MonthRow>()

  const rowFor = (date: string | null | undefined) => {
    const key = (date || '').slice(0, 7)
    if (!/^\d{4}-\d{2}$/.test(key)) return null
    let row = byMonth.get(key)
    if (!row) {
      row = {
        key,
        year: Number(key.slice(0, 4)),
        month: Number(key.slice(5, 7)) - 1,
        sales: 0,
        paid: 0,
        monthBalance: 0,
        balanceAfter: 0,
        payments: [],
      }
      byMonth.set(key, row)
    }
    return row
  }

  entries.forEach(entry => {
    const row = rowFor(entry.date)
    if (row) row.sales += Number(entry.total_amount || 0)
  })
  payments.forEach(payment => {
    const row = rowFor(payment.date)
    if (!row) return
    row.paid += Number(payment.amount_paid || 0)
    row.payments.push(payment)
  })

  // Oldest first to carry the balance forward, then newest first for display.
  const rows = [...byMonth.values()].sort((a, b) => a.key.localeCompare(b.key))
  let running = 0
  rows.forEach(row => {
    row.monthBalance = row.sales - row.paid
    running += row.monthBalance
    row.balanceAfter = running
    row.payments.sort((a, b) => b.date.localeCompare(a.date))
  })
  return rows.reverse()
}

/**
 * A buyer's whole payment record, one row per month: what they bought, what
 * they paid and what they still owed. Opening a month lists its payments,
 * which can be corrected or deleted.
 */
export default function BuyerPaymentHistory({
  entries,
  payments,
  selectedMonth,
  selectedYear,
  onViewMonth,
  onAddPayment,
  onEditPayment,
  onDeletePayment,
}: BuyerPaymentHistoryProps) {
  const rows = useMemo(() => buildMonthRows(entries, payments), [entries, payments])
  const [openMonth, setOpenMonth] = useState<string | null>(null)

  const totalSales = rows.reduce((sum, row) => sum + row.sales, 0)
  const totalPaid = rows.reduce((sum, row) => sum + row.paid, 0)

  return (
    <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 space-y-4">
      <div className="flex justify-between items-center gap-3">
        <div>
          <h3 className="text-sm font-bold text-gray-900">Payment History (ادائیگی کی تاریخ)</h3>
          <p className="text-xs text-gray-400 font-medium mt-0.5">
            Every month for this buyer. Tap a month to see and edit its payments.
          </p>
        </div>
        <button
          onClick={onAddPayment}
          className="flex-none bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold px-3.5 py-2 rounded-xl transition-all"
        >
          + Payment
        </button>
      </div>

      {rows.length === 0 ? (
        <div className="py-8 text-center text-gray-500 font-medium text-sm">
          No sales or payments recorded for this buyer yet.
        </div>
      ) : (
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-gray-100 text-gray-400 uppercase font-bold text-[10px] tracking-wider">
                <th className="py-3 px-3">MONTH</th>
                <th className="py-3 px-3">SALES</th>
                <th className="py-3 px-3">PAID</th>
                <th className="py-3 px-3">MONTH OUTSTANDING</th>
                <th className="py-3 px-3">BALANCE AFTER</th>
                <th className="py-3 px-3 text-right">PAYMENTS</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(row => {
                const isOpen = openMonth === row.key
                const isSelected = row.month === selectedMonth && row.year === selectedYear
                return (
                  <MonthRows
                    key={row.key}
                    row={row}
                    isOpen={isOpen}
                    isSelected={isSelected}
                    onToggle={() => setOpenMonth(isOpen ? null : row.key)}
                    onViewMonth={onViewMonth}
                    onEditPayment={onEditPayment}
                    onDeletePayment={onDeletePayment}
                  />
                )
              })}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-gray-200 font-extrabold">
                <td className="py-3.5 px-3 text-gray-900">All time</td>
                <td className="py-3.5 px-3 text-gray-900">{money(totalSales)}</td>
                <td className="py-3.5 px-3 text-emerald-600">{money(totalPaid)}</td>
                <td className="py-3.5 px-3 text-gray-400">—</td>
                <td className={`py-3.5 px-3 ${balanceColor(totalSales - totalPaid)}`}>
                  {money(totalSales - totalPaid)}
                </td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  )
}

interface MonthRowsProps {
  row: MonthRow
  isOpen: boolean
  isSelected: boolean
  onToggle: () => void
  onViewMonth: (month: number, year: number) => void
  onEditPayment: (payment: SellerPayment) => void
  onDeletePayment: (id: string) => void
}

function MonthRows({ row, isOpen, isSelected, onToggle, onViewMonth, onEditPayment, onDeletePayment }: MonthRowsProps) {
  const count = row.payments.length
  return (
    <>
      <tr
        onClick={onToggle}
        className={`border-b border-gray-50 cursor-pointer transition-colors ${
          isOpen ? 'bg-emerald-50/50' : 'hover:bg-gray-50/80'
        }`}
      >
        <td className="py-3.5 px-3 font-bold text-gray-900 whitespace-nowrap">
          <span className="inline-block w-4 text-gray-400">{isOpen ? '▾' : '▸'}</span>
          {MONTH_NAMES[row.month]} {row.year}
          {isSelected && (
            <span className="ml-2 bg-blue-50 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-blue-100">
              Viewing
            </span>
          )}
        </td>
        <td className="py-3.5 px-3 font-extrabold text-gray-900 whitespace-nowrap">{money(row.sales)}</td>
        <td className="py-3.5 px-3 font-bold text-emerald-600 whitespace-nowrap">{money(row.paid)}</td>
        <td className={`py-3.5 px-3 font-bold whitespace-nowrap ${balanceColor(row.monthBalance)}`}>
          {money(row.monthBalance)}
        </td>
        <td className={`py-3.5 px-3 font-bold whitespace-nowrap ${balanceColor(row.balanceAfter)}`}>
          {money(row.balanceAfter)}
        </td>
        <td className="py-3.5 px-3 text-right font-semibold text-gray-500 whitespace-nowrap">
          {count} {count === 1 ? 'payment' : 'payments'}
        </td>
      </tr>

      {isOpen && (
        <tr className="bg-gray-50/60">
          <td colSpan={6} className="px-3 py-3">
            {count === 0 ? (
              <p className="text-gray-500 font-medium py-2 px-1">No payments received in this month.</p>
            ) : (
              <ul className="divide-y divide-gray-100 bg-white rounded-2xl border border-gray-100">
                {row.payments.map(payment => (
                  <li key={payment.id} className="flex items-center justify-between gap-3 px-4 py-3">
                    <div className="min-w-0">
                      <div className="font-bold text-emerald-600">{money(Number(payment.amount_paid || 0))}</div>
                      <div className="text-gray-500 truncate">
                        {formatNumericDate(payment.date)}
                        {payment.notes ? ` · ${payment.notes}` : ''}
                      </div>
                    </div>
                    <div className="flex-none space-x-3">
                      <button onClick={() => onEditPayment(payment)} className="text-blue-600 hover:underline font-bold">
                        Edit
                      </button>
                      <button onClick={() => onDeletePayment(payment.id)} className="text-red-500 hover:underline font-bold">
                        Delete
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            {!isSelected && (
              <button
                onClick={() => onViewMonth(row.month, row.year)}
                className="mt-3 text-xs font-bold text-gray-600 hover:text-gray-900 bg-white hover:bg-gray-100 px-3 py-2 rounded-xl border border-gray-200"
              >
                Show this month&apos;s sales below
              </button>
            )}
          </td>
        </tr>
      )}
    </>
  )
}
