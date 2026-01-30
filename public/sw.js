// Service Worker for PWA installation support
const CACHE_NAME = 'taoist-legend-v1';

self.addEventListener('install', (event) => {
  // 强制跳过等待，立即激活
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  // 立即接管所有客户端
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
  // 基础的网络优先策略
  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request);
    })
  );
});
