/**
 * Registers the PWA Service Worker for offline capabilities and install prompts
 */
export function registerServiceWorker() {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      const swUrl = '/invoiceflow/sw.js';
      navigator.serviceWorker
        .register(swUrl, { scope: '/invoiceflow/' })
        .then((registration) => {
          console.log('InvoiceFlow Service Worker registered successfully with scope:', registration.scope);

          registration.onupdatefound = () => {
            const installingWorker = registration.installing;
            if (installingWorker) {
              installingWorker.onstatechange = () => {
                if (installingWorker.state === 'installed') {
                  if (navigator.serviceWorker.controller) {
                    console.log('New InvoiceFlow version available; please refresh.');
                  } else {
                    console.log('InvoiceFlow is now cached for offline use.');
                  }
                }
              };
            }
          };
        })
        .catch((error) => {
          // Fallback to relative sw.js if base path differs in preview/dev
          navigator.serviceWorker
            .register('./sw.js')
            .catch((fallbackErr) => {
              console.warn('Service Worker registration skipped:', fallbackErr || error);
            });
        });
    });
  }
}
