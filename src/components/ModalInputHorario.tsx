import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
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
  const [start, setStart] = useState(defaultStart);
  const [end, setEnd] = useState(defaultEnd);

  useEffect(() => {
    if (isOpen) {
      setStart(defaultStart || '08:00');
      setEnd(defaultEnd || '09:00');
    }
  }, [isOpen, defaultStart, defaultEnd]);

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (!start || !end) return;
    onConfirm(start, end);
  };

  return createPortal(
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full relative z-10 overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Cabecera Verde */}
        <div className="p-4 bg-emerald-600 text-white flex justify-between items-center">
          <h3 className="font-bold flex items-center gap-2">
            <Clock size={18} /> Nuevo Horario
          </h3>
          <button onClick={onClose} className="text-emerald-200 hover:text-white transition">
            <X size={20} />
          </button>
        </div>

        {/* Cuerpos de Inputs Nativo (Evita letras) */}
        <div className="p-6">
          <div className="flex flex-col sm:flex-row items-center gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <div className="w-full">
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 text-center">
                Inicio
              </label>
              <input 
                type="time" 
                value={start} 
                onChange={e => setStart(e.target.value)} 
                className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-bold text-slate-700 text-center outline-none focus:border-emerald-500 transition-colors cursor-pointer" 
              />
            </div>
            
            <div className="text-slate-400 rotate-90 sm:rotate-0">
              <ArrowRight size={20}/>
            </div>
            
            <div className="w-full">
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 text-center">
                Fin
              </label>
              <input 
                type="time" 
                value={end} 
                onChange={e => setEnd(e.target.value)} 
                className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-bold text-slate-700 text-center outline-none focus:border-emerald-500 transition-colors cursor-pointer" 
              />
            </div>
          </div>
          <p className="text-[10px] font-bold text-slate-400 mt-4 text-center leading-tight">
            El horario se ajustará automáticamente a formato 12 horas en la tabla con colores indicadores.
          </p>
        </div>

        <div className="p-4 bg-slate-50 flex gap-2 justify-end border-t border-slate-100">
          <button onClick={onClose} className="px-4 py-2 text-sm font-bold text-slate-500 hover:bg-slate-200 rounded-xl transition">
            Cancelar
          </button>
          <button onClick={handleSubmit} className="px-6 py-2 text-sm bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition flex items-center gap-2">
            <Plus size={16}/> Agregar Horario
          </button>
        </div>

      </div>
    </div>,
    document.body
  );
};

export default ModalInputHorario;