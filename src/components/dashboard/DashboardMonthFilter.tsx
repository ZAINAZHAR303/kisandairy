'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import MonthPicker from '@/components/ui/MonthPicker'

export default function DashboardMonthFilter() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const currentMonth = new Date().getMonth()
  const currentYear = new Date().getFullYear()
  
  const month = searchParams.get('month') ? parseInt(searchParams.get('month')!) : currentMonth
  const year = searchParams.get('year') ? parseInt(searchParams.get('year')!) : currentYear

  return (
    <div className="w-full sm:w-72">
      <MonthPicker 
        selectedMonth={month} 
        selectedYear={year} 
        onChange={(m, y) => router.push(`?month=${m}&year=${y}`)} 
      />
    </div>
  )
}
