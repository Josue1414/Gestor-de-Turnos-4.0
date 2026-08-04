// src/components/ModalPedirAyuda.tsx
import React from 'react';
import { X, MessageCircle, LifeBuoy, AlertTriangle, ShieldCheck, BellOff } from 'lucide-react';

export interface ContactoAyuda {
  nombre: string;
  telefono: string;
  rol: string;
}

interface ModalPedirAyudaProps {
  isOpen: boolean;
  onClose: () => void;
  contactos: ContactoAyuda[];
  alertaActiva: boolean;
  tipoAlertaActiva?: 'asistencia' | 'peligro' | null;
  onSolicitar: (tipo: 'asistencia' | 'peligro') => void;
  onCancelar: () => void;
}

const ModalPedirAyuda: React.FC<ModalPedirAyudaProps> = ({
  isOpen, onClose, contactos, alertaActiva, tipoAlertaActiva, onSolicitar, onCancelar
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 sm:p-6 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
        
        {/* ENCABEZADO */}
        <div className="bg-slate-900 p-5 flex items-center justify-between">
          <div className="flex items-center gap-3 text-white">
            <ShieldCheck size={28} className="text-blue-400" />
            <h2 className="text-xl font-black tracking-tight">Centro de Ayuda</h2>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 flex flex-col gap-8">
          
          {/* SECCIÓN 1: CONTACTOS DIRECTOS DE WHATSAPP */}
          <div className="space-y-3">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest text-center">Contactar Directamente</h3>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              {contactos.map((contacto, i) => (
                <a 
                  key={i}
                  href={`https://wa.me/${contacto.telefono.replace(/\D/g, '')}`}
                  target="_blank" 
                  rel="noreferrer"
                  className="flex-1 bg-[#25D366] hover:bg-[#20bd5a] text-white p-3 rounded-2xl flex items-center justify-center gap-3 font-bold transition shadow-sm"
                >
                  <MessageCircle size={24} />
                  <div className="flex flex-col items-start text-left leading-tight">
                    <span className="text-[10px] opacity-90 uppercase tracking-wide">{contacto.rol}</span>
                    <span className="text-sm truncate max-w-[120px]">{contacto.nombre}</span>
                  </div>
                </a>
              ))}
            </div>
            {contactos.length === 0 && (
               <p className="text-center text-sm text-slate-500 italic">No hay números de contacto configurados.</p>
            )}
          </div>

          <div className="w-full h-px bg-slate-100"></div>

          {/* SECCIÓN 2: BOTONES DE ALERTA AL SISTEMA */}
          <div className="space-y-4">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest text-center">Alerta Inmediata al Sistema</h3>
            
            {alertaActiva ? (
              <div className={`border-2 rounded-3xl p-6 text-center flex flex-col items-center gap-4 ${tipoAlertaActiva === 'peligro' ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-200'}`}>
                <div className={`w-16 h-16 rounded-full flex items-center justify-center animate-pulse ${tipoAlertaActiva === 'peligro' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                  {tipoAlertaActiva === 'peligro' ? <AlertTriangle size={32} /> : <LifeBuoy size={32} />}
                </div>
                <div>
                  <h4 className={`font-black text-lg ${tipoAlertaActiva === 'peligro' ? 'text-red-700' : 'text-blue-700'}`}>
                    {tipoAlertaActiva === 'peligro' ? 'Emergencia Reportada' : 'Asistencia Solicitada'}
                  </h4>
                  <p className={`text-sm font-medium mt-1 ${tipoAlertaActiva === 'peligro' ? 'text-red-600/80' : 'text-blue-600/80'}`}>
                    Los organizadores han sido notificados y verán tu alerta en el mapa.
                  </p>
                </div>
                <button 
                  onClick={onCancelar}
                  className="mt-4 w-full py-4 bg-white border-2 border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300 rounded-2xl font-black flex items-center justify-center gap-2 transition"
                >
                  <BellOff size={20} /> Cancelar Alerta
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-6">
                {/* BOTÓN AZUL - ASISTENCIA */}
                <button 
                  onClick={() => onSolicitar('asistencia')}
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white p-5 rounded-3xl flex items-center gap-4 transition shadow-lg shadow-blue-500/30 group"
                >
                  <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <LifeBuoy size={28} />
                  </div>
                  <div className="text-left flex-1">
                    <h4 className="font-black text-xl leading-none mb-1">Pedir Asistencia</h4>
                    <p className="text-blue-100 text-sm font-medium leading-tight">Dudas, material faltante, relevo o apoyo general.</p>
                  </div>
                </button>

                {/* BOTÓN ROJO - PELIGRO */}
                <button 
                  onClick={() => onSolicitar('peligro')}
                  className="w-full bg-red-600 hover:bg-red-700 text-white p-5 rounded-3xl flex items-center gap-4 transition shadow-lg shadow-red-600/30 group"
                >
                  <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <AlertTriangle size={28} />
                  </div>
                  <div className="text-left flex-1">
                    <h4 className="font-black text-xl leading-none mb-1">Emergencia / Peligro</h4>
                    <p className="text-red-100 text-sm font-medium leading-tight">Urgencia médica, de seguridad o situación crítica.</p>
                  </div>
                </button>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default ModalPedirAyuda;