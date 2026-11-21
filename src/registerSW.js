if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(() => console.log('FocusToDoPro offline support registered.'))
      .catch((error) => console.error('Service Worker registration failed:', error));
  });
}