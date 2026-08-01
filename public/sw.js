// public/sw.js
self.addEventListener('push', function (event) {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: data.icon || '/logo-gestor-de-turnos.png',
      vibrate: [300, 100, 300, 100, 300], // Patrón de vibración
      data: { dateOfArrival: Date.now() }
    };

    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});