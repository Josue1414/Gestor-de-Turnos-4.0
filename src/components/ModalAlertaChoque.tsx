/**
 * RESUMEN: ModalAlertaChoque
 * Alerta estética que se muestra cuando un Admin intenta crear un horario
 * que se empalma (cruza) con otro bloque de tiempo ya existente.
 */

import React from 'react';
import { AlertTriangle, Check, X } from 'lucide-react';

interface ModalAlertaChoqueProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  horarioNuevo: string;
  horarioCruzado: string;
}

const ModalAlertaChoque: React.FC<ModalAlertaChoqueProps> = ({ isOpen, onClose, onConfirm, horarioNuevo, horarioCruzado }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="bg-orange-500 p-6 flex flex-col items-center justify-center text-white text-center">
          <div className="bg-white/20 p-3 rounded-full mb-3">
            <AlertTriangle size={32} className="text-orange-50" />
          </div>
          <h2 className="text-xl font-black tracking-tight">Cruce de Horarios</h2>
        </div>
        
        <div className="p-6 text-center">
          <p className="text-slate-600 text-sm font-medium leading-relaxed mb-4">
            El horario <span className="font-black text-slate-800 bg-slate-100 px-1 py-0.5 rounded">{horarioNuevo}</span> se superpone con un turno ya existente: <span className="font-black text-red-500 bg-red-50 px-1 py-0.5 rounded">{horarioCruzado}</span>.
          </p>
          <p className="text-slate-500 text-xs font-bold">¿Deseas forzar la creación de este horario de todas formas?</p>
        </div>

        <div className="p-4 flex gap-3 justify-between bg-slate-50 border-t border-slate-100">
          <button onClick={onClose} className="flex-1 py-2.5 text-slate-600 bg-white border border-slate-200 rounded-xl text-sm font-bold hover:bg-slate-100 transition flex items-center justify-center gap-2">
            <X size={16} /> Cancelar
          </button>
          <button onClick={onConfirm} className="flex-1 py-2.5 text-white bg-orange-500 rounded-xl text-sm font-bold shadow-md shadow-orange-200 hover:bg-orange-600 transition flex items-center justify-center gap-2">
            <Check size={16} /> Sí, Forzar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalAlertaChoque;