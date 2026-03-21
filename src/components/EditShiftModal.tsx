import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Save, Clock, ArrowRight } from 'lucide-react';
import TimeInput from './TimeInput';

interface EditShiftModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (newRange: string) => void;
  initialRange: string;
}

const EditShiftModal: React.FC<EditShiftModalProps> = ({ isOpen, onClose, onSave, initialRange }) => {
  const [start, setStart] = useState("08:00");
  const [end, setEnd] = useState("10:00");

  useEffect(() => {
    if (isOpen && initialRange.includes('-')) {
      const parts = initialRange.split('-');
      if (parts.length === 2) {
        setStart(parts[0].trim());
        setEnd(parts[1].trim());
      }
    }
  }, [initialRange, isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(`${start} - ${end}`);
    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
      {/* Overlay con desenfoque */}
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full relative z-10 animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
        {/* Cabecera del Modal */}
        <div className="p-4 bg-slate-800 text-white flex justify-between items-center">
          <h3 className="font-bold flex items-center gap-2">
            <Clock size={18} /> Editar Horario
          </h3>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Cuerpo del Modal - Optimizado para que no se desborde */}
        <div className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row items-center gap-2 bg-slate-50 p-3 sm:p-4 rounded-2xl border border-slate-100">
            <TimeInput label="Inicio" value={start} onChange={setStart} />
            
            {/* Flecha responsiva: gira en móviles */}
            <div className="text-slate-300 rotate-90 sm:rotate-0 my-1 sm:my-0 sm:mt-4">
              <ArrowRight size={20} />
            </div>
            
            <TimeInput label="Fin" value={end} onChange={setEnd} />
          </div>
          
          {/* Mensaje Informativo sobre la Jerarquía */}
          <div className="mt-4 flex items-start gap-2 bg-blue-50/50 p-3 rounded-xl border border-blue-100">
            <Clock size={14} className="text-blue-500 mt-0.5 shrink-0" />
            <p className="text-[10px] text-blue-700 leading-tight">
              El sistema reordenará automáticamente este horario en la tabla principal según la hora de inicio.
            </p>
          </div>
        </div>

        {/* Pie del Modal */}
        <div className="p-4 bg-slate-50 flex gap-2 justify-end border-t border-slate-200">
          <button 
            onClick={onClose} 
            className="px-4 py-2 text-sm font-bold text-slate-500 hover:bg-slate-200 rounded-xl transition-colors"
          >
            Cancelar
          </button>
          <button 
            onClick={handleSave}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-md shadow-blue-200 flex items-center gap-2 transition-all active:scale-95"
          >
            <Save size={16} /> Guardar Cambios
          </button>
        </div>
      </div>
    </div>, 
    document.body
  );
};

export default EditShiftModal;