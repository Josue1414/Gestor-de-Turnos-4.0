import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Star, Plus, Clock, ArrowRight, Trash2 } from 'lucide-react';
import TextInput from './TextInput';
import TimeInput from './TimeInput';

// Definimos la estructura interna de un turno especial
interface TurnoEspecialConfig {
  id: string;
  inicio: string; // HH:mm
  fin: string;    // HH:mm
}

interface SpecialBoxModalProps {
  isOpen: boolean;
  onClose: () => void;
  // Cambiamos la firma para pasar el nombre y la lista de turnos configurados
  onCreate: (nombre: string, turnos: TurnoEspecialConfig[]) => void;
}

const SpecialBoxModal: React.FC<SpecialBoxModalProps> = ({ isOpen, onClose, onCreate }) => {
  const [nombre, setNombre] = useState('Registro Especial');
  // Iniciamos con un turno por defecto (09:00 - 11:30, por ejemplo)
  const [turnos, setTurnos] = useState<TurnoEspecialConfig[]>([
    { id: 'initial_shift', inicio: "09:00", fin: "11:30" }
  ]);

  if (!isOpen) return null;

  // Función para agregar un nuevo bloque de tiempo vacío
  const agregarTurno = () => {
    setTurnos([...turnos, { id: `shift_${Date.now()}`, inicio: "12:00", fin: "14:00" }]);
  };

  // Función para actualizar un horario específico
  const actualizarHorario = (id: string, campo: 'inicio' | 'fin', valor: string) => {
    setTurnos(turnos.map(t => t.id === id ? { ...t, [campo]: valor } : t));
  };

  // Función para eliminar un turno de la lista
  const eliminarTurno = (id: string) => {
    if (turnos.length > 1) { // Mínimo un turno
      setTurnos(turnos.filter(t => t.id !== id));
    }
  };

  const handleCreate = () => {
    if (nombre.trim() && turnos.length > 0) {
      // Pasamos los datos configurados
      onCreate(nombre.trim(), turnos);
      // Reiniciamos para la próxima vez
      setNombre('Registro Especial');
      setTurnos([{ id: 'initial_shift', inicio: "09:00", fin: "11:30" }]);
      onClose();
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Overlay con desenfoque */}
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full relative z-10 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Cabecera con estilo "Especial" (Indigo/Yellow) */}
        <div className="p-5 bg-indigo-600 text-white flex justify-between items-center shrink-0">
          <h3 className="font-bold flex items-center gap-2 text-lg">
            <Star size={20} className="text-yellow-400 fill-yellow-400" /> Configurar Columna Especial
          </h3>
          <button onClick={onClose} className="text-indigo-200 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Cuerpo del Modal - Con scroll si hay muchos turnos */}
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto bg-slate-50/50">
          {/* Identificador de la Caja */}
          <div>
            <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">
              Identificador de la Caja
            </label>
            <TextInput 
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              onClear={() => setNombre('')}
              placeholder="Ej: Registro VIP / Turno Largo"
              variant="light"
              autoFocus
            />
          </div>

          {/* Configuración de Turnos (Ramillete de Horarios) */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <label className="block text-xs font-black text-indigo-600 uppercase tracking-widest flex items-center gap-2">
                <Clock size={14} /> Definir Ramillete de Horarios (Total: {turnos.length})
              </label>
              <button 
                onClick={agregarTurno}
                className="text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors"
              >
                <Plus size={14} /> Agregar Turno
              </button>
            </div>
            
            <div className="space-y-3">
              {turnos.map((turno, index) => (
                <div key={turno.id} className="flex flex-col sm:flex-row items-center gap-2 bg-white p-3 sm:p-4 rounded-2xl border border-slate-100 shadow-sm relative group">
                  {/* Botón para eliminar turno (oculto por defecto) */}
                  {turnos.length > 1 && (
                    <button 
                      onClick={() => eliminarTurno(turno.id)}
                      className="absolute -top-1.5 -right-1.5 bg-white text-slate-300 hover:text-red-500 p-1 rounded-full opacity-0 group-hover:opacity-100 transition-all shadow-sm border"
                      title="Eliminar este turno"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                  
                  <span className="text-xs font-black text-slate-400 shrink-0 w-8 text-center sm:text-left">
                    #{index + 1}
                  </span>
                  
                  <div className="flex flex-col sm:flex-row items-center gap-2 w-full">
                    <TimeInput 
                      label="Empieza en" 
                      value={turno.inicio} 
                      onChange={(valor) => actualizarHorario(turno.id, 'inicio', valor)} 
                    />
                    
                    {/* Flecha responsiva */}
                    <div className="text-slate-300 rotate-90 sm:rotate-0 my-1 sm:my-0 sm:mt-4">
                      <ArrowRight size={18} />
                    </div>
                    
                    <TimeInput 
                      label="Termina en" 
                      value={turno.fin} 
                      onChange={(valor) => actualizarHorario(turno.id, 'fin', valor)} 
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Pie del Modal */}
        <div className="p-4 bg-slate-50 flex gap-3 justify-end border-t border-slate-100 shrink-0">
          <button 
            onClick={onClose} 
            className="px-4 py-2 text-sm font-bold text-slate-500 hover:bg-slate-200 rounded-xl transition-colors"
          >
            Cancelar
          </button>
          <button 
            onClick={handleCreate}
            disabled={!nombre.trim() || turnos.length === 0}
            className="px-6 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md shadow-indigo-200 flex items-center gap-2 transition-all disabled:bg-slate-300 disabled:shadow-none"
          >
            <Plus size={18} /> Crear con Horarios Rebeldes
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default SpecialBoxModal;