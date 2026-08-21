// src/components/EventoFinalizadoScreen.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarX, LogOut, Phone, WifiOff } from 'lucide-react';
import { limpiarSesionLocal } from '../utils/sessionCleanup';

export type MotivoSalida = 'finalizado' | 'sin-acceso' | 'sin-conexion';

interface EventoFinalizadoScreenProps {
  motivo?: MotivoSalida;
  eventoNombre?: string;
  contacto?: { nombre?: string; telefono?: string };
}

const TEXTOS: Record<MotivoSalida, { titulo: string; detalle: string }> = {
  finalizado: {
    titulo: 'Este evento finalizó',
    detalle:
      'El evento ya no está disponible. Si necesitas información sobre tus turnos, contacta a tu supervisor o administrador.',
  },
  'sin-acceso': {
    titulo: 'Tu acceso ya no está disponible',
    detalle:
      'Tu usuario fue retirado de este evento o el enlace dejó de ser válido. Contacta a tu supervisor para que te comparta un nuevo acceso.',
  },
  'sin-conexion': {
    titulo: 'No pudimos cargar el evento',
    detalle:
      'No hay conexión con el servidor o el evento ya no existe. Cierra tu sesión e intenta ingresar de nuevo; si continúa, contacta a tu supervisor.',
  },
};

const EventoFinalizadoScreen: React.FC<EventoFinalizadoScreenProps> = ({
  motivo = 'finalizado',
  eventoNombre,
  contacto,
}) => {
  const navigate = useNavigate();
  const { titulo, detalle } = TEXTOS[motivo];

  const telefonoLimpio = (contacto?.telefono || '').replace(/\D/g, '');

  const handleVolverAlLogin = () => {
    limpiarSesionLocal();
    navigate('/', { replace: true });
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 font-sans relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />

      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden relative z-10 animate-in fade-in zoom-in-95 duration-500">
        <div className="bg-slate-50 p-8 text-center flex flex-col items-center border-b border-slate-100">
          <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mb-4">
            {motivo === 'sin-conexion' ? (
              <WifiOff size={32} className="text-blue-600" />
            ) : (
              <CalendarX size={32} className="text-blue-600" />
            )}
          </div>
          <h1 className="text-xl font-black text-slate-800 tracking-tight uppercase">{titulo}</h1>
          {eventoNombre && (
            <p className="text-[10px] text-slate-400 font-bold mt-2 uppercase tracking-widest">{eventoNombre}</p>
          )}
        </div>

        <div className="p-8">
          <p className="text-sm font-medium text-slate-600 leading-relaxed text-center">{detalle}</p>

          {(contacto?.nombre || telefonoLimpio) && (
            <div className="mt-6 bg-slate-50 border border-slate-200 rounded-2xl p-4 text-center">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tu contacto</p>
              <p className="text-sm font-black text-slate-700 mt-1">{contacto?.nombre || 'Administrador'}</p>
              {telefonoLimpio && (
                <a
                  href={`https://wa.me/${telefonoLimpio}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center justify-center gap-2 text-xs font-black uppercase tracking-wide text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2.5 hover:bg-emerald-100 transition"
                >
                  <Phone size={14} /> Contactar por WhatsApp
                </a>
              )}
            </div>
          )}

          <button
            type="button"
            onClick={handleVolverAlLogin}
            className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-xl font-black transition shadow-lg flex items-center justify-center gap-2 text-sm uppercase tracking-wide"
          >
            <LogOut size={16} /> Cerrar sesión y volver al inicio
          </button>

          <p className="text-[10px] text-slate-400 font-bold text-center mt-3 uppercase tracking-wider">
            Se borrarán los datos de acceso guardados en este dispositivo
          </p>
        </div>
      </div>
    </div>
  );
};

export default EventoFinalizadoScreen;
