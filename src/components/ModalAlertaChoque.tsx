/**
 * RESUMEN: ModalAlertaChoque
 * Alerta estética que se muestra cuando un Admin intenta crear un horario
 * que se empalma (cruza) o repite con otro bloque en cajas normales.
 * Ahora sirve como BLOQUEO ESTRICTO (No permite forzar).
 */

import React from 'react';
import { AlertTriangle, Check } from 'lucide-react';

interface ModalAlertaChoqueProps {
  isOpen: boolean;
  onClose: () => void;
  horarioNuevo: string;
  horarioCruzado: string;
}

const ModalAlertaChoque: React.FC<ModalAlertaChoqueProps> = ({ 
  isOpen, onClose, horarioNuevo, horarioCruzado 
}) => {
  if (!isOpen) return null;

  return (
    // z-[99999] garantiza que saldrá encima del modal de creación de horarios
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-[24px] shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Encabezado Naranja */}
        <div className="bg-orange-500 p-6 flex flex-col items-center justify-center text-white text-center">
          <div className="bg-white/20 p-3 rounded-full mb-3">
            <AlertTriangle size={32} className="text-white" />
          </div>
          <h2 className="text-2xl font-black tracking-tight">Cruce de Horarios</h2>
        </div>
        
        {/* Cuerpo del mensaje */}
        <div className="p-6 text-center bg-white">
          <p className="text-slate-600 text-sm font-medium leading-relaxed mb-4">
            El horario <span className="font-black text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">{horarioNuevo}</span> ya existe o se empalma con un turno normal: <span className="font-black text-red-500 bg-red-50 px-1 py-0.5 rounded">{horarioCruzado}</span>.
          </p>
          <p className="text-slate-500 text-xs font-bold leading-relaxed">
            Si necesitas un horario empalmado o repetido intencionalmente, debes utilizar una <strong className="text-orange-500 bg-orange-50 px-1 py-0.5 rounded">Caja Especial</strong>.
          </p>
        </div>
        
        {/* Botón único de confirmación */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-center">
          <button 
            onClick={onClose} 
            className="w-full py-3 text-white bg-orange-500 rounded-xl text-sm font-black shadow-md hover:bg-orange-600 transition flex justify-center items-center gap-2"
          >
            <Check size={18} /> Entendido
          </button>
        </div>

      </div>
    </div>
  );
};

export default ModalAlertaChoque;