// src/components/InstallGuideModal.tsx
import React from 'react';
import { X, Share, PlusSquare, MoreVertical, Smartphone } from 'lucide-react';

interface InstallGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const InstallGuideModal: React.FC<InstallGuideModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden relative animate-in zoom-in-95">
        
        {/* Cabecera */}
        <div className="bg-indigo-600 p-4 text-white flex justify-between items-center">
          <h3 className="font-black flex items-center gap-2 text-lg">
            <Smartphone size={20} /> Instalar Aplicación
          </h3>
          <button onClick={onClose} className="p-1.5 hover:bg-indigo-500 rounded-xl transition">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Instrucciones iOS */}
          <div>
            <h4 className="font-black text-slate-800 mb-3 flex items-center gap-2 text-base">
              🍎 En iPhone (Safari)
            </h4>
            <ol className="text-sm text-slate-600 space-y-3 ml-2 font-medium">
              <li className="flex items-center gap-2">
                1. Toca el botón <b>Compartir</b> <Share size={16} className="text-blue-500"/> en la barra inferior.
              </li>
              <li className="flex items-center gap-2">
                2. Desliza hacia abajo y toca <b>Agregar a inicio</b> <PlusSquare size={16} className="text-slate-800"/>.
              </li>
              <li>3. Toca <b>Agregar</b> en la esquina superior derecha.</li>
            </ol>
          </div>

          <div className="h-px w-full bg-slate-200 rounded-full"></div>

          {/* Instrucciones Android */}
          <div>
            <h4 className="font-black text-slate-800 mb-3 flex items-center gap-2 text-base">
              🤖 En Android (Chrome)
            </h4>
            <ol className="text-sm text-slate-600 space-y-3 ml-2 font-medium">
              <li className="flex items-center gap-2">
                1. Toca el menú <b>Opciones</b> <MoreVertical size={16} className="text-slate-800"/> arriba a la derecha.
              </li>
              <li>2. Selecciona <b>Instalar aplicación</b> o <b>Agregar a la pantalla principal</b>.</li>
              <li>3. Confirma tocando <b>Instalar</b>.</li>
            </ol>
          </div>
        </div>

        {/* Pie del modal */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 text-center">
          <button 
            onClick={onClose} 
            className="w-full py-3 bg-slate-200 hover:bg-slate-300 text-slate-700 font-black rounded-xl transition shadow-sm"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};

export default InstallGuideModal;