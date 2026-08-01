// src/utils/pushNotifications.ts
const PUBLIC_VAPID_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;

export const suscribirANotificaciones = async () => {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.warn('Este navegador no soporta notificaciones push.');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js');
    const permission = await Notification.requestPermission();

    if (permission !== 'granted') {
      console.log('Permiso de notificaciones denegado.');
      return null;
    }

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(PUBLIC_VAPID_KEY)
    });

    return subscription;
  } catch (error) {
    console.error('Error al suscribir a push:', error);
    return null;
  }
};

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export const enviarAlertaVercel = async (subscription: object, nombreParticipante: string, caja: string) => {
  try {
    await fetch('/api/send-notification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subscription,
        title: '🚨 Asistencia Solicitada',
        body: `${nombreParticipante} necesita ayuda en la ${caja}`
      })
    });
  } catch (error) {
    console.error('Error enviando la alerta:', error);
  }
};

// Agrega esta función al final de tu archivo src/utils/pushNotifications.ts

export const verificarSuscripcion = async (): Promise<boolean> => {
  // Verificamos si el navegador soporta notificaciones
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    return false;
  }

  try {
    // Esperamos a que el Service Worker esté listo
    const registration = await navigator.serviceWorker.ready;
    // Preguntamos si ya existe una suscripción vigente
    const subscription = await registration.pushManager.getSubscription();
    
    // Si subscription tiene datos, retorna true, de lo contrario false
    return subscription !== null;
  } catch (error) {
    console.error('Error al verificar la suscripción push:', error);
    return false;
  }
};