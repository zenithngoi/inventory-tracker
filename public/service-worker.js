// This is a simple service worker for caching the app shell
const CACHE_NAME = 'inventory-app-v1';

// Files that make up the App Shell
const APP_SHELL_FILES = [
  '/',
  '/index.html',
  '/favicon.svg',
  '/manifest.json',
  // Add paths to key CSS and JS files that should be cached
];

// Install event
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing Service Worker...', event);
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Caching App Shell');
      return cache.addAll(APP_SHELL_FILES);
    })
  );
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating Service Worker...', event);
  return self.clients.claim();
});

// Fetch event
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // Return the cached response if found
      if (cachedResponse) {
        return cachedResponse;
      }

      // Otherwise, fetch from network
      return fetch(event.request).then((response) => {
        // Don't cache if not a valid response
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }

        // Cache the response for future use
        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return response;
      });
    })
  );
});