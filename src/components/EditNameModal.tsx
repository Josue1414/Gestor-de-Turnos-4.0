import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Save, Edit3 } from 'lucide-react';
// IMPORTANTE: Importamos nuestro nuevo átomo
import TextInput from './TextInput';

interface EditNameModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (newName: string) => void;
  title: string;
  initialValue: string;
  label: string;
}

const EditNameModal: React.FC<EditNameModalProps> = ({ 
  isOpen, onClose, onSave, title, initialValue, label 
}) => {
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        setValue(initialValue);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [initialValue, isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    if (value.trim()) {
      onSave(value.trim());
      onClose();
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose}></div>
      
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full relative z-10 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-4 bg-slate-800 text-white flex justify-between items-center shrink-0">
          <h3 className="font-bold flex items-center gap-2">
            <Edit3 size={18} className="text-blue-400" /> {title}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">
            {label}
          </label>
          
          {/* ========================================== */}
          {/* AQUÍ ESTAMOS USANDO NUESTRO ÁTOMOTextInput */}
          {/* ========================================== */}
          <TextInput 
            value={value}
            onChange={(e) => setValue(e.target.value)}
            // Lógica para borrar todo el texto
            onClear={() => setValue('')}
            autoFocus
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            placeholder="Escribe el nuevo nombre..."
          />
          {/* ========================================== */}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 flex gap-3 justify-end shrink-0 border-t border-slate-100">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-sm font-bold text-slate-500 hover:bg-slate-200 rounded-xl transition"
          >
            Cancelar
          </button>
          <button 
            onClick={handleSave}
            disabled={!value.trim()} // Deshabilitar si está vacío
            className="px-6 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md shadow-blue-200 flex items-center gap-2 transition disabled:bg-slate-300 disabled:shadow-none"
          >
            <Save size={16} /> Guardar Cambios
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default EditNameModal;