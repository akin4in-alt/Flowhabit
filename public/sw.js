// HabitFlow service worker
// Minimal implementation: satisfies Chrome's PWA install criteria
// (requires a registered SW with a fetch handler).
// Uses network-first strategy — no offline cache.

const CACHE_NAME = 'habitflow-v1'

self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', event => {
  // Remove outdated caches when a new SW activates
  event.waitUntil(
    caches
      .keys()
      .then(keys =>
        Promise.all(
          keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)),
        ),
      )
      .then(() => clients.claim()),
  )
})

self.addEventListener('fetch', event => {
  // Only handle GET requests; skip cross-origin and non-http(s) URLs
  const { request } = event
  if (
    request.method !== 'GET' ||
    !request.url.startsWith('http')
  ) {
    return
  }

  // Network-first: fall back to cache on failure
  event.respondWith(
    fetch(request)
      .then(response => {
        // Cache successful navigation and static asset responses
        if (
          response.ok &&
          (request.mode === 'navigate' ||
            request.destination === 'style' ||
            request.destination === 'script' ||
            request.destination === 'image')
        ) {
          const clone = response.clone()
          caches.open(CACHE_NAME).then(cache => cache.put(request, clone))
        }
        return response
      })
      .catch(() => caches.match(request)),
  )
})
