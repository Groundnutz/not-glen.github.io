// Minimal service worker — required by Android/Chrome for "Add to Home Screen"
// to offer a real install prompt. Does not cache anything, so the app always
// loads fresh data; it just needs to exist and handle fetch to qualify.
self.addEventListener('install', function(event){
  self.skipWaiting();
});
self.addEventListener('activate', function(event){
  event.waitUntil(self.clients.claim());
});
self.addEventListener('fetch', function(event){
  event.respondWith(fetch(event.request));
});
