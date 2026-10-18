/**
 * Registers the service worker and reports when an update is waiting.
 * The page reloads only after the player chooses RELOAD.
 * @param {(apply: () => void) => void} onUpdateReady
 */
export function registerServiceWorker(onUpdateReady) {
  if (!('serviceWorker' in navigator)) return;
  const secure =
    location.protocol === 'https:' ||
    location.hostname === 'localhost' ||
    location.hostname === '127.0.0.1';
  if (!secure) return;
  let wantsReload = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (wantsReload) location.reload();
  });
  /** @param {ServiceWorker} worker */
  const offer = (worker) => {
    onUpdateReady(() => {
      wantsReload = true;
      worker.postMessage('SKIP_WAITING');
    });
  };
  navigator.serviceWorker
    .register('./sw.js')
    .then((reg) => {
      if (reg.waiting && navigator.serviceWorker.controller) offer(reg.waiting);
      reg.addEventListener('updatefound', () => {
        const worker = reg.installing;
        if (!worker) return;
        worker.addEventListener('statechange', () => {
          if (worker.state === 'installed' && navigator.serviceWorker.controller) offer(worker);
        });
      });
    })
    .catch(() => {
      // Offline support is unavailable (e.g. sandboxed preview); the game still runs.
    });
}
