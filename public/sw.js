// InvoiceFlow PWA Service Worker
const CACHE_NAME = 'invoiceflow-cache-v2';
const BASE_PATH = '/invoiceflow/';

const PRECACHE_ASSETS = [
  BASE_PATH,
  BASE_PATH + 'index.html',
  BASE_PATH + 'manifest.json',
  BASE_PATH + 'pwa-192x192.png',
  BASE_PATH + 'pwa-512x512.png',
  BASE_PATH + 'pwa-maskable-512x512.png',
  BASE_PATH + 'apple-touch-icon.png',
  BASE_PATH + 'icon.svg'
];

// Install Event - Precache critical assets
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn('Precache partial warning:', err);
      });
    })
  );
});

// Activate Event - Clean up stale caches and claim clients immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event - Stale-while-revalidate for local assets & fonts; Network Only for Firebase/Auth
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = request.url;

  // Strictly bypass Service Worker for Firebase Auth token refresh & API calls
  if (
    url.includes('identitytoolkit.googleapis.com') ||
    url.includes('securetoken.googleapis.com') ||
    url.includes('firebaseinstallations.googleapis.com') ||
    url.includes('firestore.googleapis.com') ||
    url.includes('accounts.google.com') ||
    url.includes('firebaseapp.com') ||
    url.includes('googleapis.com') ||
    url.includes('firebasestorage.app')
  ) {
    return; // Let browser fetch directly from network
  }

  // Non-GET requests pass directly to network
  if (request.method !== 'GET') {
    return;
  }

  // Handle CDN / Fonts (CacheFirst)
  if (
    url.includes('fonts.googleapis.com') ||
    url.includes('fonts.gstatic.com') ||
    url.includes('cdnjs.cloudflare.com') ||
    url.includes('cdn.tailwindcss.com')
  ) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(CACHE_NAME);
        const cachedResponse = await cache.match(request);
        if (cachedResponse) return cachedResponse;
        try {
          const networkResponse = await fetch(request);
          if (networkResponse && networkResponse.status === 200) {
            cache.put(request, networkResponse.clone());
          }
          return networkResponse;
        } catch {
          return new Response('Network error', { status: 408 });
        }
      })()
    );
    return;
  }

  // Default Network-First falling back to Cache for navigation and assets
  event.respondWith(
    (async () => {
      try {
        const networkResponse = await fetch(request);
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseToCache = networkResponse.clone();
          const cache = await caches.open(CACHE_NAME);
          cache.put(request, responseToCache);
        }
        return networkResponse;
      } catch {
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
          return cachedResponse;
        }
        // Fallback to index.html for SPA client-side routes
        if (request.mode === 'navigate') {
          const fallback = (await caches.match(BASE_PATH)) || (await caches.match(BASE_PATH + 'index.html'));
          if (fallback) return fallback;
        }
        return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
      }
    })()
  );
});
