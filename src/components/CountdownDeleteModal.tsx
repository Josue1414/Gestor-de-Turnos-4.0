
import React, { useState, useEffect } from 'react';
import { AlertTriangle, Trash2 } from 'lucide-react';

interface CountdownDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string; // <-- NUEVA PROPIEDAD
}

const CountdownDeleteModal: React.FC<CountdownDeleteModalProps> = ({ isOpen, onClose, onConfirm, title, message }) => {
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    if (isOpen) {
      setCountdown(3);
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 text-center animate-in zoom-in-95 duration-200">
        
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
          <AlertTriangle size={32} className="text-red-600" />
        </div>
        
        <h3 className="text-xl font-black text-slate-800 mb-2">¿Confirmar Eliminación?</h3>
        <p className="text-sm font-medium text-slate-600 mb-6">
          Estás a punto de eliminar <b className="text-slate-800">"{title}"</b> de forma permanente. <br/>
          <span className="text-red-500 font-bold">{message}</span>
        </p>
        
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 px-5 py-3 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition">
            Cancelar
          </button>
          <button 
            onClick={() => { onConfirm(); onClose(); }} 
            disabled={countdown > 0}
            className={`flex-1 px-5 py-3 rounded-xl font-black text-white transition flex items-center justify-center gap-2 ${countdown > 0 ? 'bg-red-400 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700 shadow-lg'}`}
          >
            {countdown > 0 ? `Esperar ${countdown}s...` : <><Trash2 size={18} /> Sí, Eliminar</>}
          </button>
        </div>

      </div>
    </div>
  );
};

export default CountdownDeleteModal;