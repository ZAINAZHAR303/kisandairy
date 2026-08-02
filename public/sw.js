// Kisan Dairy — Service Worker for Offline PWA Support
const CACHE_NAME = 'kisan-dairy-v1'
const OFFLINE_URL = '/offline'

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

// Install Event — Pre-cache essential files
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Pre-caching app shell')
      // Use addAll with catch to handle any failing URLs gracefully
      return cache.addAll(PRECACHE_URLS).catch((err) => {
        console.warn('[SW] Some URLs failed to pre-cache:', err)
      })
    })
  )
  // Activate immediately without waiting
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
  // Take control of all pages immediately
  self.clients.claim()
})

// Fetch Event — Network-first for API calls, Cache-first for static assets
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET requests (POST/PUT/DELETE for server actions)
  if (request.method !== 'GET') return

  // Skip Supabase API calls and auth endpoints — always go to network
  if (
    url.hostname.includes('supabase') ||
    url.pathname.startsWith('/auth') ||
    url.pathname.includes('/_next/data')
  ) {
    return
  }

  // For Next.js static assets (_next/static) — Cache-first
  if (url.pathname.startsWith('/_next/static')) {
    event.respondWith(
      caches.match(request).then((cached) => {
        return cached || fetch(request).then((response) => {
          if (response.ok) {
            const responseClone = response.clone()
            caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone))
          }
          return response
        })
      })
    )
    return
  }

  // For page navigations — Network-first with cache fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache the successful response
          if (response.ok) {
            const responseClone = response.clone()
            caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone))
          }
          return response
        })
        .catch(() => {
          // Offline — serve from cache
          return caches.match(request).then((cached) => {
            return cached || caches.match('/dashboard')
          })
        })
    )
    return
  }

  // For other static assets (images, fonts, CSS) — Stale-while-revalidate
  event.respondWith(
    caches.match(request).then((cached) => {
      const fetchPromise = fetch(request)
        .then((response) => {
          if (response.ok) {
            const responseClone = response.clone()
            caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone))
          }
          return response
        })
        .catch(() => cached)

      return cached || fetchPromise
    })
  )
})

// Listen for messages from the app
self.addEventListener('message', (event) => {
  if (event.data === 'skipWaiting') {
    self.skipWaiting()
  }
})
