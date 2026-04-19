/**
 * RESUMEN: ModalInputHorario
 * Este componente muestra una ventana emergente (modal) para que el administrador
 * ingrese una hora de inicio y una hora de fin al crear un nuevo bloque de turno.
 * Valida la entrada y pre-carga la hora sugerida automáticamente.
 */

import React, { useState } from 'react';
import { X, Clock, Plus, ArrowRight } from 'lucide-react';

interface ModalInputHorarioProps {
  isOpen: boolean;
  onClose: () => void;
  defaultStart: string;
  defaultEnd: string;
  onConfirm: (inicio: string, fin: string) => void;
}

const ModalInputHorario: React.FC<ModalInputHorarioProps> = ({ 
  isOpen, onClose, defaultStart, defaultEnd, onConfirm 
}) => {
  const [inicio, setInicio] = useState(defaultStart);
  const [fin, setFin] = useState(defaultEnd);
  
  // Estado auxiliar para saber si el modal acaba de abrirse
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);

  // SOLUCIÓN VERCEL: En lugar de useEffect, React recomienda actualizar 
  // el estado directamente durante el renderizado si detectamos un cambio.
  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen); // Actualizamos la memoria
    if (isOpen) {
      // Si se acaba de abrir, reiniciamos los valores sugeridos
      setInicio(defaultStart);
      setFin(defaultEnd);
    }
  }

  if (!isOpen) return null;

  const handleSave = () => {
    if (!inicio || !fin) return;
    onConfirm(inicio, fin);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Cabecera */}
        <div className="bg-indigo-600 p-5 flex justify-between items-center text-white">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-xl">
              <Clock size={20} className="text-indigo-50" />
            </div>
            <h2 className="text-lg font-black tracking-tight">Agregar Horario</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-xl transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Cuerpo con Inputs Centrados y Alineados */}
        <div className="p-6">
          <p className="text-slate-500 text-sm font-bold mb-6 text-center">
            Selecciona la hora de inicio y fin. El sistema validará que no se cruce con otros turnos.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 bg-slate-50 p-6 rounded-2xl border border-slate-100">
            <div className="flex flex-col w-full text-center">
              <label className="text-xs font-black text-slate-400 uppercase mb-2 tracking-wider">Inicio</label>
              <input
                type="time"
                value={inicio}
                onChange={(e) => setInicio(e.target.value)}
                className="w-full bg-white border-2 border-slate-200 rounded-xl px-4 py-3 text-center text-xl font-black text-slate-700 outline-none focus:border-indigo-500 transition-colors"
              />
            </div>

            <div className="text-slate-300 rotate-90 sm:rotate-0 flex-shrink-0">
              <ArrowRight size={24} />
            </div>

            <div className="flex flex-col w-full text-center">
              <label className="text-xs font-black text-slate-400 uppercase mb-2 tracking-wider">Fin</label>
              <input
                type="time"
                value={fin}
                onChange={(e) => setFin(e.target.value)}
                className="w-full bg-white border-2 border-slate-200 rounded-xl px-4 py-3 text-center text-xl font-black text-slate-700 outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Pie */}
        <div className="p-4 bg-slate-50 flex gap-3 justify-end border-t border-slate-100">
          <button onClick={onClose} className="px-5 py-2.5 text-slate-600 bg-white border border-slate-200 rounded-xl text-sm font-bold hover:bg-slate-50 transition shadow-sm">
            Cancelar
          </button>
          <button onClick={handleSave} className="px-6 py-2.5 text-white bg-indigo-600 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-indigo-700 shadow-md shadow-indigo-200 transition">
            <Plus size={16} /> Crear Horario
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalInputHorario;