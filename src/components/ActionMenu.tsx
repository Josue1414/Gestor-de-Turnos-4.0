import React, { useState, useRef, useEffect } from 'react';
import { MoreVertical, Edit2, Trash2 } from 'lucide-react';

interface ActionMenuProps {
  onEdit: () => void;
  onDelete: () => void;
  direccion?: 'derecha' | 'abajo';
  tituloEliminar?: string;
  mensajeEliminar?: string;
}

const ActionMenu: React.FC<ActionMenuProps> = ({ onEdit, onDelete, direccion = 'abajo' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Cerrar al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-1.5 hover:bg-slate-500/50 rounded-lg transition-colors border border-slate-400/30"
      >
        <MoreVertical size={16} className="text-slate-300" />
      </button>

      {isOpen && (
        <div 
          className={`absolute z-[100] w-40 bg-white rounded-xl shadow-2xl border border-slate-100 py-1 overflow-hidden
            ${direccion === 'derecha' ? 'left-full top-0 ml-2' : 'right-0 mt-2'}
          `}
        >
          <button
            onClick={() => { onEdit(); setIsOpen(false); }}
            className="w-full px-4 py-2.5 text-left flex items-center gap-3 hover:bg-slate-50 transition-colors"
          >
            <Edit2 size={16} className="text-slate-500" />
            <span className="text-slate-700 font-bold text-sm">Editar</span>
          </button>
          
          <div className="h-[1px] bg-slate-100 mx-2" />

          <button
            onClick={() => { 
              if(window.confirm('¿Estás seguro?')) onDelete(); 
              setIsOpen(false); 
            }}
            className="w-full px-4 py-2.5 text-left flex items-center gap-3 hover:bg-red-50 transition-colors"
          >
            <Trash2 size={16} className="text-red-500" />
            <span className="text-red-600 font-bold text-sm">Eliminar</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default ActionMenu;