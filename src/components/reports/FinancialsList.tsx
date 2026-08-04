'use client'

import React, { useMemo, useState } from 'react'
import { MilkSaleEntry, Expense } from '@/lib/types'
import Link from 'next/link'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

interface FinancialsListProps {
  milkEntries: MilkSaleEntry[]
  expenses: Expense[]
}

interface MonthlyFinancialSummary {
  monthKey: string // YYYY-MM
  monthLabel: string
  litersSold: number
  revenue: number
  expensesTotal: number
  netProfit: number
  marginPercent: number
}

export default function FinancialsList({ milkEntries, expenses }: FinancialsListProps) {
  const [selectedYear, setSelectedYear] = useState<string>('all')

  // Group data by Month (YYYY-MM)
  const monthlyData = useMemo(() => {
    const map = new Map<string, { liters: number; revenue: number; expenses: number }>()

    // Process Milk Revenue
    milkEntries.forEach(entry => {
      if (!entry.date) return
      const monthKey = entry.date.substring(0, 7) // YYYY-MM
      const current = map.get(monthKey) || { liters: 0, revenue: 0, expenses: 0 }
      current.liters += Number(entry.total_liters || 0)
      current.revenue += Number(entry.total_amount || 0)
      map.set(monthKey, current)
    })

    // Process Expenses
    expenses.forEach(exp => {
      if (!exp.date) return
      const monthKey = exp.date.substring(0, 7) // YYYY-MM
      const current = map.get(monthKey) || { liters: 0, revenue: 0, expenses: 0 }
      current.expenses += Number(exp.amount || 0)
      map.set(monthKey, current)
    })

    // Convert map to sorted array of summaries
    const list: MonthlyFinancialSummary[] = []
    map.forEach((val, monthKey) => {
      const [year, monthNum] = monthKey.split('-')
      const monthLabel = `${monthNum}/${year}`

      const netProfit = val.revenue - val.expenses
      const marginPercent = val.revenue > 0 ? (netProfit / val.revenue) * 100 : 0

      list.push({
        monthKey,
        monthLabel,
        litersSold: val.liters,
        revenue: val.revenue,
        expensesTotal: val.expenses,
        netProfit,
        marginPercent,
      })
    })

    // Sort descending by month (newest month first)
    return list.sort((a, b) => b.monthKey.localeCompare(a.monthKey))
  }, [milkEntries, expenses])

  // Extract available years for dropdown
  const availableYears = useMemo(() => {
    const yearsSet = new Set<string>()
    monthlyData.forEach(item => {
      const y = item.monthKey.split('-')[0]
      if (y) yearsSet.add(y)
    })
    return Array.from(yearsSet).sort().reverse()
  }, [monthlyData])

  // Filtered by selected year
  const filteredMonthlyData = useMemo(() => {
    if (selectedYear === 'all') return monthlyData
    return monthlyData.filter(item => item.monthKey.startsWith(selectedYear))
  }, [monthlyData, selectedYear])

  // Overall Totals
  const totalRevenueAll = useMemo(() => {
    return filteredMonthlyData.reduce((sum, item) => sum + item.revenue, 0)
  }, [filteredMonthlyData])

  const totalExpensesAll = useMemo(() => {
    return filteredMonthlyData.reduce((sum, item) => sum + item.expensesTotal, 0)
  }, [filteredMonthlyData])

  const totalNetProfitAll = totalRevenueAll - totalExpensesAll
  const isOverallProfitable = totalNetProfitAll >= 0

  // Export handlers
  const handleExportExcel = () => {
    if (filteredMonthlyData.length === 0) return alert('No data to export')

    const rows = filteredMonthlyData.map(item => ({
      'Month': item.monthLabel,
      'Total Liters Sold': Number(item.litersSold.toFixed(1)),
      'Milk Revenue (Rs.)': Number(item.revenue.toFixed(2)),
      'Expenses (Rs.)': Number(item.expensesTotal.toFixed(2)),
      'Net Profit / Loss (Rs.)': Number(item.netProfit.toFixed(2)),
      'Profit Margin (%)': `${item.marginPercent.toFixed(1)}%`,
    }))

    rows.push({
      'Month': 'TOTAL SUMMARY',
      'Total Liters Sold': Number(filteredMonthlyData.reduce((sum, i) => sum + i.litersSold, 0).toFixed(1)),
      'Milk Revenue (Rs.)': totalRevenueAll,
      'Expenses (Rs.)': totalExpensesAll,
      'Net Profit / Loss (Rs.)': totalNetProfitAll,
      'Profit Margin (%)': `${totalRevenueAll > 0 ? ((totalNetProfitAll / totalRevenueAll) * 100).toFixed(1) : 0}%`,
    })

    const worksheet = XLSX.utils.json_to_sheet(rows)
    worksheet['!cols'] = [
      { wch: 18 },
      { wch: 18 },
      { wch: 20 },
      { wch: 16 },
      { wch: 22 },
      { wch: 18 },
    ]

    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Monthly Financials')
    XLSX.writeFile(workbook, `Kisan_Dairy_Financial_Report_${selectedYear}.xlsx`)
  }

  const handleExportPDF = () => {
    if (filteredMonthlyData.length === 0) return alert('No data to export')

    const doc = new jsPDF()

    // Header Banner
    doc.setFillColor(2, 18, 59) // #1a2f5e
    doc.rect(0, 0, 210, 25, 'F')

    doc.setTextColor(255, 255, 255)
    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    doc.text('KISAN DAIRY — MONTHLY PROFIT & LOSS REPORT', 14, 16)

    doc.setTextColor(50, 50, 50)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    const todayStr = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    doc.text(`Filter Year: ${selectedYear === 'all' ? 'All Time' : selectedYear}  |  Generated on: ${todayStr}`, 14, 33)

    const head = [['Month', 'Liters Sold', 'Revenue (Rs)', 'Expenses (Rs)', 'Net Profit/Loss (Rs)', 'Margin']]
    const body = filteredMonthlyData.map(item => [
      item.monthLabel,
      `${item.litersSold.toFixed(1)} L`,
      `Rs. ${item.revenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
      `Rs. ${item.expensesTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
      `Rs. ${item.netProfit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
      `${item.marginPercent.toFixed(1)}%`,
    ])

    const foot = [[
      'TOTAL SUMMARY',
      `${filteredMonthlyData.reduce((sum, i) => sum + i.litersSold, 0).toFixed(1)} L`,
      `Rs. ${totalRevenueAll.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
      `Rs. ${totalExpensesAll.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
      `Rs. ${totalNetProfitAll.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
      `${totalRevenueAll > 0 ? ((totalNetProfitAll / totalRevenueAll) * 100).toFixed(1) : 0}%`
    ]]

    autoTable(doc, {
      startY: 38,
      head: head,
      body: body,
      foot: foot,
      theme: 'grid',
      headStyles: { fillColor: [26, 47, 94], textColor: [255, 255, 255], fontStyle: 'bold' },
      footStyles: { fillColor: [0, 191, 166], textColor: [255, 255, 255], fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [245, 247, 250] },
      margin: { left: 14, right: 14 },
    })

    doc.save(`Kisan_Dairy_Financial_Report_${selectedYear}.pdf`)
  }

  return (
    <div className="space-y-6 pb-20">
      {/* Top Navigation / Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <Link
            href="/dashboard"
            className="p-2 text-gray-500 hover:text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors shadow-sm"
          >
            ← Back
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Monthly Net Profit Breakdown 📈</h1>
            <p className="text-xs text-gray-500 mt-0.5">Month-by-month financial statements, revenue & expense audit</p>
          </div>
        </div>

        <div className="flex items-center space-x-2 self-start sm:self-auto">
          <button
            onClick={handleExportExcel}
            className="inline-flex items-center space-x-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3 py-2 rounded-xl transition-all shadow-sm"
          >
            <span>📊</span>
            <span>Export Excel</span>
          </button>
          <button
            onClick={handleExportPDF}
            className="inline-flex items-center space-x-1 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold px-3 py-2 rounded-xl transition-all shadow-sm"
          >
            <span>📄</span>
            <span>Export PDF</span>
          </button>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl shadow-sm border-l-4 border-l-emerald-600 p-5">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Total Milk Revenue</div>
          <div className="text-2xl font-extrabold text-gray-900">
            Rs. {totalRevenueAll.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border-l-4 border-l-orange-600 p-5">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Total Expenses</div>
          <div className="text-2xl font-extrabold text-orange-600">
            Rs. {totalExpensesAll.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </div>
        </div>

        <div className={`bg-white rounded-2xl shadow-sm border-l-4 p-5 ${isOverallProfitable ? 'border-l-green-500' : 'border-l-red-500'}`}>
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Net Profit / Loss</span>
            <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${isOverallProfitable ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              {isOverallProfitable ? 'PROFIT' : 'LOSS'}
            </span>
          </div>
          <div className={`text-2xl font-extrabold ${isOverallProfitable ? 'text-green-600' : 'text-red-600'}`}>
            Rs. {Math.abs(totalNetProfitAll).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </div>
        </div>
      </div>

      {/* Year Filter Bar */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex justify-between items-center">
        <div className="text-sm font-bold text-gray-800">
          Monthly Performance Records
        </div>
        <div className="flex items-center space-x-2">
          <label className="text-xs font-semibold text-gray-500">Filter Year:</label>
          <select
            value={selectedYear}
            onChange={e => setSelectedYear(e.target.value)}
            className="rounded-xl border border-gray-200 px-3 py-1.5 text-xs font-semibold bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[var(--color-blue)]"
          >
            <option value="all">All Years</option>
            {availableYears.map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Monthly Statements List */}
      {filteredMonthlyData.length > 0 ? (
        <div className="space-y-4">
          {filteredMonthlyData.map(item => {
            const isMonthProfitable = item.netProfit >= 0
            return (
              <div
                key={item.monthKey}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
              >
                {/* Header Row */}
                <div className="bg-white border-b border-gray-100 text-white px-5 py-3.5 flex justify-between items-center">
                  <div className="font-bold text-base tracking-wide flex items-center space-x-2">
                    <span>🗓️</span>
                    <span>{item.monthLabel}</span>
                  </div>
                  <span className={`text-xs font-extrabold px-3 py-1 rounded-full ${isMonthProfitable ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
                    {isMonthProfitable ? `+ Rs. ${item.netProfit.toLocaleString('en-IN', { maximumFractionDigits: 0 })} Profit` : `- Rs. ${Math.abs(item.netProfit).toLocaleString('en-IN', { maximumFractionDigits: 0 })} Loss`}
                  </span>
                </div>

                {/* Details Body */}
                <div className="p-5 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center border-b border-gray-100">
                  <div className="bg-blue-50/50 p-3 rounded-xl border border-blue-100">
                    <div className="text-[10px] text-blue-700 font-semibold uppercase tracking-wider mb-0.5">Milk Sold</div>
                    <div className="text-sm font-bold text-gray-900">{item.litersSold.toFixed(1)} L</div>
                  </div>

                  <div className="bg-blue-50/50 p-3 rounded-xl border border-blue-100">
                    <div className="text-[10px] text-blue-700 font-semibold uppercase tracking-wider mb-0.5">Milk Revenue</div>
                    <div className="text-sm font-bold text-blue-900">
                      Rs. {item.revenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </div>
                  </div>

                  <div className="bg-orange-50/50 p-3 rounded-xl border border-orange-100">
                    <div className="text-[10px] text-orange-700 font-semibold uppercase tracking-wider mb-0.5">Farm Expenses</div>
                    <div className="text-sm font-bold text-orange-900">
                      Rs. {item.expensesTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </div>
                  </div>

                  <div className={`p-3 rounded-xl border ${isMonthProfitable ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                    <div className={`text-[10px] font-semibold uppercase tracking-wider mb-0.5 ${isMonthProfitable ? 'text-green-700' : 'text-red-700'}`}>
                      {isMonthProfitable ? 'Net Profit' : 'Net Loss'}
                    </div>
                    <div className={`text-sm font-extrabold ${isMonthProfitable ? 'text-green-700' : 'text-red-700'}`}>
                      Rs. {Math.abs(item.netProfit).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                </div>

                {/* Footer Bar with Profit Margin */}
                <div className="bg-gray-50 px-5 py-2.5 flex justify-between items-center text-xs text-gray-500">
                  <span>Margin: <strong className="text-gray-800">{item.marginPercent.toFixed(1)}%</strong></span>
                  <div className="flex space-x-3">
                    <Link href={`/dashboard/milk-sales?month=${item.monthKey}`} className="text-blue-600 hover:underline font-medium">
                      View Sales →
                    </Link>
                    <Link href={`/dashboard/expenses?month=${item.monthKey}`} className="text-orange-600 hover:underline font-medium">
                      View Expenses →
                    </Link>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="bg-white rounded-2xl p-8 text-center border border-gray-100 shadow-sm space-y-4">
          <div className="text-5xl">📈</div>
          <h3 className="text-lg font-bold text-gray-800">No Monthly Records Available</h3>
          <p className="text-sm text-gray-500 max-w-xs mx-auto">
            Log milk sales and farm expenses to automatically generate monthly profit and loss statements.
          </p>
        </div>
      )}
    </div>
  )
}
