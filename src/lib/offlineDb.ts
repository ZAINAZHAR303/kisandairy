import { openDB, type IDBPDatabase } from 'idb'

const DB_NAME = 'kisan-dairy-offline'
const DB_VERSION = 1

// Store names
const STORE_MILK_SALES = 'pendingMilkSales'
const STORE_PAYMENTS = 'pendingPayments'
const STORE_EXPENSES = 'pendingExpenses'

// Types for offline records
export interface PendingMilkSale {
  id: string
  seller_id: string
  date: string
  morning_liters: number
  evening_liters: number
  rate_per_liter: number
  notes: string
  createdAt: number
  synced: boolean
}

export interface PendingPayment {
  id: string
  seller_id: string
  date: string
  amount_paid: number
  notes: string
  createdAt: number
  synced: boolean
}

export interface PendingExpense {
  id: string
  category: string
  amount: number
  date: string
  description: string
  createdAt: number
  synced: boolean
}

let dbInstance: IDBPDatabase | null = null

async function getDb(): Promise<IDBPDatabase> {
  if (dbInstance) return dbInstance

  dbInstance = await openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Milk Sales store
      if (!db.objectStoreNames.contains(STORE_MILK_SALES)) {
        const store = db.createObjectStore(STORE_MILK_SALES, { keyPath: 'id' })
        store.createIndex('by-synced', 'synced')
      }
      // Payments store
      if (!db.objectStoreNames.contains(STORE_PAYMENTS)) {
        const store = db.createObjectStore(STORE_PAYMENTS, { keyPath: 'id' })
        store.createIndex('by-synced', 'synced')
      }
      // Expenses store
      if (!db.objectStoreNames.contains(STORE_EXPENSES)) {
        const store = db.createObjectStore(STORE_EXPENSES, { keyPath: 'id' })
        store.createIndex('by-synced', 'synced')
      }
    },
  })

  return dbInstance
}

// Generate a simple unique ID
function generateId(): string {
  return `offline_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

// =================== Milk Sales ===================

export async function savePendingMilkSale(data: {
  seller_id: string
  date: string
  morning_liters: number
  evening_liters: number
  rate_per_liter: number
  notes: string
}): Promise<PendingMilkSale> {
  const db = await getDb()
  const record: PendingMilkSale = {
    id: generateId(),
    ...data,
    createdAt: Date.now(),
    synced: false,
  }
  await db.put(STORE_MILK_SALES, record)
  if (typeof window !== 'undefined') window.dispatchEvent(new Event('offlineSync'))
  return record
}

export async function getPendingMilkSales(): Promise<PendingMilkSale[]> {
  const db = await getDb()
  // @ts-ignore - IDBValidKey type mismatch with boolean in idb types
  const all = await db.getAllFromIndex(STORE_MILK_SALES, 'by-synced', false)
  return all as PendingMilkSale[]
}

export async function removePendingMilkSale(id: string): Promise<void> {
  const db = await getDb()
  await db.delete(STORE_MILK_SALES, id)
  if (typeof window !== 'undefined') window.dispatchEvent(new Event('offlineSync'))
}

// =================== Payments ===================

export async function savePendingPayment(data: {
  seller_id: string
  date: string
  amount_paid: number
  notes: string
}): Promise<PendingPayment> {
  const db = await getDb()
  const record: PendingPayment = {
    id: generateId(),
    ...data,
    createdAt: Date.now(),
    synced: false,
  }
  await db.put(STORE_PAYMENTS, record)
  if (typeof window !== 'undefined') window.dispatchEvent(new Event('offlineSync'))
  return record
}

export async function getPendingPayments(): Promise<PendingPayment[]> {
  const db = await getDb()
  // @ts-ignore - IDBValidKey type mismatch with boolean in idb types
  const all = await db.getAllFromIndex(STORE_PAYMENTS, 'by-synced', false)
  return all as PendingPayment[]
}

export async function removePendingPayment(id: string): Promise<void> {
  const db = await getDb()
  await db.delete(STORE_PAYMENTS, id)
  if (typeof window !== 'undefined') window.dispatchEvent(new Event('offlineSync'))
}

// =================== Expenses ===================

export async function savePendingExpense(data: {
  category: string
  amount: number
  date: string
  description: string
}): Promise<PendingExpense> {
  const db = await getDb()
  const record: PendingExpense = {
    id: generateId(),
    ...data,
    createdAt: Date.now(),
    synced: false,
  }
  await db.put(STORE_EXPENSES, record)
  if (typeof window !== 'undefined') window.dispatchEvent(new Event('offlineSync'))
  return record
}

export async function getPendingExpenses(): Promise<PendingExpense[]> {
  const db = await getDb()
  // @ts-ignore - IDBValidKey type mismatch with boolean in idb types
  const all = await db.getAllFromIndex(STORE_EXPENSES, 'by-synced', false)
  return all as PendingExpense[]
}

export async function removePendingExpense(id: string): Promise<void> {
  const db = await getDb()
  await db.delete(STORE_EXPENSES, id)
  if (typeof window !== 'undefined') window.dispatchEvent(new Event('offlineSync'))
}

// =================== Utility ===================

export async function getPendingCount(): Promise<number> {
  try {
    const db = await getDb()
    const sales = await db.getAll(STORE_MILK_SALES)
    const payments = await db.getAll(STORE_PAYMENTS)
    const expenses = await db.getAll(STORE_EXPENSES)

    const unsyncedSales = (sales as PendingMilkSale[]).filter(r => !r.synced).length
    const unsyncedPayments = (payments as PendingPayment[]).filter(r => !r.synced).length
    const unsyncedExpenses = (expenses as PendingExpense[]).filter(r => !r.synced).length

    return unsyncedSales + unsyncedPayments + unsyncedExpenses
  } catch {
    return 0
  }
}

export async function clearAllPendingRecords(): Promise<void> {
  const db = await getDb()
  await db.clear(STORE_MILK_SALES)
  await db.clear(STORE_PAYMENTS)
  await db.clear(STORE_EXPENSES)
  if (typeof window !== 'undefined') window.dispatchEvent(new Event('offlineSync'))
}
