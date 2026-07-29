import React from 'react';
import { createPortal } from 'react-dom';
import { X, User, Clock, Inbox, MessageCircle, Check, Trash2 } from 'lucide-react';

export interface ContactoWA {
  nombre: string;
  telefono: string;
  rol: string;
}

interface ModalInfoTurnoProps {
  isOpen: boolean;
  onClose: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  turnoData: any;
  countdown: number;
  cajaEntregada?: boolean;
  setCajaEntregada?: (v: boolean) => void;
  cajaDevuelta?: boolean;
  setCajaDevuelta?: (v: boolean) => void;
  onRemove: () => void;
  onSave?: () => void;
  
  // NUEVAS PROPIEDADES PARA EL PARTICIPANTE
  isParticipantView?: boolean;
  contactosWhatsApp?: ContactoWA[];
}

const ModalInfoTurno: React.FC<ModalInfoTurnoProps> = ({
  isOpen, onClose, turnoData, countdown, 
  cajaEntregada, setCajaEntregada, cajaDevuelta, setCajaDevuelta, 
  onRemove, onSave, isParticipantView = false, contactosWhatsApp = []
}) => {
  if (!isOpen || !turnoData) return null;

  const p = turnoData.participante;
  const numeroTelefono = p?.telefono || p?.phone; 
  const codigoPais = (p?.codigoPais || p?.countryCode || '+52').replace('+', '');
  const hasPhone = Boolean(numeroTelefono);
  const waLink = hasPhone ? `https://wa.me/${codigoPais}${numeroTelefono}` : '#';

  return createPortal(
    <div 
      className="fixed inset-0 z-[999999] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-[28px] shadow-2xl w-full max-w-sm overflow-hidden transform transition-all animate-in zoom-in-95"
        onClick={e => e.stopPropagation()} 
      >
        <div className="bg-gradient-to-br from-indigo-600 to-blue-700 p-6 text-white relative">
          <button onClick={onClose} className="absolute top-4 right-4 text-indigo-200 hover:text-white bg-black/10 hover:bg-black/20 p-2 rounded-full transition-colors">
            <X size={18} />
          </button>
          
          <div className="flex items-center gap-4">
            <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-md">
              <User size={28} className="text-white" />
            </div>
            <div>
              <h2 className="text-xl font-black leading-tight truncate pr-4">{p?.nombre || 'Mi Turno'}</h2>
              <p className="text-indigo-200 text-xs font-medium mt-1 flex items-center gap-1.5">
                <Inbox size={12}/> {turnoData.cajaNombre}
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-5">
          <div className="flex items-center justify-between bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Horario</span>
              <span className="text-sm font-bold text-slate-700 flex items-center gap-1">
                <Clock size={14} className="text-blue-500"/> {turnoData.horario}
              </span>
            </div>
            
            {/* Si es Admin, muestra el WhatsApp del participante */}
            {!isParticipantView && (
              <a 
                href={hasPhone ? waLink : undefined}
                target={hasPhone ? "_blank" : undefined}
                rel="noreferrer"
                className={`flex items-center gap-2 px-3 py-2 rounded-xl font-bold text-xs shadow-sm transition-all ${
                  hasPhone 
                    ? 'bg-[#25D366] hover:bg-[#1EBE5D] text-white hover:scale-105' 
                    : 'bg-slate-100 text-slate-400 cursor-not-allowed opacity-60'
                }`}
              >
                <MessageCircle size={16} />
                {hasPhone ? 'Contactar' : 'Sin número'}
              </a>
            )}
          </div>

          {/* VISTA PARTICIPANTE: Muestra WhatsApps de Asistencia */}
          {isParticipantView ? (
            <div className="space-y-3">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2 ml-1">Contacto de Asistencia</h4>
              {contactosWhatsApp && contactosWhatsApp.length > 0 ? (
                contactosWhatsApp.map((contacto, idx) => {
                  const numCln = contacto.telefono.replace(/\D/g, '');
                  const linkWa = numCln ? `https://wa.me/52${numCln}` : '#';
                  const hasContactPhone = Boolean(numCln);
                  
                  return (
                    <div key={idx} className="flex items-center justify-between p-3 rounded-2xl border border-slate-100 bg-white">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-blue-500 uppercase">{contacto.rol}</span>
                        <span className="text-sm font-black text-slate-700">{contacto.nombre}</span>
                      </div>
                      <a 
                        href={hasContactPhone ? linkWa : undefined}
                        target={hasContactPhone ? "_blank" : undefined}
                        rel="noreferrer"
                        className={`p-2.5 rounded-xl transition-all shadow-sm ${hasContactPhone ? 'bg-[#25D366] hover:bg-[#1EBE5D] text-white hover:scale-105' : 'bg-slate-100 text-slate-300 cursor-not-allowed'}`}
                        title={hasContactPhone ? `Contactar a ${contacto.nombre}` : 'Sin número registrado'}
                      >
                        <MessageCircle size={18} />
                      </a>
                    </div>
                  );
                })
              ) : (
                <div className="text-center p-4 border border-dashed border-slate-200 rounded-2xl bg-slate-50">
                  <span className="text-xs text-slate-400 font-bold">No hay contactos de asistencia disponibles.</span>
                </div>
              )}
            </div>
          ) : (
            /* VISTA ADMIN: Muestra Checkboxes */
            <div className="space-y-2">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2 ml-1">Control de Caja</h4>
              <button onClick={() => setCajaEntregada && setCajaEntregada(!cajaEntregada)} className={`w-full flex items-center gap-3 p-3.5 rounded-2xl border-2 transition-all ${cajaEntregada ? 'border-blue-500 bg-blue-50/50' : 'border-slate-100 bg-white hover:border-slate-200'}`}>
                <div className={`p-1 rounded-md transition-colors ${cajaEntregada ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-300'}`}><Check size={16} strokeWidth={3} /></div>
                <span className={`font-bold text-sm ${cajaEntregada ? 'text-blue-900' : 'text-slate-600'}`}>Caja entregada</span>
              </button>

              <button onClick={() => setCajaDevuelta && setCajaDevuelta(!cajaDevuelta)} className={`w-full flex items-center gap-3 p-3.5 rounded-2xl border-2 transition-all ${cajaDevuelta ? 'border-emerald-500 bg-emerald-50/50' : 'border-slate-100 bg-white hover:border-slate-200'}`}>
                <div className={`p-1 rounded-md transition-colors ${cajaDevuelta ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-300'}`}><Check size={16} strokeWidth={3} /></div>
                <span className={`font-bold text-sm ${cajaDevuelta ? 'text-emerald-900' : 'text-slate-600'}`}>Caja devuelta</span>
              </button>
            </div>
          )}
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-3">
          <button disabled={countdown > 0} onClick={onRemove} className={`flex-1 flex flex-col items-center justify-center py-2.5 rounded-xl text-xs font-black transition-all shadow-sm border ${countdown > 0 ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed' : 'bg-red-50 border-red-100 hover:bg-red-500 hover:text-white text-red-600'}`}>
            <Trash2 size={16} className="mb-0.5" />
            {countdown > 0 ? `Espera (${countdown})` : isParticipantView ? 'Liberar turno' : 'Quitar turno'}
          </button>
          
          {isParticipantView ? (
            <button onClick={onClose} className="flex-[1.5] flex items-center justify-center py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-sm font-black shadow-sm transition-transform hover:-translate-y-0.5">
              Cerrar
            </button>
          ) : (
            <button onClick={onSave} className="flex-[1.5] flex items-center justify-center gap-2 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-sm font-black shadow-md transition-transform hover:-translate-y-0.5">
              Guardar cambios
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ModalInfoTurno;