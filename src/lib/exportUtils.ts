import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { MilkSaleEntry } from './types'
import { formatNumericDate } from './dateUtils'

export interface BuyerTxExportItem {
  id: string
  date: string
  type: 'sale' | 'payment'
  litres: number
  rate: number
  total: number
  paid: number
  notes: string
}

export function exportToExcel(entries: MilkSaleEntry[], monthStr: string, sellerName: string) {
  if (!entries || entries.length === 0) {
    alert('No data available to export for the selected filters.')
    return
  }

  // Format data rows
  const rows = entries.map(entry => ({
    'Date': formatNumericDate(entry.date) || '',
    'Seller Name': entry.sellers?.name || 'Unknown',
    'Morning (Liters)': Number(entry.morning_liters || 0),
    'Evening (Liters)': Number(entry.evening_liters || 0),
    'Total (Liters)': Number(entry.total_liters || 0),
    'Rate (Rs./L)': Number(entry.rate_per_liter || 0),
    'Total Amount (Rs.)': Number(entry.total_amount || 0),
  }))

  // Calculate Totals
  const totalLiters = entries.reduce((sum, e) => sum + Number(e.total_liters || 0), 0)
  const totalAmount = entries.reduce((sum, e) => sum + Number(e.total_amount || 0), 0)

  // Append Total Summary row
  rows.push({
    'Date': 'TOTAL',
    'Seller Name': sellerName,
    'Morning (Liters)': entries.reduce((sum, e) => sum + Number(e.morning_liters || 0), 0),
    'Evening (Liters)': entries.reduce((sum, e) => sum + Number(e.evening_liters || 0), 0),
    'Total (Liters)': totalLiters,
    'Rate (Rs./L)': 0,
    'Total Amount (Rs.)': totalAmount,
  })

  const worksheet = XLSX.utils.json_to_sheet(rows)

  // Auto-set column widths
  const colWidths = [
    { wch: 14 }, // Date
    { wch: 22 }, // Seller Name
    { wch: 16 }, // Morning
    { wch: 16 }, // Evening
    { wch: 16 }, // Total Liters
    { wch: 14 }, // Rate
    { wch: 20 }, // Total Amount
  ]
  worksheet['!cols'] = colWidths

  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Milk Sales')

  const safeSellerName = sellerName.replace(/[^a-zA-Z0-9]/g, '_')
  const fileName = `Milk_Sales_${safeSellerName}_${monthStr}.xlsx`
  XLSX.writeFile(workbook, fileName)
}

