import { openDB, type IDBPDatabase } from 'idb'

const DB_NAME = 'kisan-dairy-offline'
const DB_VERSION = 2 // Bumped to 2 to remove invalid boolean index

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
    upgrade(db, oldVersion, newVersion, transaction) {
      // V1: Initial stores (some had bad boolean indexes)
      if (!db.objectStoreNames.contains(STORE_MILK_SALES)) {
        db.createObjectStore(STORE_MILK_SALES, { keyPath: 'id' })
      }
      if (!db.objectStoreNames.contains(STORE_PAYMENTS)) {
        db.createObjectStore(STORE_PAYMENTS, { keyPath: 'id' })
      }
      if (!db.objectStoreNames.contains(STORE_EXPENSES)) {
        db.createObjectStore(STORE_EXPENSES, { keyPath: 'id' })
      }

      // V2: Remove the 'by-synced' index because IndexedDB doesn't allow booleans as index keys
      if (oldVersion < 2) {
        const stores = [STORE_MILK_SALES, STORE_PAYMENTS, STORE_EXPENSES]
        stores.forEach(storeName => {
          if (db.objectStoreNames.contains(storeName)) {
            const store = transaction.objectStore(storeName)
            if (store.indexNames.contains('by-synced')) {
              store.deleteIndex('by-synced')
            }
          }
        })
      }
    },
  })

  return dbInstance
}

// Generate a simple unique ID
function generateId(): string {
  return `offline_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

// Register background sync
async function registerBackgroundSync() {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.ready
      if ('sync' in registration) {
        // @ts-ignore - TS doesn't have SyncManager types by default
        await registration.sync.register('sync-offline-records')
        console.log('[OfflineDB] Background sync registered')
      }
    } catch (err) {
      console.log('[OfflineDB] Background sync registration failed', err)
    }
  }
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
  await registerBackgroundSync()
  return record
}

export async function getPendingMilkSales(): Promise<PendingMilkSale[]> {
  const db = await getDb()
  const all = await db.getAll(STORE_MILK_SALES)
  // Manually filter because IndexedDB doesn't support boolean indexes
  return (all as PendingMilkSale[]).filter(r => !r.synced)
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
  await registerBackgroundSync()
  return record
}

export async function getPendingPayments(): Promise<PendingPayment[]> {
  const db = await getDb()
  const all = await db.getAll(STORE_PAYMENTS)
  return (all as PendingPayment[]).filter(r => !r.synced)
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
  await registerBackgroundSync()
  return record
}

export async function getPendingExpenses(): Promise<PendingExpense[]> {
  const db = await getDb()
  const all = await db.getAll(STORE_EXPENSES)
  return (all as PendingExpense[]).filter(r => !r.synced)
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
