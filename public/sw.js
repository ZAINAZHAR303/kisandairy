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
