// public/sw.js

// 1. Fuerza la instalación inmediata de cualquier actualización del Service Worker
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

// 2. Toma el control de la aplicación de inmediato
self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

// 3. Recepción de la notificación Push desde Vercel
self.addEventListener('push', function (event) {
  if (!event.data) return;

  let data = {};
  
  try {
    // Parsea el JSON que envías desde api/send-notification.ts
    data = event.data.json();
  } catch (e) {
    data = {
      title: 'Notificación',
      body: event.data.text(),
      icon: '/logo-gestor-de-turnos.png'
    };
  }

  const options = {
    body: data.body,
    icon: data.icon || '/logo-gestor-de-turnos.png',
    vibrate: [300, 100, 300, 100, 300], 
    data: { 
      dateOfArrival: Date.now(),
      url: '/' 
    }
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Alerta de Asistencia', options)
  );
});

// 4. Acción al tocar la notificación
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