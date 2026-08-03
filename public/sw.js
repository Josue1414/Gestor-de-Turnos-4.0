// public/sw.js
self.addEventListener('install', (event) => {
  // Obliga al nuevo Service Worker a tomar el control inmediatamente
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  // Reclama el control de todos los clientes (pestañas) abiertos
  event.waitUntil(clients.claim());
});

self.addEventListener('push', function (event) {
  if (!event.data) return;

  let data = {};
  try {
    data = event.data.json();
  } catch (e) {
    data = {
      title: 'Alerta de Asistencia',
      body: event.data.text(),
      icon: '/logo-gestor-de-turnos.png'
    };
  }

  const options = {
    body: data.body || 'Un participante requiere tu asistencia.',
    icon: data.icon || '/logo-gestor-de-turnos.png',
    badge: '/logo-gestor-de-turnos.png', // Crucial para Android (ícono en la barra de notificaciones)
    vibrate: [300, 100, 300, 100, 300], 
    requireInteraction: true, // Fuerza a que la notificación no desaparezca sola
    data: { 
      dateOfArrival: Date.now(), 
      url: data.url || '/' 
    }
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Alerta de Asistencia', options)
  );
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  const urlToOpen = event.notification.data.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(windowClients) {
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});