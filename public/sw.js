'use strict';

const CACHE = 'puppy-pals-v3';
const ASSETS = [
  '/', '/index.html', '/manifest.webmanifest', '/puppy-pals/styles.css', '/puppy-pals/app.js',
  '/puppy-pals/art/icon.svg', '/puppy-pals/art/garden.svg',
  '/puppy-pals/art/icon-192.png', '/puppy-pals/art/icon-512.png', '/puppy-pals/art/apple-touch-icon.png',
  ...Array.from({ length: 16 }, (_, i) => `/puppy-pals/art/dog-${i}.svg`),
];
const assetPaths = new Set(ASSETS);

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(
    keys.filter(key => key.startsWith('puppy-pals-') && key !== CACHE).map(key => caches.delete(key)),
  )).then(() => self.clients.claim()));
});

self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin || url.pathname.startsWith('/api/')) return;
  // A PayPal return/cancellation must reach the live app; never store payment URLs.
  if (url.searchParams.has('payment') || url.searchParams.has('token') || url.searchParams.has('PayerID')) return;
  const isGamePage = request.mode === 'navigate' && ['/', '/index.html'].includes(url.pathname);
  if (!isGamePage && !assetPaths.has(url.pathname)) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    try {
      const response = await fetch(request);
      if (response.ok && response.type === 'basic') {
        await cache.put(isGamePage ? '/' : url.pathname, response.clone());
      }
      return response;
    } catch {
      const cached = await cache.match(isGamePage ? '/' : url.pathname);
      return cached || new Response('Puppy Pals is unavailable offline. Connect once to download the game.', {
        status: 503, headers: { 'content-type': 'text/plain; charset=utf-8' },
      });
    }
  })());
});
