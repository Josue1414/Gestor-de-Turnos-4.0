// api/send-notification.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import webpush from 'web-push';

webpush.setVapidDetails(
  'mailto:tu-correo@ejemplo.com',
  process.env.VITE_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const { subscription, title, body } = req.body;

  if (!subscription) {
    return res.status(400).json({ error: 'Falta la suscripción' });
  }

  try {
    const payload = JSON.stringify({
      title: title || 'Alerta de Asistencia',
      body: body || 'Un participante requiere tu ayuda.',
      icon: '/logo-gestor-de-turnos.png'
    });

    await webpush.sendNotification(subscription, payload);
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error enviando push:', error);
    return res.status(500).json({ error: 'Error al enviar notificación' });
  }
}