export function exportToPDF(entries: MilkSaleEntry[], monthStr: string, sellerName: string) {
  if (!entries || entries.length === 0) {
    alert('No data available to export for the selected filters.')
    return
  }

  const doc = new jsPDF()

  // Title & Header Banner (Navy `#1a2f5e`)
  doc.setFillColor(2, 18, 59) // #1a2f5e
  doc.rect(0, 0, 210, 25, 'F')

  doc.setTextColor(255, 255, 255)
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text('KISAN DAIRY — MILK SALE REPORT', 14, 16)

  // Meta Information Subheader
  doc.setTextColor(50, 50, 50)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')

  const todayStr = formatNumericDate(new Date())
  doc.text(`Month: ${monthStr}  |  Seller Filter: ${sellerName}  |  Generated on: ${todayStr}`, 14, 33)

  // Table Data Preparation
  const head = [['Date', 'Seller Name', 'Morning (L)', 'Evening (L)', 'Total (L)', 'Amount (Rs)']]

  const body = entries.map(entry => [
    formatNumericDate(entry.date) || '',
    entry.sellers?.name || 'Unknown',
    Number(entry.morning_liters || 0).toFixed(1),
    Number(entry.evening_liters || 0).toFixed(1),
    Number(entry.total_liters || 0).toFixed(1),
    `Rs. ${Number(entry.total_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
  ])

  // Calculate Totals
  const totalLiters = entries.reduce((sum, e) => sum + Number(e.total_liters || 0), 0)
  const totalAmount = entries.reduce((sum, e) => sum + Number(e.total_amount || 0), 0)

  // Foot Row
  const foot = [[
    'TOTAL SUMMARY',
    sellerName,
    entries.reduce((sum, e) => sum + Number(e.morning_liters || 0), 0).toFixed(1),
    entries.reduce((sum, e) => sum + Number(e.evening_liters || 0), 0).toFixed(1),
    `${totalLiters.toFixed(1)} L`,
    `Rs. ${totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
  ]]

  // Generate Table using autoTable
  autoTable(doc, {
    startY: 38,
    head: head,
    body: body,
    foot: foot,
    theme: 'grid',
    headStyles: {
      fillColor: [26, 47, 94], // Dark navy
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9,
    },
    footStyles: {
      fillColor: [0, 191, 166], // Teal #00BFA6
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9,
    },
    bodyStyles: {
      fontSize: 8.5,
      textColor: [30, 30, 30],
    },
    alternateRowStyles: {
      fillColor: [245, 247, 250],
    },
    margin: { left: 14, right: 14 },
  })

  const safeSellerName = sellerName.replace(/[^a-zA-Z0-9]/g, '_')
  const fileName = `Milk_Sales_${safeSellerName}_${monthStr}.pdf`
  doc.save(fileName)
}

export function exportBuyerStatementExcel(buyerName: string, transactions: BuyerTxExportItem[]) {
  if (!transactions || transactions.length === 0) {
    alert('No transaction history available for this buyer.')
    return
  }

  const rows = transactions.map(tx => ({
    'Date': formatNumericDate(tx.date),
    'Type': tx.type === 'sale' ? 'Milk Sale' : 'Payment Received',
    'Litres': tx.litres ? Number(tx.litres) : 0,
    'Price / Liter (Rs.)': tx.rate ? Number(tx.rate) : 0,
    'Total Sale Amount (Rs.)': tx.total ? Number(tx.total) : 0,
    'Amount Paid (Rs.)': tx.paid ? Number(tx.paid) : 0,
    'Outstanding (Rs.)': tx.total ? Number(tx.total - tx.paid) : 0,
    'Notes / Details': tx.notes || ''
  }))

  const totalSales = transactions.reduce((sum, t) => sum + Number(t.total || 0), 0)
  const totalPaid = transactions.reduce((sum, t) => sum + Number(t.paid || 0), 0)
  const totalLitres = transactions.reduce((sum, t) => sum + Number(t.litres || 0), 0)

  rows.push({
    'Date': 'TOTAL SUMMARY',
    'Type': buyerName,
    'Litres': totalLitres,
    'Price / Liter (Rs.)': 0,
    'Total Sale Amount (Rs.)': totalSales,
    'Amount Paid (Rs.)': totalPaid,
    'Outstanding (Rs.)': totalSales - totalPaid,
    'Notes / Details': ''
  })

  const worksheet = XLSX.utils.json_to_sheet(rows)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Buyer Statement')

  const safeName = buyerName.replace(/[^a-zA-Z0-9]/g, '_')
  XLSX.writeFile(workbook, `Statement_${safeName}.xlsx`)
}

export function exportBuyerStatementPDF(buyerName: string, transactions: BuyerTxExportItem[]) {
  if (!transactions || transactions.length === 0) {
    alert('No transaction history available for this buyer.')
    return
  }

  const doc = new jsPDF()

  // Header Banner
  doc.setFillColor(2, 18, 59)
  doc.rect(0, 0, 210, 25, 'F')

  doc.setTextColor(255, 255, 255)
  doc.setFontSize(15)
  doc.setFont('helvetica', 'bold')
  doc.text(`KISAN DAIRY — BUYER STATEMENT (${buyerName.toUpperCase()})`, 14, 16)

  const todayStr = formatNumericDate(new Date())
  doc.setTextColor(50, 50, 50)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(`Buyer: ${buyerName}  |  Generated on: ${todayStr}`, 14, 33)

  const head = [['Date', 'Litres', 'Total Sales', 'Paid', 'Outstanding', 'Notes']]

  const body = transactions.map(tx => [
    formatNumericDate(tx.date),
    tx.litres ? `${tx.litres}L` : '-',
    tx.total ? `Rs. ${tx.total.toLocaleString()}` : '-',
    tx.paid ? `Rs. ${tx.paid.toLocaleString()}` : 'Rs. 0',
    tx.total ? `Rs. ${(tx.total - tx.paid).toLocaleString()}` : '-',
    tx.notes || '-'
  ])

  const totalSales = transactions.reduce((sum, t) => sum + Number(t.total || 0), 0)
  const totalPaid = transactions.reduce((sum, t) => sum + Number(t.paid || 0), 0)
  const totalLitres = transactions.reduce((sum, t) => sum + Number(t.litres || 0), 0)
  const outstanding = totalSales - totalPaid

  const foot = [[
    'TOTAL SUMMARY',
    `${totalLitres.toFixed(1)} L`,
    `Rs. ${totalSales.toLocaleString()}`,
    `Rs. ${totalPaid.toLocaleString()}`,
    `Rs. ${outstanding.toLocaleString()}`,
    ''
  ]]

  autoTable(doc, {
    startY: 38,
    head: head,
    body: body,
    foot: foot,
    theme: 'grid',
    headStyles: { fillColor: [26, 47, 94], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
    footStyles: { fillColor: [0, 191, 166], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
    bodyStyles: { fontSize: 8.5, textColor: [30, 30, 30] },
    alternateRowStyles: { fillColor: [245, 247, 250] },
    margin: { left: 14, right: 14 }
  })

  const safeName = buyerName.replace(/[^a-zA-Z0-9]/g, '_')
  doc.save(`Statement_${safeName}.pdf`)
}
