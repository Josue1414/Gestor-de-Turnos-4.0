// src/components/ModalPedirAyuda.tsx
import React from 'react';
import { X, MessageCircle, ShieldCheck, BellOff } from 'lucide-react';

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
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300 border border-slate-100">
        
        {/* ENCABEZADO ELEGANTE */}
        <div className="bg-white p-4 sm:p-5 flex items-center justify-between border-b border-slate-100">
          <div className="flex items-center gap-2.5 text-slate-800">
            <ShieldCheck size={24} className="text-indigo-600" />
            <h2 className="text-lg font-black tracking-tight">Centro de Ayuda</h2>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition">
            <X size={20} />
          </button>
        </div>

        <div className="p-5 sm:p-6 flex flex-col gap-6">
          
          {/* SECCIÓN 1: CONTACTOS DIRECTOS DE WHATSAPP (LISTA) */}
          <div className="space-y-3">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Contactar Directamente</h3>
            
            <div className="flex flex-col gap-2">
              {contactos.map((contacto, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-2xl border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-colors">
                  <div className="flex flex-col text-left leading-tight truncate pr-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">{contacto.rol}</span>
                    <span className="text-sm font-black text-slate-700 truncate">{contacto.nombre}</span>
                  </div>
                  <a 
                    href={`https://wa.me/${contacto.telefono.replace(/\D/g, '')}`}
                    target="_blank" 
                    rel="noreferrer"
                    className="shrink-0 bg-[#25D366] hover:bg-[#20bd5a] text-white px-3 sm:px-4 py-2 rounded-xl flex items-center gap-2 text-xs font-bold transition shadow-sm"
                  >
                    <MessageCircle size={16} />
                    <span className="hidden sm:inline">WhatsApp</span>
                  </a>
                </div>
              ))}
              
              {contactos.length === 0 && (
                <div className="text-center p-4 border border-dashed border-slate-200 rounded-2xl bg-slate-50">
                  <p className="text-xs text-slate-500 font-bold">No hay números de contacto configurados.</p>
                </div>
              )}
            </div>
          </div>

          <div className="w-full h-px bg-slate-100"></div>

          {/* SECCIÓN 2: BOTONES DE ALERTA AL SISTEMA */}
          <div className="space-y-3">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Alerta Inmediata al Mapa</h3>
            
            {alertaActiva ? (
              <div className={`border rounded-2xl p-5 text-center flex flex-col items-center gap-3 shadow-sm ${tipoAlertaActiva === 'peligro' ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-200'}`}>
                <div className="text-4xl animate-bounce mb-1">
                  {tipoAlertaActiva === 'peligro' ? '🚨' : '✋'}
                </div>
                <div>
                  <h4 className={`font-black text-base sm:text-lg leading-tight ${tipoAlertaActiva === 'peligro' ? 'text-red-700' : 'text-blue-700'}`}>
                    {tipoAlertaActiva === 'peligro' ? 'Emergencia Reportada' : 'Asistencia Solicitada'}
                  </h4>
                  <p className={`text-xs font-bold mt-1.5 ${tipoAlertaActiva === 'peligro' ? 'text-red-600/80' : 'text-blue-600/80'}`}>
                    Los organizadores han sido notificados y verán tu alerta en el mapa.
                  </p>
                </div>
                <button 
                  onClick={onCancelar}
                  className={`mt-2 px-5 py-2.5 bg-white border text-xs rounded-xl font-black flex items-center justify-center gap-2 transition shadow-sm ${tipoAlertaActiva === 'peligro' ? 'border-red-200 text-red-600 hover:bg-red-100' : 'border-blue-200 text-blue-600 hover:bg-blue-100'}`}
                >
                  <BellOff size={16} /> Cancelar Alerta
                </button>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row gap-3">

                {/* BOTÓN ROJO - PELIGRO */}
                <button 
                  onClick={() => onSolicitar('peligro')}
                  className="flex-1 bg-white border border-slate-200 hover:border-red-300 hover:bg-red-50 p-4 rounded-2xl flex items-start gap-3 transition shadow-sm group"
                >
                  <div className="shrink-0 p-2.5 bg-slate-100 group-hover:bg-red-100 rounded-xl transition-colors">
                    <span className="text-xl leading-none block">🚨</span>
                  </div>
                  <div className="text-left flex-1">
                    <h4 className="font-black text-sm text-slate-800 group-hover:text-red-900 transition-colors">Emergencia</h4>
                    <p className="text-[11px] text-slate-500 group-hover:text-red-700/80 font-bold mt-0.5 leading-tight">Situación crítica o de seguridad.</p>
                  </div>
                </button>
                
                {/* BOTÓN AZUL - ASISTENCIA */}
                <button 
                  onClick={() => onSolicitar('asistencia')}
                  className="flex-1 bg-white border border-slate-200 hover:border-blue-300 hover:bg-blue-50 p-4 rounded-2xl flex items-start gap-3 transition shadow-sm group"
                >
                  <div className="shrink-0 p-2.5 bg-slate-100 group-hover:bg-blue-100 rounded-xl transition-colors">
                    <span className="text-xl leading-none block">✋</span>
                  </div>
                  <div className="text-left flex-1">
                    <h4 className="font-black text-sm text-slate-800 group-hover:text-blue-900 transition-colors">Pedir Asistencia</h4>
                    <p className="text-[11px] text-slate-500 group-hover:text-blue-700/80 font-bold mt-0.5 leading-tight">Apoyo general. No crítico.</p>
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