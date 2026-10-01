// InvoiceFlow PWA Service Worker
const CACHE_NAME = 'invoiceflow-cache-v1';
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
  const url = new URL(request.url);

  // Strictly bypass Firebase Auth endpoints, Token refresh, Firestore, and Google API endpoints
  // NEVER cache or intercept identitytoolkit.googleapis.com, securetoken.googleapis.com, or *.firebaseapp.com
  if (
    request.method !== 'GET' ||
    url.hostname === 'identitytoolkit.googleapis.com' ||
    url.hostname === 'securetoken.googleapis.com' ||
    url.hostname.includes('identitytoolkit.googleapis.com') ||
    url.hostname.includes('securetoken.googleapis.com') ||
    url.hostname.includes('firestore.googleapis.com') ||
    url.hostname.includes('firebaseinstallations.googleapis.com') ||
    url.hostname.includes('googleapis.com') ||
    url.hostname.includes('accounts.google.com') ||
    url.hostname.includes('firebaseapp.com') ||
    url.hostname.includes('firebasestorage.app') ||
    url.pathname.includes('/v1/accounts') ||
    url.pathname.includes('/v1/token')
  ) {
    return; // Direct network passthrough (Network Only strategy)
  }

  // Handle CDN / Fonts (CacheFirst)
  if (
    url.origin.includes('fonts.googleapis.com') ||
    url.origin.includes('fonts.gstatic.com') ||
    url.origin.includes('cdnjs.cloudflare.com') ||
    url.origin.includes('cdn.tailwindcss.com')
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
