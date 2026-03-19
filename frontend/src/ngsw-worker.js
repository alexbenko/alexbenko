/**
 * Service worker kill-switch for neighborhood-harvest.org.
 *
 * The public site does not use a service worker. This file replaces any
 * previously-installed Angular service worker (ngsw-worker.js) so that
 * browsers that cached the old PWA worker stop intercepting requests.
 *
 * How it works:
 *  1. `install` fires immediately (skipWaiting ensures no delay).
 *  2. `activate` unregisters this registration entirely, then navigates
 *     every open window so they reload without any service worker.
 *
 * After this runs once the browser will no longer have any service worker
 * for this origin and neighborhood-harvest.org will behave as a normal site.
 */

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    self.registration
      .unregister()
      .then(() => self.clients.matchAll({ type: 'window' }))
      .then(clients => {
        for (const client of clients) {
          client.navigate(client.url);
        }
      }),
  );
});
