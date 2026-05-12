const SW_URL = `${process.env.PUBLIC_URL}/sw.js`;

export function register() {
  if (process.env.NODE_ENV !== 'production') return;
  if (!('serviceWorker' in navigator)) return;

  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register(SW_URL)
      .then(registration => {
        registration.onupdatefound = () => {
          const installing = registration.installing;
          if (!installing) return;
          installing.onstatechange = () => {
            if (installing.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('[SW] Nova versão disponível. Recarregue para atualizar.');
            }
          };
        };
      })
      .catch(err => console.error('[SW] Falha ao registrar:', err));
  });
}

export function unregister() {
  if (!('serviceWorker' in navigator)) return;
  navigator.serviceWorker.ready
    .then(registration => registration.unregister())
    .catch(err => console.error(err.message));
}
