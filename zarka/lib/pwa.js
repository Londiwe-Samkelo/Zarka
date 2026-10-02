// Registers the service worker (public/sw.js) so the app opens with no internet. Production only, so dev stays simple.
export function registerServiceWorker() {
  if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  }
}
