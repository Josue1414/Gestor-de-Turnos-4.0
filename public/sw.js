// public/sw.js

// 1. Evento que recibe la notificación push
self.addEventListener('push', function (event) {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: data.icon || '/logo-gestor-de-turnos.png',
      // Patrón de vibración más largo y llamativo: [vibra, pausa, vibra, pausa, vibra, pausa, VIBRA LARGO]
      vibrate: [500, 200, 500, 200, 500, 200, 1000], 
      data: { 
        dateOfArrival: Date.now(),
        url: '/' // URL principal de tu app a la que redirigiremos
      }
    };

    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});

// 2. Evento que detecta cuando el usuario hace clic en la notificación
self.addEventListener('notificationclick', function(event) {
  // Cierra la notificación de la barra de estado
  event.notification.close();

  // Obtenemos la URL que guardamos en los datos de la notificación
  const urlToOpen = event.notification.data.url || '/';

  event.waitUntil(
    // Buscamos todas las ventanas/pestañas abiertas del navegador
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(windowClients) {
      
      // Si la app ya está abierta en alguna pestaña, la traemos al frente (focus)
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      
      // Si la app está completamente cerrada, abrimos una nueva ventana/pestaña
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});