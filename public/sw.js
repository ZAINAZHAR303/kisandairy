// Kisan Dairy — Service Worker for Offline PWA Support
const CACHE_NAME = 'kisan-dairy-v2'

// Static assets to pre-cache on install
const PRECACHE_URLS = [
  '/',
  '/dashboard',
  '/login',
  '/icon-192.png',
  '/icon-512.png',
  '/logo.png',
  '/favicon.ico',
  '/manifest.json',
]

// Only cache http/https requests — skip chrome-extension, data, blob etc.
function isCacheable(request) {
  const url = new URL(request.url)
  return url.protocol === 'http:' || url.protocol === 'https:'
}

// Install Event — Pre-cache essential files
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Pre-caching app shell')
      return cache.addAll(PRECACHE_URLS).catch((err) => {
        console.warn('[SW] Some URLs failed to pre-cache:', err)
      })
    })
  )
  self.skipWaiting()
})

// Activate Event — Clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => {
            console.log('[SW] Deleting old cache:', name)
            return caches.delete(name)
          })
      )
    })
  )
  self.clients.claim()
})

// Fetch Event
self.addEventListener('fetch', (event) => {
  const { request } = event

  // Skip non-GET requests (POST/PUT/DELETE for server actions)
  if (request.method !== 'GET') return

  // Skip non http/https requests (chrome-extension://, data:, blob: etc.)
  if (!isCacheable(request)) return

  const url = new URL(request.url)

  // Skip Supabase API calls — always go to network
  if (url.hostname.includes('supabase')) return

  // Skip Next.js internal data routes
  if (url.pathname.includes('/_next/data')) return

  // For Next.js static assets (_next/static) — Cache-first
  if (url.pathname.startsWith('/_next/static')) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached
        return fetch(request).then((response) => {
          if (response && response.ok && isCacheable(request)) {
            const responseClone = response.clone()
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone).catch(() => {})
            })
          }
          return response
        }).catch(() => cached || new Response('', { status: 503 }))
      })
    )
    return
  }

  // For page navigations — Network-first with cache fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.ok && isCacheable(request)) {
            const responseClone = response.clone()
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone).catch(() => {})
            })
          }
          return response
        })
        .catch(() => {
          // Offline — try cache, then fallback to dashboard cache
          return caches.match(request).then((cached) => {
            return cached || caches.match('/dashboard') || new Response(
              '<h1>You are offline</h1><p>Please check your connection.</p>',
              { status: 503, headers: { 'Content-Type': 'text/html' } }
            )
          })
        })
    )
    return
  }

  // For other static assets (images, fonts) — Stale-while-revalidate
  if (isCacheable(request)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        const fetchPromise = fetch(request)
          .then((response) => {
            if (response && response.ok && isCacheable(request)) {
              const responseClone = response.clone()
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(request, responseClone).catch(() => {})
              })
            }
            return response
          })
          .catch(() => cached || new Response('', { status: 503 }))

        return cached || fetchPromise
      })
    )
  }
})

// Listen for messages from the app
self.addEventListener('message', (event) => {
  if (event.data === 'skipWaiting') {
    self.skipWaiting()
  }
})

// ==========================================
// BACKGROUND SYNC LOGIC
// ==========================================

// Must match SYNC_LOCK_NAME in src/lib/syncManager.ts. The page and the
// service worker both sync the same queue; this lock stops them from sending
// the same record at the same time (which would create duplicates).
const SYNC_LOCK_NAME = 'kisan-dairy-offline-sync'

// Helper to interact with IndexedDB directly
function openIDB() {
  return new Promise((resolve, reject) => {
    // No version number: open whatever version the app created. Asking for a
    // fixed version fails with VersionError as soon as the app upgrades the DB.
    const request = indexedDB.open('kisan-dairy-offline')
    request.onerror = () => reject(request.error)
    request.onsuccess = () => {
      const db = request.result
      // Never block the app from upgrading the database.
      db.onversionchange = () => db.close()
      resolve(db)
    }
  })
}

function getStoreData(db, storeName) {
  return new Promise((resolve, reject) => {
    if (!db.objectStoreNames.contains(storeName)) return resolve([])
    const tx = db.transaction(storeName, 'readonly')
    const store = tx.objectStore(storeName)
    const request = store.getAll()
    request.onerror = () => reject(request.error)
    request.onsuccess = () => {
      // Filter for only unsynced records
      const unsynced = (request.result || []).filter(r => !r.synced)
      resolve(unsynced)
    }
  })
}

function deleteStoreData(db, storeName, id) {
  return new Promise((resolve, reject) => {
    if (!db.objectStoreNames.contains(storeName)) return resolve()
    const tx = db.transaction(storeName, 'readwrite')
    const store = tx.objectStore(storeName)
    const request = store.delete(id)
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve()
  })
}

self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-offline-records') {
    console.log('[SW] Background sync triggered')
    event.waitUntil(syncOfflineDataLocked())
  }
})

function syncOfflineDataLocked() {
  if (self.navigator && self.navigator.locks) {
    return self.navigator.locks.request(SYNC_LOCK_NAME, () => syncOfflineData())
  }
  return syncOfflineData()
}

async function syncOfflineData() {
  let db
  try {
    db = await openIDB()

    // Read the queue only after the lock is held, so records the page has
    // already synced (and removed) are not sent again.
    const milkSales = await getStoreData(db, 'pendingMilkSales')
    const payments = await getStoreData(db, 'pendingPayments')
    const expenses = await getStoreData(db, 'pendingExpenses')

    const total = milkSales.length + payments.length + expenses.length
    if (total === 0) {
      console.log('[SW] No offline data to sync.')
      return
    }

    console.log('[SW] Syncing ' + total + ' offline record(s) to server...')

    const response = await fetch('/api/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ milkSales, payments, expenses })
    })

    if (!response.ok) {
      throw new Error('Sync API returned ' + response.status)
    }

    const result = await response.json()
    console.log('[SW] Sync result:', result)

    // Delete ONLY the records the server confirmed it saved. Anything that
    // failed stays on the device and is retried later.
    const syncedIds = (result && result.syncedIds) || {}
    for (const id of syncedIds.milkSales || []) await deleteStoreData(db, 'pendingMilkSales', id)
    for (const id of syncedIds.payments || []) await deleteStoreData(db, 'pendingPayments', id)
    for (const id of syncedIds.expenses || []) await deleteStoreData(db, 'pendingExpenses', id)

    const synced =
      (syncedIds.milkSales || []).length +
      (syncedIds.payments || []).length +
      (syncedIds.expenses || []).length
    const failed = total - synced

    // Notify clients to update UI
    const clients = await self.clients.matchAll()
    clients.forEach(client => client.postMessage({ type: 'SYNC_COMPLETE', synced, failed }))

    if (failed > 0) {
      throw new Error(failed + ' offline record(s) could not be synced')
    }
  } catch (error) {
    console.error('[SW] Background sync failed:', error)
    throw error // Re-throw so the browser can retry later
  } finally {
    if (db) db.close()
  }
}
