// src/components/ModalAsignarCapitan.tsx
import React, { useState, useEffect } from 'react';
import { X, Shield, Box, UserPlus } from 'lucide-react';

interface CajaDisponible {
  id: string;
  nombre: string;
}

interface ModalAsignarCapitanProps {
  isOpen: boolean;
  onClose: () => void;
  cajasDisponibles: CajaDisponible[];
  onSave: (nombre: string, cajasAsignadas: string[]) => void;
}

const ModalAsignarCapitan: React.FC<ModalAsignarCapitanProps> = ({ isOpen, onClose, cajasDisponibles, onSave }) => {
  const [nombre, setNombre] = useState('');
  const [cajasSeleccionadas, setCajasSeleccionadas] = useState<string[]>([]);

  // Limpiar el formulario cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      setNombre('');
      setCajasSeleccionadas([]);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const toggleCaja = (cajaId: string) => {
    setCajasSeleccionadas(prev => 
      prev.includes(cajaId) ? prev.filter(id => id !== cajaId) : [...prev, cajaId]
    );
  };

  const handleGuardar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim() || cajasSeleccionadas.length === 0) return;
    onSave(nombre.trim(), cajasSeleccionadas);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
        
        <div className="bg-indigo-600 p-5 flex justify-between items-center text-white shrink-0">
          <h2 className="font-black flex items-center gap-2 text-lg">
            <Shield size={20}/> Nuevo Capitán
          </h2>
          <button onClick={onClose} className="text-indigo-200 hover:text-white transition-colors">
            <X size={20}/>
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          <p className="text-xs font-bold text-slate-500 mb-5 leading-relaxed">
            Crea un acceso limitado para un asistente. Solo podrá ver y gestionar las cajas que le asignes.
          </p>

          <form id="form-capitan" onSubmit={handleGuardar} className="space-y-5">
            <div>
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-wide ml-1">Nombre del Capitán</label>
              <input 
                type="text" 
                placeholder="Ej. Pedro Gómez" 
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="w-full mt-1.5 bg-slate-50 border border-slate-200 text-slate-800 text-sm font-bold rounded-xl p-3.5 focus:outline-none focus:border-indigo-500 transition shadow-sm"
                required
              />
            </div>

            <div>
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-wide ml-1 mb-2 block">
                Cajas a su cargo
              </label>
              {cajasDisponibles.length === 0 ? (
                <p className="text-sm text-red-500 font-bold bg-red-50 p-3 rounded-xl border border-red-100">
                  No hay cajas creadas en este día.
                </p>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {cajasDisponibles.map(caja => (
                    <label key={caja.id} className={`flex items-center justify-between cursor-pointer p-3 rounded-xl border transition-all ${cajasSeleccionadas.includes(caja.id) ? 'bg-indigo-50 border-indigo-200' : 'bg-slate-50 border-slate-200 hover:border-indigo-300'}`}>
                      <span className={`text-sm font-bold flex items-center gap-2 ${cajasSeleccionadas.includes(caja.id) ? 'text-indigo-700' : 'text-slate-700'}`}>
                        <Box size={16} /> {caja.nombre}
                      </span>
                      <input 
                        type="checkbox" 
                        checked={cajasSeleccionadas.includes(caja.id)} 
                        onChange={() => toggleCaja(caja.id)} 
                        className="w-5 h-5 accent-indigo-600 cursor-pointer"
                      />
                    </label>
                  ))}
                </div>
              )}
            </div>
          </form>
        </div>

        <div className="p-6 pt-0 shrink-0 bg-white">
          <button 
            type="submit" 
            form="form-capitan"
            disabled={!nombre.trim() || cajasSeleccionadas.length === 0}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-black text-sm p-4 rounded-xl transition shadow-md flex items-center justify-center gap-2 uppercase tracking-wide"
          >
            <UserPlus size={18} /> Crear Capitán
          </button>
        </div>

      </div>
    </div>
  );
};

export default ModalAsignarCapitan;