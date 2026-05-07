/* Service Worker — agenda_ios — cache-first offline PWA
   Base: /agenda_ios/
   Estrategia:
     - install: precachea el shell (HTML + manifest + icono)
     - fetch navigate: siempre sirve el shell desde caché (SPA offline)
     - fetch assets: cache-first; si falla red, usa caché; guarda respuestas nuevas
     - activate: limpia cachés antiguas y reclama clientes de inmediato
*/

const CACHE_NAME = 'agenda-v7'
const BASE = '/agenda_ios'

const PRECACHE_URLS = [
  BASE + '/',
  BASE + '/index.html',
  BASE + '/manifest.json',
  BASE + '/icon.svg',
]

// ─── INSTALL ────────────────────────────────────────────────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())  // activa inmediatamente sin esperar cierre de tabs
  )
})

// ─── ACTIVATE ───────────────────────────────────────────────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(k => k !== CACHE_NAME)
          .map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim()) // toma control de todos los tabs abiertos
      .then(() => {
        // Notificar a todos los clientes que hay una nueva versión
        return self.clients.matchAll().then(clients => {
          clients.forEach(client => {
            client.postMessage({ type: 'SW_UPDATED' })
          })
        })
      })
  )
})

// ─── FETCH ──────────────────────────────────────────────────────────────────
self.addEventListener('fetch', event => {
  const { request } = event
  const url = new URL(request.url)

  // Solo interceptar GET y peticiones del mismo origen
  if (request.method !== 'GET') return
  if (url.origin !== self.location.origin) return

  // Navegación (SPA): siempre sirve el shell desde caché para funcionar offline
  if (request.mode === 'navigate') {
    event.respondWith(
      caches.match(BASE + '/index.html').then(cached =>
        cached || fetch(request).then(res => {
          // Guarda el index.html por si acaso no estaba cacheado aún
          const clone = res.clone()
          caches.open(CACHE_NAME).then(c => c.put(BASE + '/index.html', clone))
          return res
        })
      )
    )
    return
  }

  // Recursos estáticos (JS/CSS/imágenes): cache-first, red como fallback
  event.respondWith(
    caches.match(request).then(cached => {
      if (cached) return cached

      return fetch(request)
        .then(response => {
          // Solo cachear respuestas válidas
          if (!response || !response.ok || response.type === 'opaque') {
            return response
          }
          const clone = response.clone()
          caches.open(CACHE_NAME).then(c => c.put(request, clone))
          return response
        })
        .catch(() => {
          // Si el recurso no está en caché y no hay red, para HTML sirve el shell
          if (request.headers.get('Accept') && request.headers.get('Accept').includes('text/html')) {
            return caches.match(BASE + '/index.html')
          }
        })
    })
  )
})
